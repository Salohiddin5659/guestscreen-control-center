from typing import Optional
from uuid import UUID
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.topology import Cashier, Branch, Region
from app.models.content import AdvertisingBlock


async def resolve_active_block_id(
    session: AsyncSession,
    cashier_id: UUID,
    target_area: str  # FULL_SCREEN or MODE32_PROMO
) -> Optional[UUID]:
    """
    Executes the 3-tier precedence cascade:
    Cashier Override -> Branch Override -> Regional Default.
    """
    query = (
        select(Cashier, Branch, Region)
        .join(Branch, Cashier.branch_id == Branch.id)
        .join(Region, Branch.region_id == Region.id)
        .where(Cashier.id == cashier_id, Cashier.enabled == True)
    )
    result = (await session.exec(query)).first()
    if not result:
        return None

    cashier, branch, region = result

    if target_area == "FULL_SCREEN":
        return (
            cashier.override_full_screen_block_id
            or branch.override_full_screen_block_id
            or region.default_full_screen_block_id
        )
    elif target_area == "MODE32_PROMO":
        return (
            cashier.override_mode32_block_id
            or branch.override_mode32_block_id
            or region.default_mode32_block_id
        )
    else:
        raise ValueError(f"Unknown target area: {target_area}")


async def resolve_active_block(
    session: AsyncSession,
    cashier_id: UUID,
    target_area: str
) -> Optional[AdvertisingBlock]:
    block_id = await resolve_active_block_id(session, cashier_id, target_area)
    if not block_id:
        return None
    return await session.get(AdvertisingBlock, block_id)
