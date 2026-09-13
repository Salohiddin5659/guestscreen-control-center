import pytest
from app.core.security import encrypt_secret, decrypt_secret


def test_encrypt_and_decrypt_secret():
    plain = "SuperSecurePassword123!#$"
    encrypted = encrypt_secret(plain)
    assert isinstance(encrypted, bytes)
    assert len(encrypted) > len(plain)
    
    decrypted = decrypt_secret(encrypted)
    assert decrypted == plain


def test_encrypt_empty_secret():
    assert encrypt_secret("") == b""
    assert decrypt_secret(b"") == ""


def test_decrypt_invalid_secret():
    with pytest.raises(Exception):
        decrypt_secret(b"short")
