import asyncio
import logging
from datetime import datetime, timezone
import zoneinfo
from sqlmodel import select

from app.db.session import async_session_factory
from app.models.topology import Cashier, Branch, MaintenanceWindow
from app.models.security import SSHCredential
from app.core.security import decrypt_secret
from app.adapters.factory import CashRegisterAdapterFactory

logger = logging.getLogger("gs_control_center.maintenance_scheduler")


async def run_maintenance_window_cycle():
    """Checks for terminals awaiting restart and triggers non-destructive restart during maintenance window."""
    async with async_session_factory() as session:
        # Find cashiers awaiting restart
        query = select(Cashier).where(Cashier.last_sync_status == "PUBLISHED_AWAITING_RESTART", Cashier.enabled == True)
        awaiting_cashiers = (await session.exec(query)).all()

        for cashier in awaiting_cashiers:
            branch = await session.get(Branch, cashier.branch_id)
            if not branch:
                continue

            # Check maintenance window
            mw_query = select(MaintenanceWindow).where(MaintenanceWindow.branch_id == branch.id, MaintenanceWindow.enabled == True)
            mw = (await session.exec(mw_query)).first()
            if not mw:
                continue

            # Convert current time to branch timezone
            try:
                tz = zoneinfo.ZoneInfo(mw.timezone)
            except Exception:
                tz = zoneinfo.ZoneInfo("Asia/Tashkent")

            now_local = datetime.now(tz).time()

            # Check if now is within start_time and end_time
            in_window = False
            if mw.start_time <= mw.end_time:
                in_window = mw.start_time <= now_local <= mw.end_time
            else:
                # Spans midnight (e.g. 23:00 to 04:00)
                in_window = now_local >= mw.start_time or now_local <= mw.end_time

            if in_window:
                logger.info(f"Maintenance window active for cashier {cashier.name} ({cashier.ip_address}). Triggering off-hours restart...")
                ssh_user = None
                if cashier.ssh_credential_id:
                    cred = await session.get(SSHCredential, cashier.ssh_credential_id)
                    if cred and cred.username and cred.username.strip():
                        ssh_user = cred.username.strip()

                if not ssh_user:
                    logger.warning(f"Skipping maintenance restart for {cashier.name}: missing SSH username")
                    continue

                password = None
                if cashier.ssh_password_encrypted:
                    try:
                        password = decrypt_secret(cashier.ssh_password_encrypted)
                    except Exception:
                        pass

                adapter = CashRegisterAdapterFactory.get_adapter(
                    cashier_id=cashier.id,
                    host=cashier.ip_address,
                    username=ssh_user,
                    port=cashier.ssh_port,
                    password=password
                )
                try:
                    # In GuestScreen, we touch sync_version.txt or reload without taskkill
                    ref_res = await adapter.refresh()
                    if ref_res.success:
                        cashier.last_sync_status = "SUCCESS"
                        session.add(cashier)
                        logger.info(f"Cashier {cashier.name} successfully updated to SUCCESS after maintenance cycle.")
                except Exception as e:
                    logger.error(f"Error during off-hours restart on {cashier.name}: {e}")
                finally:
                    await adapter.close()

        await session.commit()


async def start_maintenance_loop(interval_seconds: int = 300):
    """Background loop checking maintenance windows every 5 minutes."""
    while True:
        try:
            await run_maintenance_window_cycle()
        except Exception as e:
            logger.error(f"Error in maintenance scheduler loop: {e}")
        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_maintenance_loop())
