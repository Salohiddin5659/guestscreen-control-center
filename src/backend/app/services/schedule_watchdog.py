import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlmodel import select
from app.db.session import async_session_factory
from app.models.topology import Cashier
from app.models.content import AdvertisingBlock
from app.services.audit_service import record_audit_event
from app.services.orchestrator import PublicationOrchestrator

logger = logging.getLogger("gs_control_center.schedule_watchdog")


async def check_and_revert_expired_schedules() -> int:
    """
    Checks all cashiers for expired advertising schedules.
    If a cashier's currently assigned template has passed its valid_to expiration,
    automatically reverts the cashier to the designated default (fallback) template
    and triggers a publication to update the cashier's secondary screen.
    """
    reverted_cashiers_count = 0
    now = datetime.now(timezone.utc)

    try:
        async with async_session_factory() as session:
            # 1. Load active default templates for each area
            default_full_screen = (await session.exec(
                select(AdvertisingBlock).where(
                    AdvertisingBlock.area == "FULL_SCREEN",
                    AdvertisingBlock.is_default == True,
                    AdvertisingBlock.is_active == True
                )
            )).first()

            default_mode32 = (await session.exec(
                select(AdvertisingBlock).where(
                    AdvertisingBlock.area == "MODE32_PROMO",
                    AdvertisingBlock.is_default == True,
                    AdvertisingBlock.is_active == True
                )
            )).first()

            # 2. Check cashiers
            cashiers = (await session.exec(select(Cashier).where(Cashier.enabled == True))).all()
            for cashier in cashiers:
                needs_update = False
                target_block_to_publish: Optional[AdvertisingBlock] = None

                # Check FULL_SCREEN block
                if cashier.current_full_screen_block_id:
                    cur_block = await session.get(AdvertisingBlock, cashier.current_full_screen_block_id)
                    if cur_block and cur_block.valid_to and cur_block.valid_to < now:
                        # Schedule expired!
                        if default_full_screen and default_full_screen.id != cur_block.id:
                            logger.info(
                                f"Cashier '{cashier.name}' ({cashier.ip_address}): FULL_SCREEN template '{cur_block.name}' "
                                f"expired at {cur_block.valid_to.isoformat()}. Reverting to default '{default_full_screen.name}'."
                            )
                            cashier.current_full_screen_block_id = default_full_screen.id
                            needs_update = True
                            target_block_to_publish = default_full_screen

                # Check MODE32_PROMO block
                if cashier.current_mode32_block_id:
                    cur_promo = await session.get(AdvertisingBlock, cashier.current_mode32_block_id)
                    if cur_promo and cur_promo.valid_to and cur_promo.valid_to < now:
                        # Schedule expired!
                        if default_mode32 and default_mode32.id != cur_promo.id:
                            logger.info(
                                f"Cashier '{cashier.name}' ({cashier.ip_address}): MODE32_PROMO template '{cur_promo.name}' "
                                f"expired at {cur_promo.valid_to.isoformat()}. Reverting to default '{default_mode32.name}'."
                            )
                            cashier.current_mode32_block_id = default_mode32.id
                            needs_update = True
                            if not target_block_to_publish:
                                target_block_to_publish = default_mode32

                if needs_update:
                    session.add(cashier)
                    reverted_cashiers_count += 1
                    await record_audit_event(
                        session,
                        "SCHEDULE_EXPIRED_REVERTED_TO_DEFAULT",
                        "Cashier",
                        str(cashier.id),
                        None,
                        {
                            "cashier_ip": cashier.ip_address,
                            "cashier_name": cashier.name,
                            "reverted_at": now.isoformat(),
                            "default_full_id": str(default_full_screen.id) if default_full_screen else None,
                            "default_mode32_id": str(default_mode32.id) if default_mode32 else None
                        }
                    )

                    # Trigger automatic background dispatch of default block to this cashier
                    if target_block_to_publish:
                        try:
                            await PublicationOrchestrator.dispatch_publication(
                                session=session,
                                advertising_block_id=target_block_to_publish.id,
                                scope_type="CUSTOM_CASHIERS",
                                scope_target_ids=[str(cashier.id)],
                                initiated_by_user_id=None
                            )
                        except Exception as e:
                            logger.warning(f"Could not auto-dispatch default block to cashier {cashier.name}: {e}")

            if reverted_cashiers_count > 0:
                await session.commit()
                logger.info(f"Reverted {reverted_cashiers_count} cashiers with expired schedules to default templates.")

    except Exception as e:
        logger.error(f"Error in check_and_revert_expired_schedules: {e}")

    return reverted_cashiers_count


async def start_schedule_watchdog_loop(interval_seconds: int = 60):
    """Continuous background loop evaluating template schedules and enforcing fallback to default."""
    logger.info(f"Starting Advertising Schedule Watchdog loop (interval: {interval_seconds}s)...")
    await asyncio.sleep(5)  # initial delay
    while True:
        try:
            await check_and_revert_expired_schedules()
        except asyncio.CancelledError:
            logger.info("Advertising Schedule Watchdog loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in schedule watchdog loop: {e}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break
