import asyncio
import logging
from uuid import uuid4
from sqlmodel import select
from app.db.session import async_session_factory
from app.models.security import User, SSHCredential
from app.models.topology import Region, Branch, Cashier, MaintenanceWindow
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger("gs_control_center.seed")


async def seed_database():
    async with async_session_factory() as session:
        # 1. Admin user
        admin_user = (await session.exec(select(User).where(User.username == "admin"))).first()
        if not admin_user:
            logger.info("Creating default admin user...")
            admin_user = User(
                username="admin",
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name="GS Administrator",
                role="ADMINISTRATOR",
                is_active=True
            )
            session.add(admin_user)
            await session.flush()
            logger.info(f"Admin user created with ID: {admin_user.id}")
        else:
            logger.info("Admin user already exists.")

        # 2. Corporate SSH Credential
        default_cred = (await session.exec(select(SSHCredential).where(SSHCredential.name == "Corporate Master Key"))).first()
        if not default_cred:
            logger.info("Creating Corporate Master Key credential reference...")
            default_cred = SSHCredential(
                name="Corporate Master Key",
                auth_type="CORPORATE_KEY",
                username="Administrator"
            )
            session.add(default_cred)
            await session.flush()
        
        # 3. Default Regions
        tashkent = (await session.exec(select(Region).where(Region.code == "TAS"))).first()
        if not tashkent:
            logger.info("Creating region Tashkent (TAS)...")
            tashkent = Region(
                name="Ташкент",
                code="TAS"
            )
            session.add(tashkent)
            await session.flush()

        samarkand = (await session.exec(select(Region).where(Region.code == "SAM"))).first()
        if not samarkand:
            logger.info("Creating region Samarkand (SAM)...")
            samarkand = Region(
                name="Самаркандская область",
                code="SAM"
            )
            session.add(samarkand)
            await session.flush()

        # 4. Default Branch (Novza in Tashkent)
        novza = (await session.exec(select(Branch).where(Branch.code == "NOVZA"))).first()
        if not novza:
            logger.info("Creating branch Novza...")
            novza = Branch(
                region_id=tashkent.id,
                name="Филиал Новза",
                code="NOVZA",
                address="г. Ташкент, Чиланзарский р-н, м-в Новза"
            )
            session.add(novza)
            await session.flush()

            # Maintenance window for Novza (02:00 - 05:00)
            mw = MaintenanceWindow(
                branch_id=novza.id,
                timezone="Asia/Tashkent"
            )
            session.add(mw)

        # 5. Default Test Cashier (10.0.0.241)
        test_cashier = (await session.exec(select(Cashier).where(Cashier.ip_address == "10.0.0.241"))).first()
        if not test_cashier:
            logger.info("Creating test cashier 10.0.0.241...")
            test_cashier = Cashier(
                branch_id=novza.id,
                name="Касса 1 Новза (Тестовая)",
                ip_address="10.0.0.241",
                ssh_port=22,
                ssh_credential_id=default_cred.id if default_cred else None,
                enabled=True,
                last_sync_status="UNKNOWN"
            )
            session.add(test_cashier)

        await session.commit()
        logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())
