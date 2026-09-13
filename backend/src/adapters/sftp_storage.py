# -*- coding: utf-8 -*-
"""SFTP storage adapter for remote media file transfer to Windows POS cashbox staging folders."""
import os
from pathlib import PureWindowsPath
from typing import Optional

import asyncssh

from src.core.exceptions import SafetyBoundaryViolationError


class SFTPStorageClient:
    """SFTP file transfer client operating over an active AsyncSSH connection."""

    # Allowed cashbox base directories where files may be written
    ALLOWED_ROOTS = [
        "C:\\UCS\\GuestScreen\\Front\\media\\uploads",
        "C:/UCS/GuestScreen/Front/media/uploads",
        "/C:/UCS/GuestScreen/Front/media/uploads",
        "/c:/UCS/GuestScreen/Front/media/uploads",
    ]

    def __init__(self, connection: asyncssh.SSHClientConnection) -> None:
        self.connection = connection

    @staticmethod
    def _sanitize_and_validate_path(remote_path: str) -> str:
        """Ensure remote path does not escape via directory traversal."""
        clean = remote_path.replace("\\", "/")
        parts = clean.split("/")
        if ".." in parts:
            raise SafetyBoundaryViolationError(
                f"Directory traversal detected in SFTP path: '{remote_path}'"
            )
        return clean

    async def _resolve_sftp_path(self, sftp: asyncssh.SFTPClient, remote_path: str) -> str:
        """Format path depending on whether remote SFTP is a chrooted environment or native Windows OpenSSH."""
        clean = self._sanitize_and_validate_path(remote_path)
        pwd = await sftp.getcwd()
        if pwd == "/":
            # Chrooted mock environment: strip Windows drive letter
            clean_no_slash = clean.lstrip("/")
            if len(clean_no_slash) >= 2 and clean_no_slash[1] == ":":
                clean_no_slash = clean_no_slash[2:]
            return clean_no_slash.lstrip("/")
        else:
            # Native Windows OpenSSH: ensure /C:/... format for absolute Windows drive paths
            clean_no_slash = clean.lstrip("/")
            if len(clean_no_slash) >= 2 and clean_no_slash[1] == ":":
                return "/" + clean_no_slash
            return clean

    async def _mkdir_p(self, sftp: asyncssh.SFTPClient, resolved_dir: str) -> None:
        """Recursively create remote directory hierarchy on active SFTP client."""
        parts = resolved_dir.split("/")
        current = ""
        is_absolute = resolved_dir.startswith("/")
        for part in parts:
            if not part:
                continue
            if current:
                current = f"{current}/{part}"
            else:
                current = f"/{part}" if is_absolute else part
            # Skip root drive specifier like /C: or C:
            if ":" in current and len(current.strip("/")) <= 2:
                continue
            try:
                await sftp.mkdir(current)
            except (asyncssh.SFTPError, OSError):
                # Directory already exists or root permission
                pass

    async def upload_file(self, local_path: str, remote_path: str) -> None:
        """Upload a local file to remote destination over SFTP."""
        self._sanitize_and_validate_path(remote_path)
        async with self.connection.start_sftp_client() as sftp:
            resolved = await self._resolve_sftp_path(sftp, remote_path)
            parts = resolved.split("/")
            if len(parts) > 1:
                remote_dir = "/".join(parts[:-1])
                await self._mkdir_p(sftp, remote_dir)
            await sftp.put(local_path, resolved)

    async def upload_bytes(self, data: bytes, remote_path: str) -> None:
        """Upload raw binary bytes directly to remote file over SFTP."""
        self._sanitize_and_validate_path(remote_path)
        async with self.connection.start_sftp_client() as sftp:
            resolved = await self._resolve_sftp_path(sftp, remote_path)
            parts = resolved.split("/")
            if len(parts) > 1:
                remote_dir = "/".join(parts[:-1])
                await self._mkdir_p(sftp, remote_dir)
            async with sftp.open(resolved, "wb") as remote_file:
                await remote_file.write(data)

    async def mkdir_p(self, remote_dir: str) -> None:
        """Recursively create remote directory hierarchy if not already present."""
        self._sanitize_and_validate_path(remote_dir)
        async with self.connection.start_sftp_client() as sftp:
            resolved = await self._resolve_sftp_path(sftp, remote_dir)
            await self._mkdir_p(sftp, resolved)

    async def exists(self, remote_path: str) -> bool:
        """Check if remote file or directory exists."""
        self._sanitize_and_validate_path(remote_path)
        try:
            async with self.connection.start_sftp_client() as sftp:
                resolved = await self._resolve_sftp_path(sftp, remote_path)
                await sftp.stat(resolved)
                return True
        except (asyncssh.SFTPError, OSError):
            return False

    async def remove(self, remote_path: str) -> bool:
        """Remove a remote file if it exists."""
        self._sanitize_and_validate_path(remote_path)
        try:
            async with self.connection.start_sftp_client() as sftp:
                resolved = await self._resolve_sftp_path(sftp, remote_path)
                await sftp.remove(resolved)
                return True
        except (asyncssh.SFTPError, OSError):
            return False

    async def stat(self, remote_path: str) -> Optional[asyncssh.SFTPAttrs]:
        """Get attributes of remote file."""
        self._sanitize_and_validate_path(remote_path)
        try:
            async with self.connection.start_sftp_client() as sftp:
                resolved = await self._resolve_sftp_path(sftp, remote_path)
                return await sftp.stat(resolved)
        except (asyncssh.SFTPError, OSError):
            return None

    async def rmtree(self, remote_dir: str) -> None:
        """Recursively delete a remote directory and all its contents via SFTP."""
        self._sanitize_and_validate_path(remote_dir)
        async with self.connection.start_sftp_client() as sftp:
            resolved = await self._resolve_sftp_path(sftp, remote_dir)
            import stat as stat_mod

            async def _remove_recursive(path: str) -> None:
                try:
                    attrs = await sftp.stat(path)
                except (asyncssh.SFTPError, OSError):
                    return

                if stat_mod.S_ISDIR(attrs.permissions or 0):
                    try:
                        names = await sftp.listdir(path)
                    except (asyncssh.SFTPError, OSError):
                        names = []
                    for name in names:
                        if name in (".", ".."):
                            continue
                        sub_path = f"{path}/{name}"
                        await _remove_recursive(sub_path)
                    try:
                        await sftp.rmdir(path)
                    except (asyncssh.SFTPError, OSError):
                        pass
                else:
                    try:
                        await sftp.remove(path)
                    except (asyncssh.SFTPError, OSError):
                        pass

            await _remove_recursive(resolved)
