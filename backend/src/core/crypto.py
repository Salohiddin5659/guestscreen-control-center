# -*- coding: utf-8 -*-
"""AES-256-GCM symmetric encryption service for SSH credentials."""
import os
from typing import Optional, Tuple
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from src.core.exceptions import GuestScreenError
from src.core.security import MasterKey, load_master_key


class DecryptionFailedError(GuestScreenError):
    """Raised when AES-256-GCM authentication tag verification fails (data tampered or wrong key)."""
    pass


def encrypt_secret(
    plaintext: str, master_key: Optional[MasterKey] = None
) -> Tuple[bytes, bytes, bytes]:
    """Encrypt a plaintext string using AES-256-GCM with a fresh 12-byte initialization vector.

    Args:
        plaintext: Raw secret string (e.g. SSH password or private key).
        master_key: Optional MasterKey container; if omitted, loads from environment.

    Returns:
        Tuple of (ciphertext, nonce, tag) as raw bytes.
    """
    if master_key is None:
        master_key = load_master_key()

    key_bytes = master_key.get_raw_bytes()
    aesgcm = AESGCM(key_bytes)

    # 12-byte standard GCM nonce
    nonce = os.urandom(12)
    plaintext_bytes = plaintext.encode("utf-8")

    # In cryptography library, encrypt() returns ciphertext with the 16-byte auth tag appended
    encrypted_payload = aesgcm.encrypt(nonce, plaintext_bytes, None)

    ciphertext = encrypted_payload[:-16]
    tag = encrypted_payload[-16:]

    return ciphertext, nonce, tag


def decrypt_secret(
    ciphertext: bytes,
    nonce: bytes,
    tag: bytes,
    master_key: Optional[MasterKey] = None,
) -> str:
    """Decrypt ciphertext and verify authenticity tag using AES-256-GCM.

    Args:
        ciphertext: Encrypted payload bytes.
        nonce: 12-byte initialization vector.
        tag: 16-byte authentication tag.
        master_key: Optional MasterKey container.

    Returns:
        Decrypted plaintext string.

    Raises:
        DecryptionFailedError: If tag verification fails or data is corrupted.
    """
    if len(nonce) != 12:
        raise DecryptionFailedError(f"Invalid nonce length: expected 12 bytes, got {len(nonce)}")
    if len(tag) != 16:
        raise DecryptionFailedError(f"Invalid tag length: expected 16 bytes, got {len(tag)}")

    if master_key is None:
        master_key = load_master_key()

    key_bytes = master_key.get_raw_bytes()
    aesgcm = AESGCM(key_bytes)

    combined_payload = ciphertext + tag

    try:
        decrypted_bytes = aesgcm.decrypt(nonce, combined_payload, None)
        return decrypted_bytes.decode("utf-8")
    except InvalidTag as exc:
        raise DecryptionFailedError(
            "AES-256-GCM tag verification failed: corrupted data or wrong master key."
        ) from exc
    except UnicodeDecodeError as exc:
        raise DecryptionFailedError("Decrypted bytes failed UTF-8 decoding.") from exc
