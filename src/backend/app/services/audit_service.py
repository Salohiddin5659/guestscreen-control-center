import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.audit import AuditLog

logger = logging.getLogger("gs_control_center.audit")


async def record_audit_event(
    session: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[UUID] = None,
    payload_diff: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    safe_diff = None
    if payload_diff is not None:
        try:
            import json
            safe_diff = json.loads(json.dumps(payload_diff, default=str))
        except Exception:
            safe_diff = {"error": "unserializable"}

    log_entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        payload_diff=safe_diff,
        ip_address=ip_address,
        timestamp=datetime.now(timezone.utc)
    )
    session.add(log_entry)
    await session.commit()
    logger.info(f"Audit event recorded: [{action}] on {entity_type}:{entity_id} by {user_id}")
    return log_entry
