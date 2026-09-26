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


from datetime import datetime, timezone

async def resolve_active_block(
    session: AsyncSession,
    cashier_id: UUID,
    target_area: str
) -> Optional[AdvertisingBlock]:
    now = datetime.now(timezone.utc)
    block_id = await resolve_active_block_id(session, cashier_id, target_area)
    if block_id:
        block = await session.get(AdvertisingBlock, block_id)
        if block and block.is_active:
            # Check schedule validity
            is_valid_time = True
            if block.valid_from and block.valid_from > now:
                is_valid_time = False
            if block.valid_to and block.valid_to < now:
                is_valid_time = False

            if is_valid_time:
                return block

    # Fallback to designated default template for this area
    default_query = select(AdvertisingBlock).where(
        AdvertisingBlock.area == target_area,
        AdvertisingBlock.is_default == True,
        AdvertisingBlock.is_active == True
    )
    return (await session.exec(default_query)).first()
