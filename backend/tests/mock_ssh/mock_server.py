# -*- coding: utf-8 -*-
"""In-memory AsyncSSH and SFTP mock server test harness for cashbox command adapter testing."""
import asyncio
from contextlib import asynccontextmanager
import json
import os
import tempfile
from typing import AsyncGenerator, Optional, Tuple

import asyncssh


class MockCashboxSSHServer(asyncssh.SSHServer):
    """AsyncSSH server implementation emulating a retail Windows POS cashbox."""

    def __init__(
        self,
        valid_username: str = "Administrator",
        valid_password: str = "test_pass",
        valid_public_keys: Optional[list] = None,
    ) -> None:
        self.valid_username = valid_username
        self.valid_password = valid_password
        self.valid_public_keys = valid_public_keys or []

    def begin_auth(self, username: str) -> bool:
        return True

    def password_auth_supported(self) -> bool:
        return bool(self.valid_password)

    def validate_password(self, username: str, password: str) -> bool:
        return username == self.valid_username and password == self.valid_password

    def public_key_auth_supported(self) -> bool:
        return bool(self.valid_public_keys)

    def validate_public_key(self, username: str, key: asyncssh.SSHKey) -> bool:
        return username == self.valid_username and key in self.valid_public_keys



def create_process_handler(custom_responses: Optional[dict] = None):
    """Create a process handler callback simulating Windows CLI and PowerShell responses."""
    responses = custom_responses or {}

    async def mock_process_factory(process: asyncssh.SSHServerProcess) -> None:
        cmd = process.command or ""

        # Check custom overrides first
        for pattern, handler in responses.items():
            if pattern in cmd:
                if callable(handler):
                    exit_code, stdout, stderr = handler(cmd)
                else:
                    exit_code, stdout, stderr = handler
                if stdout:
                    process.stdout.write(stdout)
                if stderr:
                    process.stderr.write(stderr)
                process.exit(exit_code)
                return

        # Default command emulation
        if "Write-Output PONG" in cmd or "PONG" in cmd:
            process.stdout.write("PONG\r\n")
            process.exit(0)

        elif "Get-ChildItem" in cmd and "uploads" in cmd:
            # CMD_INVENTORY
            mock_inventory = [
                {
                    "filename": "promo_1024x768.jpg",
                    "size": 102400,
                    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "modified_at": "2026-09-10T10:00:00.0000000Z",
                }
            ]
            process.stdout.write(json.dumps(mock_inventory) + "\r\n")
            process.exit(0)

        elif "Get-FileHash" in cmd:
            # CMD_HASH_VERIFY
            process.stdout.write("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\r\n")
            process.exit(0)

        elif "Move-Item" in cmd:
            # CMD_STAGING_MOVE
            process.exit(0)

        elif "sqlite3.exe" in cmd and "SELECT Raw FROM scenes" in cmd:
            # CMD_SQLITE_READ_SCENE
            sample_scene = json.dumps({"guid": "2509359c-2d71-4344-9be4-7d90dd453083", "mode": "FULL_SCREEN", "slides": []})
            process.stdout.write(sample_scene + "\r\n")
            process.exit(0)

        elif "sqlite3.exe" in cmd and "SELECT * FROM" in cmd:
            # Table hash / boundary inspection
            process.stdout.write("row1|val1\nrow2|val2\r\n")
            process.exit(0)

        elif "sqlite3.exe" in cmd and "UPDATE scenes SET Raw" in cmd:
            # CMD_SQLITE_UPDATE_SCENE
            process.exit(0)

        elif "sync_version.txt" in cmd and "Set-Content" in cmd:
            # CMD_TOUCH_RELOAD
            process.exit(0)

        elif "Get-Process -Name 'GuestScreen'" in cmd:
            # CMD_PROC_INSPECT
            inspect_res = {"Id": 4120, "StartTime": "2026-09-10T08:00:00.0000000Z"}
            process.stdout.write(json.dumps(inspect_res) + "\r\n")
            process.exit(0)

        else:
            process.stderr.write(f"Mock SSH: Unrecognized or unauthorized command: {cmd}\r\n")
            process.exit(1)

    return mock_process_factory


@asynccontextmanager
async def start_mock_cashbox_server(
    username: str = "Administrator",
    password: str = "test_pass",
    chroot_dir: Optional[str] = None,
    custom_responses: Optional[dict] = None,
) -> AsyncGenerator[Tuple[str, int], None]:
    """Context manager spinning up an ephemeral mock SSH/SFTP server on localhost."""
    host_key = asyncssh.generate_private_key("ssh-rsa")

    with tempfile.TemporaryDirectory() as temp_dir:
        target_chroot = chroot_dir or temp_dir
        proc_factory = create_process_handler(custom_responses)

        server = await asyncssh.create_server(
            lambda: MockCashboxSSHServer(valid_username=username, valid_password=password),
            host="127.0.0.1",
            port=0,
            server_host_keys=[host_key],
            process_factory=proc_factory,
            sftp_factory=lambda conn: asyncssh.SFTPServer(conn, chroot=target_chroot),
        )

        port = server.sockets[0].getsockname()[1]
        try:
            yield "127.0.0.1", port
        finally:
            server.close()
            await server.wait_closed()
