import hashlib
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.content import AdvertisingBlock, PlaylistItem


def calculate_idempotency_key(
    cashier_id: UUID,
    block: AdvertisingBlock,
    items: List[PlaylistItem]
) -> str:
    """
    Computes a deterministic SHA-256 fingerprint representing the cashier
    and the exact content of the advertising block.
    """
    hasher = hashlib.sha256()
    hasher.update(str(cashier_id).encode("utf-8"))
    hasher.update(str(block.id).encode("utf-8"))
    hasher.update(str(block.area).encode("utf-8"))
    hasher.update(str(block.display_mode).encode("utf-8"))
    
    # Include item IDs, order, durations
    for item in sorted(items, key=lambda x: x.order_index):
        hasher.update(f"{item.media_asset_id}:{item.order_index}:{item.duration_seconds}".encode("utf-8"))

    return hasher.hexdigest()


def is_content_identical(
    current_content_version: Optional[str],
    calculated_key: str
) -> bool:
    """Checks if cashier already runs the exact same content payload."""
    if not current_content_version:
        return False
    return current_content_version == calculated_key
