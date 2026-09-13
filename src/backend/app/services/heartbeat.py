import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import select
from app.db.session import async_session_factory
from app.models.topology import Cashier

logger = logging.getLogger("uvicorn.error")


async def check_tcp_port(ip: str, port: int, timeout: float = 1.5) -> bool:
    """Fast non-blocking TCP socket check to verify cashier reachability."""
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(ip, port),
            timeout=timeout
        )
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
        return True
    except Exception:
        return False


async def probe_and_update_cashier(cashier: Cashier) -> bool:
    """Probes a single cashier and updates its status and timestamp in-memory."""
    is_online = await check_tcp_port(cashier.ip_address, cashier.ssh_port, timeout=1.5)
    now = datetime.now(timezone.utc)
    if is_online:
        cashier.last_seen_at = now
        if cashier.last_sync_status in ("OFFLINE", "UNKNOWN"):
            cashier.last_sync_status = "SUCCESS"
    else:
        if cashier.last_sync_status in ("SUCCESS", "UNKNOWN"):
            cashier.last_sync_status = "OFFLINE"
    return is_online


async def run_single_heartbeat_cycle():
    """Checks all enabled cashiers concurrently and persists updated status to DB."""
    try:
        async with async_session_factory() as session:
            result = await session.exec(select(Cashier).where(Cashier.enabled == True))
            cashiers = result.all()
            if not cashiers:
                return

            tasks = [probe_and_update_cashier(c) for c in cashiers]
            await asyncio.gather(*tasks, return_exceptions=True)
            await session.commit()
    except Exception as e:
        logger.warning(f"Error during cashier heartbeat cycle: {e}")


async def start_heartbeat_loop(interval_seconds: int = 30):
    """Background loop that continuously monitors fleet online/offline states."""
    logger.info(f"Starting Cashier Heartbeat Monitor loop (interval: {interval_seconds}s)...")
    await asyncio.sleep(2)
    while True:
        try:
            await run_single_heartbeat_cycle()
        except asyncio.CancelledError:
            logger.info("Cashier Heartbeat Monitor loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in cashier heartbeat loop: {e}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break
