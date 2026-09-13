from uuid import uuid4
from app.models.content import AdvertisingBlock, PlaylistItem
from app.domain.idempotency import calculate_idempotency_key, is_content_identical


def test_idempotency_key_deterministic():
    cid = uuid4()
    block = AdvertisingBlock(name="Block A", area="FULL_SCREEN", display_mode="STATIC")
    mid = uuid4()
    items = [PlaylistItem(advertising_block_id=block.id, media_asset_id=mid, order_index=0, duration_seconds=7)]

    k1 = calculate_idempotency_key(cid, block, items)
    k2 = calculate_idempotency_key(cid, block, items)

    assert k1 == k2
    assert is_content_identical(k1, k2) is True
    assert is_content_identical("different_hash", k1) is False
