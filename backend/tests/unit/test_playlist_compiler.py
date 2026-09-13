# -*- coding: utf-8 -*-
"""Unit tests for PlaylistCompiler dynamic ordering, intervals, and reordering (T053)."""
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.models.media import AdMode, MediaAsset
from src.services.playlist_compiler import PlaylistCompiler, SlideSpec


@pytest.fixture
def compiler() -> PlaylistCompiler:
    return PlaylistCompiler()


async def _create_test_media(
    db: AsyncSession, filename: str, width: int = 1024, height: int = 768
) -> MediaAsset:
    media = MediaAsset(
        id=uuid.uuid4(),
        filename=filename,
        storage_path=f"full/{filename}",
        sha256=uuid.uuid4().hex + uuid.uuid4().hex,
        file_size_bytes=10240,
        width=width,
        height=height,
        aspect_ratio="4:3" if width == 1024 else "2:3",
        mime_type="image/jpeg",
        ad_mode="FULL" if width == 1024 else "SPLIT",
    )
    db.add(media)
    await db.flush()
    return media


@pytest.mark.asyncio
async def test_compile_dynamic_playlist_success(async_db_session: AsyncSession, compiler: PlaylistCompiler):
    """Verify creating dynamic playlist with 3 slides and varying durations."""
    m1 = await _create_test_media(async_db_session, "slide1.jpg")
    m2 = await _create_test_media(async_db_session, "slide2.jpg")
    m3 = await _create_test_media(async_db_session, "slide3.jpg")

    specs = [
        SlideSpec(media_id=m1.id, duration_seconds=5),
        SlideSpec(media_id=m2.id, duration_seconds=7),
        SlideSpec(media_id=m3.id, duration_seconds=10),
    ]

    playlist = await compiler.compile_dynamic_playlist(
        db=async_db_session,
        name="Lunch Promo Slideshow",
        slide_specs=specs,
        ad_mode=AdMode.FULL,
        default_interval_sec=5,
    )
    assert playlist.name == "Lunch Promo Slideshow"
    assert playlist.is_dynamic is True

    compiled = await compiler.compile_for_deployment(async_db_session, playlist.id)
    assert len(compiled.slides) == 3
    assert [s.filename for s in compiled.slides] == ["slide1.jpg", "slide2.jpg", "slide3.jpg"]
    assert [s.duration_seconds for s in compiled.slides] == [5, 7, 10]
    assert [s.position for s in compiled.slides] == [0, 1, 2]


@pytest.mark.asyncio
async def test_reorder_playlist_items(async_db_session: AsyncSession, compiler: PlaylistCompiler):
    """Verify atomic reordering of playlist items."""
    m1 = await _create_test_media(async_db_session, "slide_a.jpg")
    m2 = await _create_test_media(async_db_session, "slide_b.jpg")
    m3 = await _create_test_media(async_db_session, "slide_c.jpg")

    playlist = await compiler.compile_dynamic_playlist(
        db=async_db_session,
        name="Reorder Test",
        slide_specs=[
            SlideSpec(media_id=m1.id),
            SlideSpec(media_id=m2.id),
            SlideSpec(media_id=m3.id),
        ],
    )

    from sqlalchemy import select
    from src.models.playlist import PlaylistItem
    items = (await async_db_session.scalars(
        select(PlaylistItem).where(PlaylistItem.playlist_id == playlist.id).order_by(PlaylistItem.position)
    )).all()

    new_order = [items[2].id, items[0].id, items[1].id]
    reordered = await compiler.reorder_playlist_items(async_db_session, playlist.id, new_order)

    assert len(reordered) == 3
    assert reordered[0].id == items[2].id
    assert reordered[0].position == 0
    assert reordered[1].id == items[0].id
    assert reordered[1].position == 1
    assert reordered[2].id == items[1].id
    assert reordered[2].position == 2

    # Verify compiled output matches new order
    compiled_after = await compiler.compile_for_deployment(async_db_session, playlist.id)
    assert [s.filename for s in compiled_after.slides] == ["slide_c.jpg", "slide_a.jpg", "slide_b.jpg"]


@pytest.mark.asyncio
async def test_invalid_duration_validation(compiler: PlaylistCompiler):
    """Verify validation boundaries for slide durations (1s to 300s)."""
    with pytest.raises(ValidationDomainError):
        compiler.validate_duration(0)

    with pytest.raises(ValidationDomainError):
        compiler.validate_duration(301)

    assert compiler.validate_duration(1) == 1
    assert compiler.validate_duration(300) == 300


@pytest.mark.asyncio
async def test_reorder_rejects_duplicate_items(async_db_session: AsyncSession, compiler: PlaylistCompiler):
    """Verify reorder rejects duplicate item IDs."""
    fake_id = uuid.uuid4()
    with pytest.raises(ValidationDomainError, match="Duplicate item IDs"):
        await compiler.reorder_playlist_items(async_db_session, uuid.uuid4(), [fake_id, fake_id])
