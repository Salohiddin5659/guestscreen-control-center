# -*- coding: utf-8 -*-
"""Unit tests for SFTPStorageClient file transfer adapter (T032)."""
import os
import tempfile
import pytest
import asyncssh

from src.adapters.sftp_storage import SFTPStorageClient
from src.core.exceptions import SafetyBoundaryViolationError
from tests.mock_ssh.mock_server import start_mock_cashbox_server


@pytest.mark.asyncio
async def test_sftp_upload_bytes_and_exists():
    """Verify raw byte upload, existence check, and removal via SFTP."""
    with tempfile.TemporaryDirectory() as chroot_dir:
        async with start_mock_cashbox_server(
            username="admin", password="password", chroot_dir=chroot_dir
        ) as (host, port):
            async with asyncssh.connect(
                host, port=port, username="admin", password="password", known_hosts=None
            ) as conn:
                client = SFTPStorageClient(conn)

                test_content = b"TEST ADVERTISING IMAGE CONTENT"
                remote_path = "uploads/banner.jpg"

                # Upload bytes
                await client.upload_bytes(test_content, remote_path)

                # Check existence
                assert await client.exists(remote_path) is True
                assert await client.exists("uploads/nonexistent.jpg") is False

                # Stat
                attrs = await client.stat(remote_path)
                assert attrs is not None
                assert attrs.size == len(test_content)

                # Remove
                assert await client.remove(remote_path) is True
                assert await client.exists(remote_path) is False


@pytest.mark.asyncio
async def test_sftp_path_traversal_rejection():
    """Verify that path traversal attempts raise SafetyBoundaryViolationError."""
    # We can mock a dummy connection to test client path checks
    client = SFTPStorageClient(None)  # type: ignore

    with pytest.raises(SafetyBoundaryViolationError):
        await client.upload_bytes(b"bad", "../../../windows/system32/evil.exe")

    with pytest.raises(SafetyBoundaryViolationError):
        await client.exists("uploads/../../boot.ini")
