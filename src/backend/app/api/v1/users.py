from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User
from app.core.security import get_password_hash
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/users", tags=["Users Management"])


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=4)
    full_name: Optional[str] = None
    role: str = Field(default="OPERATOR")


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime


@router.get("", response_model=List[UserResponse])
async def list_users(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    query = select(User).order_by(User.created_at.asc())
    users = (await session.exec(query)).all()
    return [
        UserResponse(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at
        )
        for u in users
    ]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    req: UserCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    # Check if username exists
    existing = (await session.exec(select(User).where(User.username == req.username))).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Пользователь с именем '{req.username}' уже существует")

    normalized_role = req.role.upper()
    if normalized_role not in {"ADMINISTRATOR", "SUPERVISOR", "OPERATOR", "AUDITOR", "USER"}:
        normalized_role = "OPERATOR"

    user = User(
        username=req.username.strip(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip() if req.full_name else None,
        role=normalized_role,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    await record_audit_event(
        session, "USER_CREATED", "User", str(user.id), current_user.id,
        {"username": user.username, "role": user.role}
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    req: UserUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if req.username is not None and req.username.strip():
        # Check uniqueness if username changed
        if req.username.strip() != user.username:
            existing = (await session.exec(select(User).where(User.username == req.username.strip()))).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Пользователь с именем '{req.username}' уже существует")
            user.username = req.username.strip()

    if req.password is not None and req.password.strip():
        user.password_hash = get_password_hash(req.password.strip())

    if req.full_name is not None:
        user.full_name = req.full_name.strip() if req.full_name else None

    if req.role is not None:
        normalized_role = req.role.upper()
        if normalized_role in {"ADMINISTRATOR", "SUPERVISOR", "OPERATOR", "AUDITOR", "USER"}:
            user.role = normalized_role

    if req.is_active is not None:
        user.is_active = req.is_active

    session.add(user)
    await session.commit()
    await session.refresh(user)

    await record_audit_event(
        session, "USER_UPDATED", "User", str(user.id), current_user.id,
        {"username": user.username, "role": user.role}
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Невозможно удалить текущего пользователя")

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    await session.delete(user)
    await session.commit()

    await record_audit_event(
        session, "USER_DELETED", "User", str(user_id), current_user.id,
        {"username": user.username}
    )

    return {"message": f"Пользователь '{user.username}' успешно удален"}
