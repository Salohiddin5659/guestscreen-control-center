# -*- coding: utf-8 -*-
"""Staging directory gate and atomic file promotion manager (T040)."""
import logging
from pathlib import PureWindowsPath
from typing import Optional

import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter
from src.core.safety_guard import RetailSafetyGuard

logger = logging.getLogger("guestscreen.staging_manager")

BASE_UPLOADS_DIR = r"C:\UCS\GuestScreen\Front\media\uploads"


class StagingManager:
    """Manages isolated deployment staging folders and atomic promotion to production uploads."""

    def __init__(self, command_adapter: Optional[CashboxCommandAdapter] = None) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()

    @staticmethod
    def get_staging_dir(dep_id: str) -> str:
        """Construct the remote absolute Windows staging directory for a deployment."""
        clean_dep_id = CashboxCommandAdapter._validate_dep_id(dep_id)
        path = f"{BASE_UPLOADS_DIR}\\.staging\\{clean_dep_id}"
        RetailSafetyGuard.validate_file_path(path)
        return path

    @staticmethod
    def get_staging_file_path(dep_id: str, filename: str) -> str:
        """Construct the remote absolute Windows staging file path."""
        clean_dep_id = CashboxCommandAdapter._validate_dep_id(dep_id)
        clean_filename = CashboxCommandAdapter._validate_filename(filename)
        path = f"{BASE_UPLOADS_DIR}\\.staging\\{clean_dep_id}\\{clean_filename}"
        RetailSafetyGuard.validate_file_path(path)
        return path

    @staticmethod
    def get_production_file_path(filename: str) -> str:
        """Construct the remote absolute Windows production uploads file path."""
        clean_filename = CashboxCommandAdapter._validate_filename(filename)
        path = f"{BASE_UPLOADS_DIR}\\{clean_filename}"
        RetailSafetyGuard.validate_file_path(path)
        return path

    async def promote_staging_file(
        self,
        conn: asyncssh.SSHClientConnection,
        dep_id: str,
        filename: str,
    ) -> None:
        """Atomically move verified staged file into production uploads and clean up staging folder."""
        clean_dep_id = CashboxCommandAdapter._validate_dep_id(dep_id)
        clean_filename = CashboxCommandAdapter._validate_filename(filename)

        logger.info(
            "Promoting staged media '%s' (dep_id: %s) to production uploads",
            clean_filename,
            clean_dep_id,
        )
        await self.command_adapter.staging_move(conn, clean_dep_id, clean_filename)

    async def cleanup_staging(
        self,
        conn: asyncssh.SSHClientConnection,
        dep_id: str,
    ) -> None:
        """Purge the isolated staging folder for the given deployment ID over SFTP."""
        clean_dep_id = CashboxCommandAdapter._validate_dep_id(dep_id)
        staging_dir = self.get_staging_dir(clean_dep_id)
        logger.info("Purging staging directory: %s", staging_dir)
        from src.adapters.sftp_storage import SFTPStorageClient
        sftp = SFTPStorageClient(conn)
        await sftp.rmtree(staging_dir)

