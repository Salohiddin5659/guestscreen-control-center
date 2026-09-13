import asyncio
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from arq.connections import create_pool

from app.models.publication import PublicationBatch, PublicationJob
from app.models.topology import Cashier, Branch, Region
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.domain.idempotency import calculate_idempotency_key
from workers.arq_config import redis_settings

logger = logging.getLogger("gs_control_center.orchestrator")


class PublicationOrchestrator:
    @staticmethod
    async def dispatch_publication(
        session: AsyncSession,
        advertising_block_id: UUID,
        scope_type: str,  # REGION, BRANCH, CUSTOM_CASHIERS
        scope_target_ids: List[str],
        initiated_by_user_id: Optional[UUID] = None
    ) -> PublicationBatch:
        # 1. Load advertising block
        block = await session.get(AdvertisingBlock, advertising_block_id)
        if not block:
            raise ValueError(f"AdvertisingBlock {advertising_block_id} not found")

        # 2. Load playlist items
        items_query = select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id).order_by(PlaylistItem.order_index)
        items = (await session.exec(items_query)).all()

        # 3. Resolve target cashiers
        target_cashiers: List[Cashier] = []
        if scope_type == "CUSTOM_CASHIERS":
            uuids = [UUID(tid) for tid in scope_target_ids]
            query = select(Cashier).where(Cashier.id.in_(uuids), Cashier.enabled == True)
            target_cashiers = (await session.exec(query)).all()

        elif scope_type == "BRANCH":
            uuids = [UUID(tid) for tid in scope_target_ids]
            query = select(Cashier).where(Cashier.branch_id.in_(uuids), Cashier.enabled == True)
            target_cashiers = (await session.exec(query)).all()

        elif scope_type == "REGION":
            uuids = [UUID(tid) for tid in scope_target_ids]
            # Find branches in these regions
            query = (
                select(Cashier)
                .join(Branch, Cashier.branch_id == Branch.id)
                .where(Branch.region_id.in_(uuids), Cashier.enabled == True)
            )
            target_cashiers = (await session.exec(query)).all()
        else:
            raise ValueError(f"Unknown scope_type: {scope_type}")

        if not target_cashiers:
            raise ValueError("Нет активных касс, попадающих под выбранную область публикации.")

        # 4. Compile immutable snapshot of template, playlist, and media hashes
        snapshot_items = []
        for it in items:
            asset = await session.get(MediaAsset, it.media_asset_id)
            snapshot_items.append({
                "media_asset_id": str(it.media_asset_id),
                "order_index": it.order_index,
                "duration_seconds": it.duration_seconds,
                "original_name": asset.original_name if asset else "",
                "stored_name": asset.stored_name if asset else "",
                "sha256": asset.sha256 if asset else "",
                "mime_type": asset.mime_type if asset else "",
                "media_type": asset.media_type if asset else "IMAGE",
                "s3_key": asset.s3_key if asset else "",
                "file_size_bytes": asset.file_size_bytes if asset else 0
            })

        content_snapshot = {
            "template_id": str(block.id),
            "name": block.name,
            "area": block.area,
            "display_mode": block.display_mode,
            "version": block.version,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "items": snapshot_items
        }

        # 5. Create PublicationBatch record
        batch = PublicationBatch(
            advertising_block_id=block.id,
            content_snapshot_json=content_snapshot,
            scope_type=scope_type,
            scope_target_ids=scope_target_ids,
            status="PENDING",
            total_cashiers=len(target_cashiers),
            initiated_by_user_id=initiated_by_user_id,
            created_at=datetime.now(timezone.utc)
        )
        session.add(batch)
        await session.flush()

        # 6. Create PublicationJob for each cashier
        job_ids = []
        for cashier in target_cashiers:
            idempotency_key = calculate_idempotency_key(cashier.id, block, items)
            job = PublicationJob(
                batch_id=batch.id,
                cashier_id=cashier.id,
                advertising_block_id=block.id,
                status="PENDING",
                idempotency_key=idempotency_key,
                current_attempt=0,
                max_attempts=3
            )
            session.add(job)
            await session.flush()
            job_ids.append(str(job.id))

        await session.commit()
        await session.refresh(batch)

        # 6. Push jobs into Redis / ARQ worker queue
        enqueued_to_redis = False
        try:
            arq_pool = await create_pool(redis_settings)
            for jid in job_ids:
                await arq_pool.enqueue_job("execute_cashier_job", jid)
            enqueued_to_redis = True
            logger.info(f"Enqueued {len(job_ids)} cashier jobs for batch {batch.id}")
        except Exception as e:
            logger.warning(f"Redis queue unavailable ({e}), launching jobs in background tasks directly...")

        if not enqueued_to_redis:
            from workers.main import execute_cashier_job
            for jid in job_ids:
                asyncio.create_task(execute_cashier_job({"redis": None}, jid))

        return batch

    @staticmethod
    async def retry_failed_jobs(
        session: AsyncSession,
        batch_id: UUID
    ) -> List[str]:
        """Re-enqueues only FAILED or OFFLINE cashier jobs within the batch."""
        query = select(PublicationJob).where(
            PublicationJob.batch_id == batch_id,
            PublicationJob.status.in_(["FAILED", "OFFLINE"])
        )
        failed_jobs = (await session.exec(query)).all()
        if not failed_jobs:
            return []

        retried_job_ids = []
        arq_pool = await create_pool(redis_settings)

        for job in failed_jobs:
            job.status = "PENDING"
            job.current_attempt = 0
            job.error_message = None
            session.add(job)
            retried_job_ids.append(str(job.id))
            await arq_pool.enqueue_job("execute_cashier_job", str(job.id))

        # Reset batch status if needed
        batch = await session.get(PublicationBatch, batch_id)
        if batch:
            batch.status = "RUNNING"
            session.add(batch)

        await session.commit()
        logger.info(f"Retried {len(retried_job_ids)} jobs for batch {batch_id}")
        return retried_job_ids
