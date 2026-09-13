import pytest
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.models.publication import PublicationBatch, PublicationJob
from app.models.topology import Region, Branch, Cashier


def get_test_session_factory():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_publication_snapshot_isolation():
    factory = get_test_session_factory()
    async with factory() as session:
        # Create media asset
        asset = MediaAsset(
            original_name="promo_snapshot.jpg",
            stored_name="snap_hash.jpg",
            sha256="snap_hash",
            mime_type="image/jpeg",
            media_type="IMAGE",
            file_size_bytes=3000,
            s3_key="media/snap_hash.jpg",
            version=1
        )
        session.add(asset)
        await session.commit()
        await session.refresh(asset)

        # Create template
        block = AdvertisingBlock(
            name="Snapshot Original Name",
            area="FULL_SCREEN",
            display_mode="STATIC",
            version=1
        )
        session.add(block)
        await session.commit()
        await session.refresh(block)

        item = PlaylistItem(
            advertising_block_id=block.id,
            media_asset_id=asset.id,
            order_index=0,
            duration_seconds=15
        )
        session.add(item)
        await session.commit()

        # Build snapshot
        content_snapshot = {
            "template_id": str(block.id),
            "name": block.name,
            "area": block.area,
            "display_mode": block.display_mode,
            "version": block.version,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "items": [
                {
                    "media_asset_id": str(asset.id),
                    "order_index": 0,
                    "duration_seconds": 15,
                    "original_name": asset.original_name,
                    "stored_name": asset.stored_name,
                    "sha256": asset.sha256,
                    "mime_type": asset.mime_type,
                    "media_type": asset.media_type,
                    "s3_key": asset.s3_key,
                    "file_size_bytes": asset.file_size_bytes
                }
            ]
        }

        batch = PublicationBatch(
            advertising_block_id=block.id,
            content_snapshot_json=content_snapshot,
            scope_type="CUSTOM_CASHIERS",
            scope_target_ids=[],
            status="PENDING",
            total_cashiers=1
        )
        session.add(batch)
        await session.commit()
        await session.refresh(batch)

        try:
            # Modify original template in CMS
            block.name = "CMS Altered Name"
            block.version += 1
            session.add(block)
            await session.commit()
            await session.refresh(block)

            # Verify that batch content_snapshot_json remains 100% untouched
            await session.refresh(batch)
            assert batch.content_snapshot_json["name"] == "Snapshot Original Name"
            assert batch.content_snapshot_json["version"] == 1
            assert batch.content_snapshot_json["items"][0]["duration_seconds"] == 15
        finally:
            await session.delete(batch)
            await session.delete(item)
            await session.delete(block)
            await session.delete(asset)
            await session.commit()


@pytest.mark.asyncio
async def test_partial_batch_outcome_and_retry_failed_only():
    factory = get_test_session_factory()
    async with factory() as session:
        # Create minimal advertising block first to satisfy FK
        block = AdvertisingBlock(
            name="Batch Test Template",
            area="FULL_SCREEN",
            display_mode="STATIC",
            version=1
        )
        session.add(block)
        await session.commit()
        await session.refresh(block)

        batch = PublicationBatch(
            advertising_block_id=block.id,
            content_snapshot_json={"test": "snapshot"},
            scope_type="CUSTOM_CASHIERS",
            scope_target_ids=[],
            status="PENDING",
            total_cashiers=2
        )
        session.add(batch)
        await session.flush()

        # Create topology to satisfy cashier FK
        region = Region(name=f"Reg_{uuid4().hex[:6]}", code=f"RC_{uuid4().hex[:6]}")
        session.add(region)
        await session.commit()
        await session.refresh(region)

        branch = Branch(region_id=region.id, name=f"Br_{uuid4().hex[:6]}", code=f"BC_{uuid4().hex[:6]}")
        session.add(branch)
        await session.commit()
        await session.refresh(branch)

        cashier1 = Cashier(branch_id=branch.id, name="C1", ip_address=f"10.99.{uuid4().int % 200}.1")
        cashier2 = Cashier(branch_id=branch.id, name="C2", ip_address=f"10.99.{uuid4().int % 200}.2")
        session.add(cashier1)
        session.add(cashier2)
        await session.commit()
        await session.refresh(cashier1)
        await session.refresh(cashier2)

        # Job 1: SUCCESS
        job1 = PublicationJob(
            batch_id=batch.id,
            cashier_id=cashier1.id,
            advertising_block_id=block.id,
            status="SUCCESS",
            idempotency_key="k1",
            current_attempt=1
        )
        # Job 2: FAILED
        job2 = PublicationJob(
            batch_id=batch.id,
            cashier_id=cashier2.id,
            advertising_block_id=block.id,
            status="FAILED",
            idempotency_key="k2",
            current_attempt=1,
            error_message="SSH Timeout"
        )
        session.add(job1)
        session.add(job2)
        await session.commit()

        try:
            # Simulate worker batch completion calculation
            all_jobs = [job1, job2]
            batch.total_cashiers = len(all_jobs)
            batch.success_count = sum(1 for j in all_jobs if j.status == "SUCCESS")
            batch.failed_count = sum(1 for j in all_jobs if j.status == "FAILED")
            
            # Logic: mixed success and failure -> PARTIAL
            if batch.failed_count > 0 and batch.success_count > 0:
                batch.status = "PARTIAL"
            session.add(batch)
            await session.commit()
            await session.refresh(batch)

            assert batch.status == "PARTIAL"

            # Simulate "Retry Failed Only": find only FAILED/OFFLINE jobs
            failed_query = select(PublicationJob).where(
                PublicationJob.batch_id == batch.id,
                PublicationJob.status.in_(["FAILED", "OFFLINE"])
            )
            jobs_to_retry = (await session.exec(failed_query)).all()
            assert len(jobs_to_retry) == 1
            assert jobs_to_retry[0].id == job2.id

            # Job 1 (SUCCESS) is never reset
            assert job1.status == "SUCCESS"
        finally:
            await session.delete(job1)
            await session.delete(job2)
            await session.delete(batch)
            await session.delete(block)
            await session.delete(cashier1)
            await session.delete(cashier2)
            await session.flush()
            await session.delete(branch)
            await session.flush()
            await session.delete(region)
            await session.commit()
