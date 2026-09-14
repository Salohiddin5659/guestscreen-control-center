from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User
from app.models.settings import SystemSettings
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/settings", tags=["System Settings"])


class SettingsUpdate(BaseModel):
    worker_concurrency: int = Field(default=15, ge=5, le=30)
    max_concurrent_per_branch: int = Field(default=2, ge=1, le=4)
    ssh_connect_timeout_seconds: int = Field(default=10, ge=3, le=60)
    ssh_command_timeout_seconds: int = Field(default=45, ge=10, le=180)
    sftp_timeout_seconds: int = Field(default=60, ge=10, le=300)
    minio_media_retention_days: int = Field(default=30, ge=1, le=365)
    cashier_backup_retention_days: int = Field(default=7, ge=1, le=90)


@router.get("", response_model=SystemSettings)
async def get_system_settings(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    settings_obj = (await session.exec(select(SystemSettings).where(SystemSettings.id == 1))).first()
    if not settings_obj:
        settings_obj = SystemSettings(id=1)
        session.add(settings_obj)
        await session.commit()
        await session.refresh(settings_obj)
    return settings_obj


@router.put("", response_model=SystemSettings)
async def update_system_settings(
    req: SettingsUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "SUPERVISOR"))
):
    settings_obj = (await session.exec(select(SystemSettings).where(SystemSettings.id == 1))).first()
    if not settings_obj:
        settings_obj = SystemSettings(id=1)

    for k, v in req.model_dump().items():
        setattr(settings_obj, k, v)
    settings_obj.updated_at = datetime.now(timezone.utc)

    session.add(settings_obj)
    await session.commit()
    await session.refresh(settings_obj)

    await record_audit_event(session, "SETTINGS_UPDATED", "SystemSettings", "1", current_user.id, req.model_dump())
    return settings_obj
