import os
import base64
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


class SecretVault:
    def __init__(self, key_hex: Optional[str] = None):
        hex_str = key_hex or settings.CREDENTIAL_ENCRYPTION_KEY
        try:
            self.key = bytes.fromhex(hex_str)
            if len(self.key) != 32:
                # Pad or truncate if needed for valid 32-byte AES-256 key
                self.key = (self.key + b'\x00' * 32)[:32]
        except Exception:
            # Fallback deterministic key derivation for development
            self.key = (hex_str.encode('utf-8') + b'\x00' * 32)[:32]
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, plaintext: str) -> bytes:
        if not plaintext:
            return b""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        return nonce + ciphertext

    def decrypt(self, encrypted_data: bytes) -> str:
        if not encrypted_data or len(encrypted_data) < 28:
            return ""
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        decrypted = self.aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")


vault = SecretVault()
ssh_vault = vault


def get_master_ssh_private_key() -> Optional[str]:
    """
    Returns the decoded SSH private key string from environment variable.
    """
    b64_key = settings.SSH_MASTER_PRIVATE_KEY_B64
    if not b64_key:
        # Check standard ssh key path if available
        key_path = os.path.expanduser("~/.ssh/id_ed25519")
        if os.path.exists(key_path):
            with open(key_path, "r") as f:
                return f.read()
        return None
    try:
        return base64.b64decode(b64_key).decode("utf-8")
    except Exception:
        return b64_key
