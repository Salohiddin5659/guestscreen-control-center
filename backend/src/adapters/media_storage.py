# -*- coding: utf-8 -*-
"""Decoupled StorageProvider protocol for central media asset persistence."""
import typing


@typing.runtime_checkable
class StorageProvider(typing.Protocol):
    """Abstract interface decoupling domain logic from physical storage (Local Disk, S3, MinIO)."""

    async def save(self, file_bytes: bytes, filename: str) -> str:
        """Save raw binary to storage; return absolute or relative storage_path."""
        ...

    async def get(self, storage_path: str) -> bytes:
        """Retrieve binary content from storage."""
        ...

    async def exists(self, storage_path: str) -> bool:
        """Verify object existence in storage."""
        ...

    async def delete(self, storage_path: str) -> bool:
        """Remove binary content from storage."""
        ...
