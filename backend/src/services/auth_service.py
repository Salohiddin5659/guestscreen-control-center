# -*- coding: utf-8 -*-
"""Operator authentication, password hashing, and Bearer JWT token service."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.exceptions import GuestScreenError
from src.models.user import User

PBKDF2_ITERATIONS = 600_000


class AuthenticationError(GuestScreenError):
    """Raised when user credentials are invalid or token verification fails."""
    pass


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with 600,000 iterations and a 16-byte salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    salt_hex = salt.hex()
    key_hex = key.hex()
    return f"$pbkdf2-sha256${PBKDF2_ITERATIONS}${salt_hex}${key_hex}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored PBKDF2-HMAC-SHA256 hash."""
    parts = hashed_password.split("$")
    if len(parts) != 5 or parts[1] != "pbkdf2-sha256":
        return False

    iterations = int(parts[2])
    salt = bytes.fromhex(parts[3])
    expected_key = bytes.fromhex(parts[4])

    actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual_key, expected_key)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT token encoding user claims."""
    settings = get_settings()
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})

    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a Bearer JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("JWT token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid JWT token.") from exc


async def authenticate_user(
    session: AsyncSession, username: str, password: str
) -> Optional[User]:
    """Verify username and password against PostgreSQL users table."""
    stmt = select(User).where(User.username == username, User.is_active.is_(True))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


async def create_user(
    session: AsyncSession, username: str, password: str, role: str = "Operator"
) -> User:
    """Register a new operator or admin user in PostgreSQL."""
    hashed = hash_password(password)
    user = User(username=username, password_hash=hashed, role=role, is_active=True)
    session.add(user)
    await session.flush()
    return user
