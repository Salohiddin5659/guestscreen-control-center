import logging
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User, SSHCredential
from app.models.topology import Region, Branch, Cashier, MaintenanceWindow
from app.adapters.factory import CashRegisterAdapterFactory
from app.services.audit_service import record_audit_event
from app.core.security import encrypt_secret, decrypt_secret

logger = logging.getLogger("gs_control_center.topology")
router = APIRouter(tags=["Topology"])


# --- Schemas ---
class RegionCreate(BaseModel):
    name: str
    code: str
    default_full_screen_block_id: Optional[UUID] = None
    default_mode32_block_id: Optional[UUID] = None


class RegionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    default_full_screen_block_id: Optional[UUID] = None
    default_mode32_block_id: Optional[UUID] = None


class BranchCreate(BaseModel):
    region_id: UUID
    name: str
    code: str
    address: Optional[str] = None
    override_full_screen_block_id: Optional[UUID] = None
    override_mode32_block_id: Optional[UUID] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    region_id: Optional[UUID] = None
    override_full_screen_block_id: Optional[UUID] = None
    override_mode32_block_id: Optional[UUID] = None


class CashierCreate(BaseModel):
    branch_id: UUID
    name: str
    ip_address: str
    ssh_port: int = 22
    ssh_username: str
    ssh_password: str
    enabled: bool = True
    override_full_screen_block_id: Optional[UUID] = None
    override_mode32_block_id: Optional[UUID] = None

    @field_validator("ssh_username")
    @classmethod
    def validate_ssh_username(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Логин SSH обязателен и не может быть пустым")
        return v.strip()

    @field_validator("ssh_password")
    @classmethod
    def validate_ssh_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Пароль SSH обязателен и не может быть пустым")
        return v.strip()


class CashierUpdate(BaseModel):
    branch_id: Optional[UUID] = None
    name: Optional[str] = None
    ip_address: Optional[str] = None
    ssh_port: Optional[int] = None
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    enabled: Optional[bool] = None
    override_full_screen_block_id: Optional[UUID] = None
    override_mode32_block_id: Optional[UUID] = None

    @field_validator("ssh_username")
    @classmethod
    def validate_ssh_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Логин SSH не может быть пустым")
            return v.strip()
        return v

    @field_validator("ssh_password")
    @classmethod
    def validate_ssh_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            return None
        return v


class CashierResponse(BaseModel):
    id: UUID
    branch_id: UUID
    name: str
    ip_address: str
    ssh_port: int
    ssh_username: str = ""
    ssh_credential_id: Optional[UUID] = None
    enabled: bool
    override_full_screen_block_id: Optional[UUID] = None
    override_mode32_block_id: Optional[UUID] = None
    current_full_screen_block_id: Optional[UUID] = None
    current_mode32_block_id: Optional[UUID] = None
    current_content_version: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    last_sync_status: str
    guest_screen_version: Optional[str] = None
    has_ssh_password: bool
    created_at: datetime
    updated_at: datetime


def _format_cashier_response(cashier: Cashier, ssh_username: str = "") -> CashierResponse:
    return CashierResponse(
        id=cashier.id,
        branch_id=cashier.branch_id,
        name=cashier.name,
        ip_address=cashier.ip_address,
        ssh_port=cashier.ssh_port,
        ssh_username=ssh_username,
        ssh_credential_id=cashier.ssh_credential_id,
        enabled=cashier.enabled,
        override_full_screen_block_id=cashier.override_full_screen_block_id,
        override_mode32_block_id=cashier.override_mode32_block_id,
        current_full_screen_block_id=cashier.current_full_screen_block_id,
        current_mode32_block_id=cashier.current_mode32_block_id,
        current_content_version=cashier.current_content_version,
        last_seen_at=cashier.last_seen_at,
        last_sync_status=cashier.last_sync_status,
        guest_screen_version=cashier.guest_screen_version,
        has_ssh_password=(cashier.ssh_password_encrypted is not None and len(cashier.ssh_password_encrypted) > 0),
        created_at=cashier.created_at,
        updated_at=cashier.updated_at
    )


# --- Endpoints: Regions ---
@router.get("/regions", response_model=List[Region])
async def list_regions(session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return (await session.exec(select(Region))).all()


@router.post("/regions", response_model=Region)
async def create_region(
    req: RegionCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    region = Region(**req.model_dump())
    session.add(region)
    await session.commit()
    await session.refresh(region)
    await record_audit_event(session, "REGION_CREATED", "Region", str(region.id), current_user.id, req.model_dump())
    return region


@router.put("/regions/{region_id}", response_model=Region)
async def update_region(
    region_id: UUID,
    req: RegionUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    region = await session.get(Region, region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Регион не найден")

    if req.name is not None and req.name.strip():
        region.name = req.name.strip()
    if req.code is not None and req.code.strip():
        region.code = req.code.strip()
    if req.default_full_screen_block_id is not None:
        region.default_full_screen_block_id = req.default_full_screen_block_id
    if req.default_mode32_block_id is not None:
        region.default_mode32_block_id = req.default_mode32_block_id

    region.updated_at = datetime.now(timezone.utc)
    session.add(region)
    await session.commit()
    await session.refresh(region)
    await record_audit_event(session, "REGION_UPDATED", "Region", str(region.id), current_user.id, req.model_dump())
    return region


@router.delete("/regions/{region_id}")
async def delete_region(
    region_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    region = await session.get(Region, region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Регион не найден")

    branches = (await session.exec(select(Branch).where(Branch.region_id == region_id))).all()
    if branches:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Невозможно удалить регион: к нему привязано {len(branches)} ресторанов. Сначала переместите или удалите рестораны."
        )

    region_name = region.name
    await session.delete(region)
    await session.commit()
    await record_audit_event(session, "REGION_DELETED", "Region", str(region_id), current_user.id, {"name": region_name})
    return {"message": "Регион успешно удален"}


# --- Endpoints: Branches ---
@router.get("/branches", response_model=List[Branch])
async def list_branches(
    region_id: Optional[UUID] = None,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Branch)
    if region_id:
        query = query.where(Branch.region_id == region_id)
    query = query.order_by(Branch.name)
    return (await session.exec(query)).all()


@router.post("/branches", response_model=Branch)
async def create_branch(
    req: BranchCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    branch = Branch(**req.model_dump())
    session.add(branch)
    await session.commit()
    await session.refresh(branch)

    # Automatically create default maintenance window for the branch
    mw = MaintenanceWindow(branch_id=branch.id)
    session.add(mw)
    await session.commit()

    await record_audit_event(session, "BRANCH_CREATED", "Branch", str(branch.id), current_user.id, req.model_dump())
    return branch


@router.put("/branches/{branch_id}", response_model=Branch)
async def update_branch(
    branch_id: UUID,
    req: BranchUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Ресторан/филиал не найден")

    if req.name is not None and req.name.strip():
        branch.name = req.name.strip()
    if req.code is not None and req.code.strip():
        branch.code = req.code.strip()
    if req.address is not None:
        branch.address = req.address.strip()
    if req.region_id is not None:
        reg = await session.get(Region, req.region_id)
        if not reg:
            raise HTTPException(status_code=404, detail="Указанный регион не найден")
        branch.region_id = req.region_id
    if req.override_full_screen_block_id is not None:
        branch.override_full_screen_block_id = req.override_full_screen_block_id
    if req.override_mode32_block_id is not None:
        branch.override_mode32_block_id = req.override_mode32_block_id

    branch.updated_at = datetime.now(timezone.utc)
    session.add(branch)
    await session.commit()
    await session.refresh(branch)
    await record_audit_event(session, "BRANCH_UPDATED", "Branch", str(branch.id), current_user.id, req.model_dump())
    return branch


@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    branch = await session.get(Branch, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Ресторан/филиал не найден")

    cashiers = (await session.exec(select(Cashier).where(Cashier.branch_id == branch_id))).all()
    if cashiers:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Невозможно удалить ресторан: к нему привязано {len(cashiers)} касс. Сначала переместите или удалите кассы."
        )

    mw = (await session.exec(select(MaintenanceWindow).where(MaintenanceWindow.branch_id == branch_id))).first()
    if mw:
        await session.delete(mw)

    branch_name = branch.name
    await session.delete(branch)
    await session.commit()
    await record_audit_event(session, "BRANCH_DELETED", "Branch", str(branch_id), current_user.id, {"name": branch_name})
    return {"message": "Ресторан/филиал успешно удален"}


# --- Endpoints: Cashiers ---
@router.get("/cashiers", response_model=List[CashierResponse])
async def list_cashiers(
    branch_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Cashier).join(Branch, Cashier.branch_id == Branch.id, isouter=True)
    if branch_id:
        query = query.where(Cashier.branch_id == branch_id)
    if status_filter:
        query = query.where(Cashier.last_sync_status == status_filter)
    query = query.order_by(Branch.name.asc(), Cashier.name.asc())
    cashiers = (await session.exec(query)).all()

    # Pre-fetch SSH credentials in batch
    creds = (await session.exec(select(SSHCredential))).all()
    cred_map = {c.id: c.username for c in creds}

    return [_format_cashier_response(c, ssh_username=cred_map.get(c.ssh_credential_id, "")) for c in cashiers]


@router.post("/cashiers", response_model=CashierResponse)
async def create_cashier(
    req: CashierCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    # Check if branch exists
    branch = await session.get(Branch, req.branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Филиал не найден")

    # Find or create SSHCredential with requested username
    cred_query = select(SSHCredential).where(SSHCredential.username == req.ssh_username)
    cred = (await session.exec(cred_query)).first()
    if not cred:
        cred = SSHCredential(
            name=f"SSH ({req.ssh_username})",
            auth_type="PASSWORD",
            username=req.ssh_username
        )
        session.add(cred)
        await session.commit()
        await session.refresh(cred)

    data = req.model_dump(exclude={"ssh_password", "ssh_username", "ssh_credential_id"})
    cashier = Cashier(**data)
    cashier.ssh_credential_id = cred.id
    cashier.ssh_password_encrypted = encrypt_secret(req.ssh_password)

    session.add(cashier)
    await session.commit()
    await session.refresh(cashier)

    # Immediate connectivity probe on creation
    try:
        from app.services.heartbeat import check_tcp_port
        is_online = await check_tcp_port(cashier.ip_address, cashier.ssh_port, timeout=2.0)
        now = datetime.now(timezone.utc)
        if is_online:
            cashier.last_seen_at = now
            cashier.last_sync_status = "SUCCESS"
        else:
            cashier.last_sync_status = "OFFLINE"
        session.add(cashier)
        await session.commit()
        await session.refresh(cashier)
    except Exception as e:
        logger.warning(f"Initial connectivity probe failed for {cashier.name}: {e}")

    # Safe audit data (strictly ZERO credentials/passwords logged)
    audit_data = {
        "name": cashier.name,
        "ip_address": cashier.ip_address,
        "ssh_port": cashier.ssh_port,
        "branch_id": str(cashier.branch_id),
        "ssh_username": req.ssh_username,
        "has_ssh_password": True
    }
    await record_audit_event(session, "CASHIER_CREATED", "Cashier", str(cashier.id), current_user.id, audit_data)
    return _format_cashier_response(cashier, ssh_username=req.ssh_username)


@router.put("/cashiers/{cashier_id}", response_model=CashierResponse)
@router.patch("/cashiers/{cashier_id}", response_model=CashierResponse)
async def update_cashier(
    cashier_id: UUID,
    req: CashierUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    cashier = await session.get(Cashier, cashier_id)
    if not cashier:
        raise HTTPException(status_code=404, detail="Касса не найдена")

    if req.branch_id is not None:
        branch = await session.get(Branch, req.branch_id)
        if not branch:
            raise HTTPException(status_code=400, detail="Указанный ресторан не найден")
        cashier.branch_id = req.branch_id
    if req.name is not None:
        cashier.name = req.name
    if req.ip_address is not None:
        cashier.ip_address = req.ip_address
    if req.ssh_port is not None:
        cashier.ssh_port = req.ssh_port
    if req.enabled is not None:
        cashier.enabled = req.enabled
    if req.override_full_screen_block_id is not None:
        cashier.override_full_screen_block_id = req.override_full_screen_block_id
    if req.override_mode32_block_id is not None:
        cashier.override_mode32_block_id = req.override_mode32_block_id

    # If new password provided and non-empty, update. Otherwise leave unchanged!
    if req.ssh_password and req.ssh_password.strip():
        cashier.ssh_password_encrypted = encrypt_secret(req.ssh_password.strip())

    # If new username provided, link/update SSHCredential
    if req.ssh_username and req.ssh_username.strip():
        cred_query = select(SSHCredential).where(SSHCredential.username == req.ssh_username.strip())
        cred = (await session.exec(cred_query)).first()
        if not cred:
            cred = SSHCredential(
                name=f"SSH ({req.ssh_username.strip()})",
                auth_type="PASSWORD",
                username=req.ssh_username.strip()
            )
            session.add(cred)
            await session.commit()
            await session.refresh(cred)
        cashier.ssh_credential_id = cred.id

    if req.ip_address is not None or req.ssh_port is not None:
        try:
            from app.services.heartbeat import check_tcp_port
            is_online = await check_tcp_port(cashier.ip_address, cashier.ssh_port, timeout=2.0)
            now = datetime.now(timezone.utc)
            if is_online:
                cashier.last_seen_at = now
                cashier.last_sync_status = "SUCCESS"
            else:
                cashier.last_sync_status = "OFFLINE"
        except Exception:
            pass

    cashier.updated_at = datetime.now(timezone.utc)
    session.add(cashier)
    await session.commit()
    await session.refresh(cashier)

    ssh_username = ""
    if cashier.ssh_credential_id:
        cred = await session.get(SSHCredential, cashier.ssh_credential_id)
        if cred:
            ssh_username = cred.username

    audit_data = {
        "name": cashier.name,
        "ip_address": cashier.ip_address,
        "ssh_username": ssh_username,
        "has_ssh_password": bool(cashier.ssh_password_encrypted)
    }
    await record_audit_event(session, "CASHIER_UPDATED", "Cashier", str(cashier.id), current_user.id, audit_data)
    return _format_cashier_response(cashier, ssh_username=ssh_username)


@router.get("/cashiers/{cashier_id}", response_model=CashierResponse)
async def get_cashier(
    cashier_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    cashier = await session.get(Cashier, cashier_id)
    if not cashier:
        raise HTTPException(status_code=404, detail="Касса не найдена")

    ssh_username = ""
    if cashier.ssh_credential_id:
        cred = await session.get(SSHCredential, cashier.ssh_credential_id)
        if cred:
            ssh_username = cred.username

    return _format_cashier_response(cashier, ssh_username=ssh_username)


@router.delete("/cashiers/{cashier_id}")
async def delete_cashier(
    cashier_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    cashier = await session.get(Cashier, cashier_id)
    if not cashier:
        raise HTTPException(status_code=404, detail="Касса не найдена")

    cashier_name = cashier.name
    cashier_ip = cashier.ip_address
    await session.delete(cashier)
    await session.commit()
    await record_audit_event(session, "CASHIER_DELETED", "Cashier", str(cashier_id), current_user.id, {"name": cashier_name, "ip": cashier_ip})
    return {"message": "Касса успешно удалена"}


@router.post("/cashiers/{cashier_id}/test-connection")
async def test_cashier_connection(
    cashier_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    cashier = await session.get(Cashier, cashier_id)
    if not cashier:
        raise HTTPException(status_code=404, detail="Касса не найдена")

    ssh_username = None
    if cashier.ssh_credential_id:
        cred = await session.get(SSHCredential, cashier.ssh_credential_id)
        if cred and cred.username and cred.username.strip():
            ssh_username = cred.username.strip()

    if not ssh_username:
        raise HTTPException(status_code=400, detail="SSH username is not configured for this cashier")

    # In-memory decryption of SSH password
    password = None
    if cashier.ssh_password_encrypted:
        try:
            password = decrypt_secret(cashier.ssh_password_encrypted)
        except Exception as e:
            logger.warning(f"Failed to decrypt in-memory password for {cashier.name}: {e}")

    adapter = CashRegisterAdapterFactory.get_adapter(
        cashier_id=cashier.id,
        host=cashier.ip_address,
        port=cashier.ssh_port,
        username=ssh_username,
        password=password
    )
    try:
        health = await adapter.health_check()
        insp = await adapter.inspect() if health.is_online else None

        if health.is_online:
            cashier.last_seen_at = datetime.now(timezone.utc)
            cashier.last_sync_status = "SUCCESS"
            if insp and insp.guest_screen_version:
                cashier.guest_screen_version = insp.guest_screen_version
            await session.commit()
        else:
            cashier.last_sync_status = "OFFLINE"
            await session.commit()

        return {
            "online": health.is_online,
            "response_time_ms": health.response_time_ms,
            "inspection": insp.model_dump() if insp else None,
            "error_message": health.error_message or (insp.error_message if insp else None)
        }
    finally:
        await adapter.close()

