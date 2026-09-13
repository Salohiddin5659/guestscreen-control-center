# -*- coding: utf-8 -*-
"""Encrypted SSH credential storage model for cashier monoblocks."""
import enum
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from src.models.cashbox import Cashbox


class SSHAuthType(str, enum.Enum):
    """Authentication mechanism for cashbox SSH access."""
    PASSWORD = "PASSWORD"
    KEY = "KEY"


class SSHCredential(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Encrypted storage for cashbox SSH credentials (AES-256-GCM)."""
    __tablename__ = "ssh_credentials"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    auth_type: Mapped[str] = mapped_column(
        String(20), default=SSHAuthType.PASSWORD.value, nullable=False
    )

    # AES-256-GCM encrypted payload, nonce, and authentication tag
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)  # Exactly 12 bytes
    tag: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)    # Exactly 16 bytes

    key_fingerprint: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    cashboxes: Mapped[List["Cashbox"]] = relationship("Cashbox", back_populates="credential")
