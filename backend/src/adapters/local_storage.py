# -*- coding: utf-8 -*-
"""Local filesystem implementation of StorageProvider with strict path traversal guard."""
import os
from pathlib import Path
from typing import Optional

from src.adapters.media_storage import StorageProvider
from src.core.config import get_settings
from src.core.exceptions import SafetyBoundaryViolationError


class LocalFileSystemStorageProvider:
    """Stores media assets on local host disk with path sanitization."""

    def __init__(self, root_dir: Optional[str] = None) -> None:
        if root_dir is None:
            settings = get_settings()
            root_dir = settings.MEDIA_STORAGE_PATH

        self.root_path = Path(root_dir).resolve()
        self.root_path.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, filename_or_path: str) -> Path:
        """Resolve path and verify it stays strictly within the root directory."""
        # Strip leading slashes to prevent root-relative override
        clean_name = filename_or_path.lstrip("/\\")
        target = (self.root_path / clean_name).resolve()

        try:
            target.relative_to(self.root_path)
        except ValueError as exc:
            raise SafetyBoundaryViolationError(
                f"Path traversal attempt detected: '{filename_or_path}' escapes storage root."
            ) from exc

        return target

    async def save(self, file_bytes: bytes, filename: str) -> str:
        """Save raw binary to local filesystem; return absolute path string."""
        target_path = self._resolve_safe_path(filename)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        target_path.write_bytes(file_bytes)
        return str(target_path)

    async def get(self, storage_path: str) -> bytes:
        """Retrieve binary content from local filesystem."""
        target_path = self._resolve_safe_path(storage_path)
        if not target_path.is_file():
            raise FileNotFoundError(f"Media file does not exist: {target_path}")

        return target_path.read_bytes()

    async def exists(self, storage_path: str) -> bool:
        """Verify file existence on disk."""
        try:
            target_path = self._resolve_safe_path(storage_path)
            return target_path.is_file()
        except SafetyBoundaryViolationError:
            return False

    async def delete(self, storage_path: str) -> bool:
        """Remove file from disk."""
        target_path = self._resolve_safe_path(storage_path)
        if target_path.is_file():
            target_path.unlink()
            return True
        return False
