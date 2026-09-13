import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from uuid import UUID
from arq.connections import create_pool
from redis.asyncio import Redis
from sqlmodel import select

from app.core.config import settings
from app.db.session import async_session_factory
from app.models.publication import PublicationBatch, PublicationJob, JobAttempt
from app.models.topology import Cashier, Branch
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.models.security import SSHCredential
from app.adapters.factory import CashRegisterAdapterFactory
from app.domain.scene_builder import build_guest_screen_scene
from app.domain.idempotency import is_content_identical
from app.services.storage_service import storage_service
from app.core.ssh_security import ssh_vault
from workers.concurrency_limiter import DistributedBranchLimiter
from workers.retry_manager import calculate_exponential_backoff_with_jitter, should_retry_job
from workers.arq_config import redis_settings

logger = logging.getLogger("gs_control_center.worker")


async def execute_cashier_job(ctx, job_id_str: str):
    """
    Executes surgical publication sequence for a single POS cashier.
    Strictly zero agent on client monoblock.
    """
    job_id = UUID(job_id_str)
    redis: Redis = ctx["redis"]

    async with async_session_factory() as session:
        job = await session.get(PublicationJob, job_id)
        if not job:
            logger.error(f"Publication job {job_id} not found.")
            return

        batch = await session.get(PublicationBatch, job.batch_id)
        cashier = await session.get(Cashier, job.cashier_id)
        branch = await session.get(Branch, cashier.branch_id) if cashier else None
        block = await session.get(AdvertisingBlock, job.advertising_block_id)

        if not cashier or not block:
            job.status = "FAILED"
            job.error_message = "Cashier or AdvertisingBlock not found in database"
            await session.commit()
            return

        # Mark running
        job.status = "RUNNING"
        job.started_at = datetime.now(timezone.utc)
        job.current_attempt += 1
        if batch and batch.status == "PENDING":
            batch.status = "RUNNING"
            batch.started_at = datetime.now(timezone.utc)

        attempt = JobAttempt(
            job_id=job.id,
            attempt_number=job.current_attempt,
            status="RUNNING",
            started_at=datetime.now(timezone.utc)
        )
        session.add(attempt)
        await session.commit()

        # Load playlist items & media assets: prioritize immutable content_snapshot_json
        snapshot = batch.content_snapshot_json if batch else None
        if snapshot:
            logger.info(f"Worker executing job {job.id} strictly from immutable content_snapshot_json for template {snapshot.get('name')}")
            snapshot_items = snapshot.get("items", [])
            items = []
            media_map = {}
            for s_it in snapshot_items:
                m_asset = MediaAsset(
                    id=UUID(s_it["media_asset_id"]),
                    original_name=s_it.get("original_name", ""),
                    stored_name=s_it.get("stored_name", ""),
                    sha256=s_it.get("sha256", ""),
                    mime_type=s_it.get("mime_type", "image/jpeg"),
                    media_type=s_it.get("media_type", "IMAGE"),
                    s3_key=s_it.get("s3_key", f"media/{s_it.get('stored_name')}"),
                    file_size_bytes=s_it.get("file_size_bytes", 0)
                )
                media_map[str(m_asset.id)] = m_asset
                p_item = PlaylistItem(
                    advertising_block_id=UUID(snapshot["template_id"]),
                    media_asset_id=m_asset.id,
                    order_index=s_it["order_index"],
                    duration_seconds=s_it.get("duration_seconds", 7)
                )
                items.append(p_item)
            block = AdvertisingBlock(
                id=UUID(snapshot["template_id"]),
                name=snapshot.get("name", "Snapshot Template"),
                area=snapshot["area"],
                display_mode=snapshot["display_mode"],
                version=snapshot.get("version", 1)
            )
        else:
            items_query = select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id).order_by(PlaylistItem.order_index)
            items = (await session.exec(items_query)).all()
            media_map = {}
            for item in items:
                asset = await session.get(MediaAsset, item.media_asset_id)
                if asset:
                    media_map[str(asset.id)] = asset

        # Resolve credentials if encrypted
        password = None
        if cashier.ssh_password_encrypted:
            try:
                from app.core.security import decrypt_secret
                password = decrypt_secret(cashier.ssh_password_encrypted)
            except Exception as e:
                logger.warning(f"Failed to decrypt in-memory password for cashier {cashier.name}: {e}")
        elif cashier.ssh_credential_id:
            cred = await session.get(SSHCredential, cashier.ssh_credential_id)
            if cred and cred.encrypted_secret:
                try:
                    from app.core.security import decrypt_secret
                    password = decrypt_secret(cred.encrypted_secret)
                except Exception as e:
                    logger.warning(f"Failed to decrypt password for cashier {cashier.name}: {e}")

        # Concurrency Limiter
        limiter = DistributedBranchLimiter(
            redis=redis,
            global_max=settings.WORKER_CONCURRENCY,
            per_branch_max=settings.MAX_CONCURRENT_PER_BRANCH
        )
        branch_id_str = str(branch.id) if branch else "default"
        acquired = await limiter.acquire(branch_id_str, timeout_seconds=45)
        if not acquired:
            logger.warning(f"Could not acquire rate limiter slot for branch {branch_id_str} in time.")

        adapter = CashRegisterAdapterFactory.get_adapter(
            cashier_id=cashier.id,
            host=cashier.ip_address,
            port=cashier.ssh_port,
            username="Administrator",
            password=password
        )

        start_time = time.perf_counter()
        execution_log = []
        try:
            # 1. Connect
            execution_log.append("Connecting over SSH...")
            connected = await adapter.connect()
            if not connected:
                raise ConnectionError(f"SSH handshake failed to {cashier.ip_address}")

            # 2. Inspect Environment
            execution_log.append("Inspecting cashier environment...")
            insp = await adapter.inspect()
            if not insp.success:
                raise RuntimeError(f"Inspect failed: {insp.error_message}")

            if insp.guest_screen_version:
                cashier.guest_screen_version = insp.guest_screen_version

            # 3. Create Local gs.db Backup on Cashier
            execution_log.append("Creating local gs.db backup...")
            bak = await adapter.backup_database()
            if not bak.success:
                raise RuntimeError(f"Local backup failed: {bak.error_message}")
            attempt.remote_backup_path = bak.backup_path

            # 4. Fetch Media from MinIO & Upload to Cashier
            execution_log.append("Downloading media from MinIO & transferring over SFTP...")
            media_tuples = []
            for item in items:
                asset = media_map.get(str(item.media_asset_id))
                if asset:
                    file_bytes = await storage_service.download_file_bytes(asset.s3_key)
                    media_tuples.append((asset.stored_name, file_bytes))

            upload_res = await adapter.upload_media(media_tuples)
            if not upload_res.success:
                raise RuntimeError(f"Media transfer failed: {upload_res.error_message}")

            # 5. Build Scene & Capture Prior State
            execution_log.append("Capturing prior scenes.Raw into memory...")
            built_scene_pre = build_guest_screen_scene(block, items, media_map)
            prior_raw = await adapter.get_current_scene_raw(built_scene_pre.scene_guid)
            attempt.previous_scene_raw = prior_raw
            built_scene = build_guest_screen_scene(block, items, media_map, existing_scene_raw=prior_raw)

            # 6. Check Idempotency
            if is_content_identical(cashier.current_content_version, job.idempotency_key):
                execution_log.append("Content is identical to active cashier version. Skipping redundant SQL write.")
                final_status = "SUCCESS"
            else:
                # 7. Surgical SQL Scene Update
                execution_log.append(f"Executing surgical UPDATE on scenes for GUID {built_scene.scene_guid}...")
                upd_res = await adapter.update_scene(built_scene.scene_guid, built_scene.raw_json)
                if not upd_res.success:
                    # Tier 1 Surgical Rollback
                    execution_log.append(f"Update failed ({upd_res.error_message}). Triggering Tier 1 Rollback...")
                    if prior_raw:
                        await adapter.rollback_scene(built_scene.scene_guid, prior_raw)
                    raise RuntimeError(f"Scene update failed: {upd_res.error_message}")

                # 8. Verification Query
                execution_log.append("Verifying written scene in gs.db...")
                ver_res = await adapter.verify(built_scene.scene_guid, built_scene.raw_json)
                if not ver_res.matches:
                    execution_log.append(f"Verification mismatch! Triggering Tier 1 Rollback...")
                    if prior_raw:
                        await adapter.rollback_scene(built_scene.scene_guid, prior_raw)
                    raise RuntimeError(f"Verification mismatch: {ver_res.error_message or 'Content differs'}")

                # 9. Refresh Front
                execution_log.append("Signaling front reload via sync_version.txt...")
                ref_res = await adapter.refresh()
                if ref_res.awaiting_restart:
                    final_status = "PUBLISHED_AWAITING_RESTART"
                    execution_log.append("Reload deferred: awaiting off-hours maintenance restart.")
                else:
                    final_status = "SUCCESS"
                    execution_log.append("Front reloaded seamlessly.")

            # Record Success
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            job.status = final_status
            job.finished_at = datetime.now(timezone.utc)
            attempt.status = final_status
            attempt.finished_at = datetime.now(timezone.utc)
            attempt.duration_ms = duration_ms
            attempt.execution_log = "\n".join(execution_log)

            cashier.last_seen_at = datetime.now(timezone.utc)
            cashier.last_sync_status = final_status
            if final_status in ("SUCCESS", "PUBLISHED_AWAITING_RESTART"):
                cashier.current_content_version = job.idempotency_key
                if block.area == "FULL_SCREEN":
                    cashier.current_full_screen_block_id = block.id
                elif block.area == "MODE32_PROMO":
                    cashier.current_mode32_block_id = block.id

        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error(f"Job {job.id} for cashier {cashier.name} failed: {e}")
            execution_log.append(f"EXCEPTION: {str(e)}")

            can_retry, next_attempt = should_retry_job(job.current_attempt, job.max_attempts)
            is_offline = isinstance(e, ConnectionError) or "connect" in str(e).lower()
            job.status = "OFFLINE" if is_offline else "FAILED"
            job.error_message = str(e)
            attempt.status = job.status
            attempt.finished_at = datetime.now(timezone.utc)
            attempt.duration_ms = duration_ms
            attempt.execution_log = "\n".join(execution_log)

            cashier.last_sync_status = job.status

            if can_retry:
                # Schedule retry with jittered delay
                delay = calculate_exponential_backoff_with_jitter(job.current_attempt)
                logger.info(f"Scheduling retry for job {job.id} in {delay:.2f}s...")
                arq_pool = await create_pool(redis_settings)
                await arq_pool.enqueue_job("execute_cashier_job", str(job.id), _defer_by=int(delay))

        finally:
            await adapter.close()
            if acquired:
                await limiter.release(branch_id_str)

            # Update batch counters
            if batch:
                all_jobs_query = select(PublicationJob).where(PublicationJob.batch_id == batch.id)
                all_jobs = (await session.exec(all_jobs_query)).all()
                batch.total_cashiers = len(all_jobs)
                batch.success_count = sum(1 for j in all_jobs if j.status == "SUCCESS")
                batch.awaiting_restart_count = sum(1 for j in all_jobs if j.status == "PUBLISHED_AWAITING_RESTART")
                batch.failed_count = sum(1 for j in all_jobs if j.status == "FAILED")
                batch.offline_count = sum(1 for j in all_jobs if j.status == "OFFLINE")

                # Check if batch completed and set status (SUCCESS, PARTIAL, FAILED)
                pending_or_running = any(j.status in ("PENDING", "RUNNING") for j in all_jobs)
                if not pending_or_running:
                    batch.finished_at = datetime.now(timezone.utc)
                    if batch.failed_count == 0 and batch.offline_count == 0:
                        batch.status = "SUCCESS"
                    elif batch.success_count > 0 or batch.awaiting_restart_count > 0:
                        batch.status = "PARTIAL"
                    else:
                        batch.status = "FAILED"

            await session.commit()

            # Publish SSE event to Redis
            if batch:
                event_payload = {
                    "event": "job_update",
                    "batch_id": str(batch.id),
                    "cashier_id": str(cashier.id),
                    "status": job.status,
                    "counters": {
                        "total": batch.total_cashiers,
                        "success": batch.success_count,
                        "awaiting_restart": batch.awaiting_restart_count,
                        "failed": batch.failed_count,
                        "offline": batch.offline_count,
                    }
                }
                await redis.publish(f"batch_events:{batch.id}", json.dumps(event_payload))

            return job.status


class WorkerSettings:
    functions = [execute_cashier_job]
    redis_settings = redis_settings
    max_jobs = 30
    job_timeout = 180
    keep_result = 3600
