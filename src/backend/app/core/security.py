from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_encryption_key() -> bytes:
    key_str = settings.GS_MASTER_KEY or settings.CREDENTIAL_ENCRYPTION_KEY
    if not key_str:
        raise ValueError("Neither GS_MASTER_KEY nor CREDENTIAL_ENCRYPTION_KEY is configured")
    key_str = key_str.strip()
    try:
        key_bytes = bytes.fromhex(key_str)
        if len(key_bytes) == 32:
            return key_bytes
    except ValueError:
        pass
    # If not 64 hex chars, derive 32-byte key via SHA-256
    return hashlib.sha256(key_str.encode("utf-8")).digest()


def encrypt_secret(plaintext: str) -> bytes:
    """Encrypt a plaintext string using AES-256-GCM. Returns nonce + ciphertext + tag as bytes."""
    if not plaintext:
        return b""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ciphertext


def decrypt_secret(encrypted_data: bytes) -> str:
    """Decrypt an AES-256-GCM encrypted byte sequence (nonce + ciphertext + tag) to plaintext string."""
    if not encrypted_data:
        return ""
    if len(encrypted_data) < 28:
        raise ValueError("Encrypted data payload is too short")
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode("utf-8")

