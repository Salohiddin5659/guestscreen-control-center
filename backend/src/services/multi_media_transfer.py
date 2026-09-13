# -*- coding: utf-8 -*-
"""Batch SFTP media staging and cashbox verification engine (T054)."""
import logging
from typing import List, Optional, Sequence
import uuid

import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.adapters.media_storage import StorageProvider
from src.adapters.sftp_storage import SFTPStorageClient
from src.adapters.staging_manager import StagingManager
from src.core.exceptions import StagingVerificationFailedError
from src.models.media import MediaAsset

logger = logging.getLogger("guestscreen.multi_media_transfer")


class MultiMediaTransferEngine:
    """Manages batch uploading of media files to cashbox staging and pre-flight SHA verification."""

    def __init__(
        self,
        command_adapter: Optional[CashboxCommandAdapter] = None,
        staging_manager: Optional[StagingManager] = None,
        storage_provider: Optional[StorageProvider] = None,
    ) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.staging_manager = staging_manager or StagingManager(self.command_adapter)
        self.storage_provider = storage_provider or LocalFileSystemStorageProvider()

    async def stage_and_verify_media(
        self,
        conn: asyncssh.SSHClientConnection,
        media_list: Sequence[MediaAsset],
        deployment_id: uuid.UUID | str,
    ) -> List[str]:
        """Transfer media assets to cashbox staging, verify SHA-256 hashes, and promote atomically.

        Args:
            conn: Active AsyncSSH connection to the target cashbox.
            media_list: Collection of MediaAsset objects to stage and verify.
            deployment_id: UUID of the running deployment for staging isolation.

        Returns:
            List of promoted filenames in uploads directory.

        Raises:
            StagingVerificationFailedError: If any upload fails or SHA-256 hash does not match.
        """
        dep_id_str = str(deployment_id)
        if not media_list:
            return []

        sftp = SFTPStorageClient(conn)
        staged_filenames: List[str] = []

        try:
            # 1. Transfer each media file to isolated staging directory
            for asset in media_list:
                staging_remote_path = self.staging_manager.get_staging_file_path(
                    dep_id_str, asset.filename
                )
                file_bytes = await self.storage_provider.get(asset.storage_path)
                await sftp.upload_bytes(file_bytes, staging_remote_path)
                staged_filenames.append(asset.filename)
                logger.info(
                    "Uploaded %s to staging for dep %s", asset.filename, dep_id_str
                )

            # 2. Verify remote SHA-256 for all staged files (MANDATORY GATE)
            for asset in media_list:
                actual_hash = await self.command_adapter.hash_verify(
                    conn, dep_id_str, asset.filename
                )
                if actual_hash.lower() != asset.sha256.lower():
                    raise StagingVerificationFailedError(
                        f"SHA-256 mismatch for staged file '{asset.filename}': "
                        f"expected '{asset.sha256}', got '{actual_hash}'"
                    )
                logger.info(
                    "Verified SHA-256 for %s (%s)", asset.filename, actual_hash
                )

            # 3. Promote all verified staged files atomically to production uploads
            for asset in media_list:
                await self.staging_manager.promote_staging_file(
                    conn, dep_id_str, asset.filename
                )
                logger.info("Promoted %s to production uploads", asset.filename)

            return [m.filename for m in media_list]

        except Exception as exc:
            logger.error(
                "Batch staging failed for deployment %s: %s. Cleaning up staging directory.",
                dep_id_str,
                exc,
            )
            try:
                await self.staging_manager.cleanup_staging(conn, dep_id_str)
            except Exception as clean_err:
                logger.warning(
                    "Failed to clean up staging directory for %s: %s",
                    dep_id_str,
                    clean_err,
                )
            if isinstance(exc, StagingVerificationFailedError):
                raise
            raise StagingVerificationFailedError(
                f"Batch staging and verification failed for deployment {dep_id_str}: {exc}"
            ) from exc
