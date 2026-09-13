from fastapi import APIRouter, Depends
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.security import User
from app.models.topology import Cashier
from app.models.content import AdvertisingBlock
from app.models.publication import PublicationBatch

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def get_dashboard_overview(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    cashiers = (await session.exec(select(Cashier))).all()
    total_cashiers = len(cashiers)
    online_cashiers = sum(1 for c in cashiers if c.last_sync_status in ("SUCCESS", "ONLINE"))
    offline_cashiers = sum(1 for c in cashiers if c.last_sync_status in ("OFFLINE", "UNKNOWN"))
    awaiting_restart = sum(1 for c in cashiers if c.last_sync_status == "PUBLISHED_AWAITING_RESTART")

    active_blocks = (await session.exec(select(AdvertisingBlock).where(AdvertisingBlock.is_active == True))).all()
    recent_batches = (await session.exec(select(PublicationBatch).order_by(PublicationBatch.created_at.desc()).limit(5))).all()

    return {
        "total_cashiers": total_cashiers,
        "online_cashiers": online_cashiers,
        "offline_cashiers": offline_cashiers,
        "awaiting_restart": awaiting_restart,
        "active_advertising_blocks": len(active_blocks),
        "recent_batches": recent_batches
    }
