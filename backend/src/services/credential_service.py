# -*- coding: utf-8 -*-
"""Service for securely managing AES-256-GCM encrypted SSH credentials."""
import hashlib
import uuid
from typing import List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crypto import decrypt_secret, encrypt_secret
from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.core.security import MasterKey
from src.models.credential import SSHAuthType, SSHCredential


class CredentialService:
    """Encrypted credential vault service using AES-256-GCM."""

    @staticmethod
    def _compute_key_fingerprint(secret: str) -> Optional[str]:
        """Compute SHA-256 fingerprint for public/private key or fallback identifier."""
        clean = secret.strip()
        if "PRIVATE KEY" in clean or "ssh-rsa" in clean or "ssh-ed25519" in clean:
            digest = hashlib.sha256(clean.encode("utf-8")).hexdigest()
            return f"SHA256:{digest[:32]}"
        return None

    async def create_credential(
        self,
        db: AsyncSession,
        name: str,
        username: str,
        secret: str,
        auth_type: SSHAuthType | str = SSHAuthType.PASSWORD,
        key_fingerprint: Optional[str] = None,
        master_key: Optional[MasterKey] = None,
    ) -> SSHCredential:
        """Encrypt secret with AES-256-GCM and store credentials in PostgreSQL."""
        name = name.strip()
        username = username.strip()
        if not secret:
            raise ValidationDomainError("Credential secret cannot be empty.")

        auth_type_str = auth_type.value if isinstance(auth_type, SSHAuthType) else str(auth_type).upper()
        if auth_type_str not in (SSHAuthType.PASSWORD.value, SSHAuthType.KEY.value):
            raise ValidationDomainError(f"Unsupported auth_type: {auth_type}")

        # Encrypt secret using AES-256-GCM
        ciphertext, nonce, tag = encrypt_secret(secret, master_key=master_key)

        # Auto-compute fingerprint if not explicitly provided and secret is a key
        if not key_fingerprint and auth_type_str == SSHAuthType.KEY.value:
            key_fingerprint = self._compute_key_fingerprint(secret)

        cred = SSHCredential(
            id=uuid.uuid4(),
            name=name,
            username=username,
            auth_type=auth_type_str,
            ciphertext=ciphertext,
            nonce=nonce,
            tag=tag,
            key_fingerprint=key_fingerprint,
        )
        db.add(cred)
        await db.flush()
        return cred

    async def get_credential(self, db: AsyncSession, credential_id: uuid.UUID) -> SSHCredential:
        """Retrieve credential metadata by ID without decrypting the secret."""
        cred = await db.get(SSHCredential, credential_id)
        if not cred:
            raise EntityNotFoundError(f"SSHCredential with ID '{credential_id}' not found.")
        return cred

    async def list_credentials(self, db: AsyncSession) -> Sequence[SSHCredential]:
        """List all registered SSH credentials (metadata only; secrets remain encrypted)."""
        result = await db.scalars(select(SSHCredential).order_by(SSHCredential.name.asc()))
        return result.all()

    async def get_decrypted_secret(
        self,
        db: AsyncSession,
        credential_id: uuid.UUID,
        master_key: Optional[MasterKey] = None,
    ) -> str:
        """Retrieve and decrypt the plaintext secret using AES-256-GCM."""
        cred = await self.get_credential(db, credential_id)
        return decrypt_secret(
            ciphertext=cred.ciphertext,
            nonce=cred.nonce,
            tag=cred.tag,
            master_key=master_key,
        )

    async def update_credential(
        self,
        db: AsyncSession,
        credential_id: uuid.UUID,
        name: Optional[str] = None,
        username: Optional[str] = None,
        secret: Optional[str] = None,
        auth_type: Optional[SSHAuthType | str] = None,
        key_fingerprint: Optional[str] = None,
        master_key: Optional[MasterKey] = None,
    ) -> SSHCredential:
        """Update SSH credential attributes, re-encrypting secret if changed."""
        cred = await self.get_credential(db, credential_id)

        if name is not None:
            cred.name = name.strip()
        if username is not None:
            cred.username = username.strip()
        if auth_type is not None:
            auth_type_str = auth_type.value if isinstance(auth_type, SSHAuthType) else str(auth_type).upper()
            if auth_type_str not in (SSHAuthType.PASSWORD.value, SSHAuthType.KEY.value):
                raise ValidationDomainError(f"Unsupported auth_type: {auth_type}")
            cred.auth_type = auth_type_str

        if secret is not None:
            if not secret:
                raise ValidationDomainError("Updated secret cannot be empty.")
            ciphertext, nonce, tag = encrypt_secret(secret, master_key=master_key)
            cred.ciphertext = ciphertext
            cred.nonce = nonce
            cred.tag = tag
            if key_fingerprint is None and cred.auth_type == SSHAuthType.KEY.value:
                key_fingerprint = self._compute_key_fingerprint(secret)

        if key_fingerprint is not None:
            cred.key_fingerprint = key_fingerprint

        await db.flush()
        return cred

    async def delete_credential(self, db: AsyncSession, credential_id: uuid.UUID) -> bool:
        """Delete credential from database."""
        cred = await self.get_credential(db, credential_id)
        await db.delete(cred)
        await db.flush()
        return True
