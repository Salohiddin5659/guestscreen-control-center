# -*- coding: utf-8 -*-
"""Comprehensive security verification test suite."""
from datetime import timedelta
import pytest
from src.core.crypto import DecryptionFailedError, decrypt_secret, encrypt_secret
from src.core.exceptions import MasterKeyMissingError
from src.core.security import MasterKey, load_master_key
from src.services.auth_service import (
    AuthenticationError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_master_key_protection_and_length():
    """Verify MasterKey hides secret in string representations and validates 32 bytes."""
    valid_key = b"01234567890123456789012345678901"
    mk = MasterKey(valid_key)

    # Assert secret bytes are not visible in string representation
    assert "0123456789" not in str(mk)
    assert "0123456789" not in repr(mk)
    assert repr(mk) == "<MasterKey: [PROTECTED_32_BYTES]>"
    assert str(mk) == "<MasterKey: [PROTECTED]>"

    # Invalid key length must raise MasterKeyMissingError
    with pytest.raises(MasterKeyMissingError):
        MasterKey(b"too_short")

    with pytest.raises(MasterKeyMissingError):
        MasterKey(b"way_too_long_key_exceeding_the_standard_thirty_two_bytes_limit!")


def test_aes_256_gcm_encryption_roundtrip():
    """Verify encryption and decryption roundtrip for credentials."""
    valid_key = b"01234567890123456789012345678901"
    mk = MasterKey(valid_key)

    original_password = "VeryComplexCashierPassword!2026"
    ciphertext, nonce, tag = encrypt_secret(original_password, master_key=mk)

    assert len(nonce) == 12
    assert len(tag) == 16
    assert ciphertext != original_password.encode("utf-8")

    decrypted = decrypt_secret(ciphertext, nonce, tag, master_key=mk)
    assert decrypted == original_password


def test_aes_256_gcm_fresh_nonce_per_operation():
    """Verify encrypting identical plaintext twice produces distinct nonces and ciphertexts."""
    valid_key = b"01234567890123456789012345678901"
    mk = MasterKey(valid_key)

    plaintext = "SamePasswordTwice"
    c1, n1, t1 = encrypt_secret(plaintext, master_key=mk)
    c2, n2, t2 = encrypt_secret(plaintext, master_key=mk)

    assert n1 != n2, "Nonce must be unique per encryption"
    assert c1 != c2, "Ciphertext must differ due to unique nonce"


def test_aes_256_gcm_tamper_detection():
    """Verify tampering with ciphertext or authentication tag raises DecryptionFailedError."""
    valid_key = b"01234567890123456789012345678901"
    mk = MasterKey(valid_key)

    ciphertext, nonce, tag = encrypt_secret("SecretData", master_key=mk)

    # Corrupt ciphertext byte
    tampered_ciphertext = bytearray(ciphertext)
    tampered_ciphertext[0] ^= 0xFF

    with pytest.raises(DecryptionFailedError):
        decrypt_secret(bytes(tampered_ciphertext), nonce, tag, master_key=mk)

    # Corrupt authentication tag byte
    tampered_tag = bytearray(tag)
    tampered_tag[0] ^= 0xFF

    with pytest.raises(DecryptionFailedError):
        decrypt_secret(ciphertext, nonce, bytes(tampered_tag), master_key=mk)


def test_password_hashing_and_verification():
    """Verify PBKDF2-HMAC-SHA256 password hashing and verification."""
    password = "OperatorPass@123"
    hashed = hash_password(password)

    assert hashed.startswith("$pbkdf2-sha256$600000$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_expiry():
    """Verify JWT token encoding and expiration validation."""
    data = {"sub": "admin_user", "role": "Admin"}
    token = create_access_token(data, expires_delta=timedelta(minutes=10))

    payload = decode_access_token(token)
    assert payload["sub"] == "admin_user"
    assert payload["role"] == "Admin"

    # Expired token test
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-10))
    with pytest.raises(AuthenticationError, match="expired"):
        decode_access_token(expired_token)
