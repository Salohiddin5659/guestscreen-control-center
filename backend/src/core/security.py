# -*- coding: utf-8 -*-
"""Master key provider and secret isolation. Guarantees zero secret leakage."""
import base64
import binascii
import os
from pathlib import Path
from typing import Optional

from src.core.config import get_settings
from src.core.exceptions import MasterKeyMissingError

_cached_master_key: Optional[bytes] = None


class MasterKey:
    """Opaque container for 256-bit symmetric encryption key. Prevents string leakage."""

    def __init__(self, key_bytes: bytes) -> None:
        if len(key_bytes) != 32:
            raise MasterKeyMissingError(
                f"Master key must be exactly 32 bytes (256 bits), got {len(key_bytes)} bytes."
            )
        self._key = key_bytes

    def get_raw_bytes(self) -> bytes:
        """Retrieve raw 32 bytes for cryptographic operations."""
        return self._key

    def __repr__(self) -> str:
        return "<MasterKey: [PROTECTED_32_BYTES]>"

    def __str__(self) -> str:
        return "<MasterKey: [PROTECTED]>"


def load_master_key() -> MasterKey:
    """Load and validate 32-byte master key from GS_MASTER_KEY env or GS_MASTER_KEY_FILE.

    Raises:
        MasterKeyMissingError: If neither source is configured or key length is invalid.
    """
    global _cached_master_key
    if _cached_master_key is not None:
        return MasterKey(_cached_master_key)

    settings = get_settings()
    raw_key_str: Optional[str] = settings.GS_MASTER_KEY

    # If env var not set, check file path
    if not raw_key_str and settings.GS_MASTER_KEY_FILE:
        key_path = Path(settings.GS_MASTER_KEY_FILE)
        if key_path.is_file():
            raw_key_str = key_path.read_text(encoding="utf-8").strip()

    if not raw_key_str:
        raise MasterKeyMissingError(
            "Neither GS_MASTER_KEY environment variable nor GS_MASTER_KEY_FILE contains a valid master key."
        )

    # Attempt hex decoding first (64 hex characters -> 32 bytes)
    key_bytes: Optional[bytes] = None
    if len(raw_key_str) == 64:
        try:
            key_bytes = bytes.fromhex(raw_key_str)
        except ValueError:
            pass

    # If not hex, attempt base64 decoding (44 characters -> 32 bytes)
    if key_bytes is None:
        try:
            decoded = base64.b64decode(raw_key_str)
            if len(decoded) == 32:
                key_bytes = decoded
        except (ValueError, binascii.Error):
            pass

    # If still None, check if raw UTF-8 string is exactly 32 bytes
    if key_bytes is None and len(raw_key_str.encode("utf-8")) == 32:
        key_bytes = raw_key_str.encode("utf-8")

    if key_bytes is None or len(key_bytes) != 32:
        raise MasterKeyMissingError(
            f"Invalid master key encoding or length: decoded length must be exactly 32 bytes."
        )

    _cached_master_key = key_bytes
    return MasterKey(_cached_master_key)
