import asyncio
import json
import logging
import os
import time
from typing import Optional
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

_in_process_limiter: Optional[asyncio.Semaphore] = None
_branch_semaphores: dict = {}


def get_in_process_limiter() -> asyncio.Semaphore:
    global _in_process_limiter
    if _in_process_limiter is None:
        _in_process_limiter = asyncio.Semaphore(settings.WORKER_CONCURRENCY)
    return _in_process_limiter


def get_branch_limiter(branch_id: str) -> asyncio.Semaphore:
    if branch_id not in _branch_semaphores:
        _branch_semaphores[branch_id] = asyncio.Semaphore(settings.MAX_CONCURRENT_PER_BRANCH)
    return _branch_semaphores[branch_id]


async def execute_cashier_job(ctx, job_id_str: str):
    """
    Executes surgical publication sequence for a single POS cashier.
    Strictly zero agent on client monoblock.
    Uses in-process semaphore to avoid saturating server/network when Redis is absent.
    """
    redis: Optional[Redis] = ctx.get("redis") if ctx else None
    if not redis:
        async with get_in_process_limiter():
            return await _execute_cashier_job_impl(ctx, job_id_str)
    else:
        return await _execute_cashier_job_impl(ctx, job_id_str)


async def _execute_cashier_job_impl(ctx, job_id_str: str):
    job_id = UUID(job_id_str)
    redis: Optional[Redis] = ctx.get("redis") if ctx else None

    # =========================================================================
    # PHASE 1: DB READ & MARK RUNNING (Fast < 10ms hold of connection)
    # =========================================================================
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
        await session.refresh(attempt)
        attempt_id = attempt.id

        batch_id = batch.id if batch else None
        cashier_id = cashier.id
        cashier_name = cashier.name
        cashier_ip = cashier.ip_address
        cashier_port = cashier.ssh_port
        branch_id_str = str(branch.id) if branch else "default"
        idempotency_key = job.idempotency_key
        current_attempt = job.current_attempt
        max_attempts = job.max_attempts

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
                logger.warning(f"Failed to decrypt in-memory password for cashier {cashier_name}: {e}")
        elif cashier.ssh_credential_id:
            cred = await session.get(SSHCredential, cashier.ssh_credential_id)
            if cred and cred.encrypted_secret:
                try:
                    from app.core.security import decrypt_secret
                    password = decrypt_secret(cred.encrypted_secret)
                except Exception as e:
                    logger.warning(f"Failed to decrypt password for cashier {cashier_name}: {e}")

        # Resolve SSH credentials dynamically from central DB
        ssh_user = None
        if cashier.ssh_credential_id:
            cred = await session.get(SSHCredential, cashier.ssh_credential_id)
            if cred and cred.username and cred.username.strip():
                ssh_user = cred.username.strip()

        if not ssh_user:
            ssh_user = "Administrator"

    # =========================================================================
    # PHASE 2: NETWORK EXECUTION (ZERO DB CONNECTION HELD!)
    # =========================================================================
    limiter = None
    acquired = False
    branch_sem = None
    if redis:
        limiter = DistributedBranchLimiter(
            redis=redis,
            global_max=settings.WORKER_CONCURRENCY,
            per_branch_max=settings.MAX_CONCURRENT_PER_BRANCH
        )
        acquired = await limiter.acquire(branch_id_str, timeout_seconds=45)
        if not acquired:
            logger.warning(f"Could not acquire rate limiter slot for branch {branch_id_str} in time.")
    else:
        branch_sem = get_branch_limiter(branch_id_str)
        await branch_sem.acquire()

    adapter = CashRegisterAdapterFactory.get_adapter(
        cashier_id=cashier_id,
        host=cashier_ip,
        username=ssh_user,
        port=cashier_port,
        password=password
    )

    start_time = time.perf_counter()
    execution_log = []
    final_status = "FAILED"
    error_str = None
    remote_bak_path = None
    prior_raw = None
    guest_screen_ver = None

    try:
        # 1. Connect
        execution_log.append("Connecting over SSH...")
        connected = await adapter.connect()
        if not connected:
            raise ConnectionError(f"SSH handshake failed to {cashier_ip}")

        # 2. Inspect Environment
        execution_log.append("Inspecting cashier environment...")
        insp = await adapter.inspect()
        if not insp.success:
            raise RuntimeError(f"Inspect failed: {insp.error_message}")

        if insp.guest_screen_version:
            guest_screen_ver = insp.guest_screen_version

        # 3. Create Local gs.db Backup on Cashier
        execution_log.append("Creating local gs.db backup...")
        bak = await adapter.backup_database()
        if not bak.success:
            raise RuntimeError(f"Local backup failed: {bak.error_message}")
        remote_bak_path = bak.backup_path

        # 4. Fetch Media from Storage & Upload to Cashier
        execution_log.append("Downloading media from storage & transferring over SFTP...")
        media_tuples = []
        for item in items:
            asset = media_map.get(str(item.media_asset_id))
            if asset:
                file_bytes = None
                try:
                    file_bytes = await storage_service.download_file_bytes(asset.s3_key)
                except Exception as e:
                    logger.warning(f"StorageService download failed for {asset.s3_key}: {e}")

                if not file_bytes:
                    candidate_paths = [
                        f"/app/data/storage/{asset.s3_key}",
                        f"/app/data/storage/media/{asset.s3_key}",
                        f"/app/data/media/{asset.original_name}",
                        f"/app/data/media/{asset.stored_name}",
                        f"/app/data/{asset.s3_key}",
                    ]
                    for cp in candidate_paths:
                        if os.path.exists(cp):
                            with open(cp, "rb") as f:
                                file_bytes = f.read()
                            break

                if not file_bytes:
                    raise FileNotFoundError(f"Media file '{asset.original_name}' ({asset.s3_key}) not found in S3 or local storage")

                media_tuples.append((asset.stored_name, file_bytes))

        upload_res = await adapter.upload_media(media_tuples)
        if not upload_res.success:
            raise RuntimeError(f"Media transfer failed: {upload_res.error_message}")

        # 5. Build Scene & Capture Prior State
        target_mode = "mode1" if block.area == "FULL_SCREEN" else "mode32"
        active_guid = await adapter.get_active_scene_guid_for_mode(target_mode)
        effective_guid = active_guid or ("2509359c-2d71-4344-9be4-7d90dd453083" if block.area == "FULL_SCREEN" else "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3")
        execution_log.append(f"Resolved active target scene GUID: {effective_guid} (mode: {target_mode})")

        execution_log.append("Capturing prior scenes.Raw into memory...")
        built_scene_pre = build_guest_screen_scene(block, items, media_map, target_guid=effective_guid)
        prior_raw = await adapter.get_current_scene_raw(built_scene_pre.scene_guid)
        built_scene = build_guest_screen_scene(block, items, media_map, existing_scene_raw=prior_raw, target_guid=effective_guid)

        # 6. Surgical SQL Scene Update
        execution_log.append(f"Executing surgical UPDATE on scenes for GUID {built_scene.scene_guid}...")
        upd_res = await adapter.update_scene(built_scene.scene_guid, built_scene.raw_json)
        if not upd_res.success:
            execution_log.append(f"Update failed ({upd_res.error_message}). Triggering Tier 1 Rollback...")
            if prior_raw:
                await adapter.rollback_scene(built_scene.scene_guid, prior_raw)
            raise RuntimeError(f"Scene update failed: {upd_res.error_message}")

        # 7. Verification Query
        execution_log.append("Verifying written scene in gs.db...")
        ver_res = await adapter.verify(built_scene.scene_guid, built_scene.raw_json)
        if not ver_res.matches:
            execution_log.append("Verification mismatch! Triggering Tier 1 Rollback...")
            if prior_raw:
                await adapter.rollback_scene(built_scene.scene_guid, prior_raw)
            raise RuntimeError(f"Verification mismatch: {ver_res.error_message or 'Content differs'}")

        # 8. Refresh Front
        execution_log.append("Signaling front reload via sync_version.txt...")
        ref_res = await adapter.refresh()
        if ref_res.awaiting_restart:
            final_status = "PUBLISHED_AWAITING_RESTART"
            execution_log.append("Reload deferred: awaiting off-hours maintenance restart.")
        else:
            final_status = "SUCCESS"
            execution_log.append("Front reloaded seamlessly.")

    except Exception as e:
        logger.error(f"Job {job_id} for cashier {cashier_name} failed: {e}")
        execution_log.append(f"EXCEPTION: {str(e)}")
        is_offline = isinstance(e, ConnectionError) or "connect" in str(e).lower()
        final_status = "OFFLINE" if is_offline else "FAILED"
        error_str = str(e)
    finally:
        await adapter.close()
        if branch_sem:
            branch_sem.release()
        if acquired and limiter:
            await limiter.release(branch_id_str)

    duration_ms = int((time.perf_counter() - start_time) * 1000)

    # =========================================================================
    # PHASE 3: DB WRITE RESULTS & BATCH COUNTERS (Fast < 10ms hold of connection)
    # =========================================================================
    async with async_session_factory() as session:
        job = await session.get(PublicationJob, job_id)
        if job:
            job.status = final_status
            job.error_message = error_str
            job.finished_at = datetime.now(timezone.utc)

        attempt = await session.get(JobAttempt, attempt_id)
        if attempt:
            attempt.status = final_status
            attempt.finished_at = datetime.now(timezone.utc)
            attempt.duration_ms = duration_ms
            attempt.remote_backup_path = remote_bak_path
            attempt.previous_scene_raw = prior_raw
            attempt.execution_log = "\n".join(execution_log)

        cashier = await session.get(Cashier, cashier_id)
        if cashier:
            cashier.last_seen_at = datetime.now(timezone.utc)
            cashier.last_sync_status = final_status
            if guest_screen_ver:
                cashier.guest_screen_version = guest_screen_ver
            if final_status in ("SUCCESS", "PUBLISHED_AWAITING_RESTART"):
                cashier.current_content_version = idempotency_key
                if block.area == "FULL_SCREEN":
                    cashier.current_full_screen_block_id = block.id
                elif block.area == "MODE32_PROMO":
                    cashier.current_mode32_block_id = block.id

        batch = await session.get(PublicationBatch, batch_id) if batch_id else None
        if batch:
            all_jobs_query = select(PublicationJob).where(PublicationJob.batch_id == batch.id)
            all_jobs = (await session.exec(all_jobs_query)).all()
            batch.total_cashiers = len(all_jobs)
            batch.success_count = sum(1 for j in all_jobs if j.status == "SUCCESS")
            batch.awaiting_restart_count = sum(1 for j in all_jobs if j.status == "PUBLISHED_AWAITING_RESTART")
            batch.failed_count = sum(1 for j in all_jobs if j.status == "FAILED")
            batch.offline_count = sum(1 for j in all_jobs if j.status == "OFFLINE")

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

        # Publish SSE event to Redis if available
        if batch and redis:
            event_payload = {
                "event": "job_update",
                "batch_id": str(batch.id),
                "cashier_id": str(cashier_id),
                "status": final_status,
                "counters": {
                    "total": batch.total_cashiers,
                    "success": batch.success_count,
                    "awaiting_restart": batch.awaiting_restart_count,
                    "failed": batch.failed_count,
                    "offline": batch.offline_count,
                }
            }
            try:
                await redis.publish(f"batch_events:{batch.id}", json.dumps(event_payload))
            except Exception:
                pass

    return final_status


class WorkerSettings:
    functions = [execute_cashier_job]
    redis_settings = redis_settings
    max_jobs = 30
    job_timeout = 180
    keep_result = 3600
