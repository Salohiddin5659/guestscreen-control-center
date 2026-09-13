import json
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset
from app.models.publication import PublicationBatch, PublicationJob
from app.models.topology import Cashier, Branch, Region
from app.domain.content_validator import validate_advertising_block, ValidationError
from app.domain.scene_builder import build_guest_screen_scene
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/advertising-blocks", tags=["Advertising Blocks"])


class PlaylistItemInput(BaseModel):
    media_asset_id: UUID
    order_index: int = 0
    duration_seconds: int = Field(default=7, ge=1, le=60)


class AdvertisingBlockCreate(BaseModel):
    name: str
    description: Optional[str] = None
    area: str          # FULL_SCREEN, MODE32_PROMO
    display_mode: str  # STATIC, SLIDESHOW, VIDEO
    is_active: bool = True
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    items: List[PlaylistItemInput]


class AdvertisingBlockUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    display_mode: Optional[str] = None
    is_active: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    version: Optional[int] = None
    items: Optional[List[PlaylistItemInput]] = None


class PlaylistUpdatePayload(BaseModel):
    version: Optional[int] = None
    items: List[PlaylistItemInput]


class DuplicateBlockPayload(BaseModel):
    name: Optional[str] = None


@router.get("", response_model=List[dict])
async def list_advertising_blocks(
    area: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(AdvertisingBlock).order_by(AdvertisingBlock.created_at.desc())
    if area:
        query = query.where(AdvertisingBlock.area == area)
    blocks = (await session.exec(query)).all()

    result = []
    for b in blocks:
        # Count playlist items
        items_count = len((await session.exec(
            select(PlaylistItem).where(PlaylistItem.advertising_block_id == b.id)
        )).all())
        result.append({
            "id": str(b.id),
            "name": b.name,
            "description": b.description,
            "area": b.area,
            "display_mode": b.display_mode,
            "is_active": b.is_active,
            "version": b.version,
            "items_count": items_count,
            "valid_from": b.valid_from,
            "valid_to": b.valid_to,
            "created_at": b.created_at,
            "updated_at": b.updated_at
        })
    return result


@router.get("/{block_id}")
async def get_advertising_block(
    block_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    block = await session.get(AdvertisingBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Рекламный блок не найден")

    items_query = select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id).order_by(PlaylistItem.order_index)
    items = (await session.exec(items_query)).all()

    items_detail = []
    for it in items:
        asset = await session.get(MediaAsset, it.media_asset_id)
        items_detail.append({
            "id": str(it.id),
            "media_asset_id": str(it.media_asset_id),
            "order_index": it.order_index,
            "duration_seconds": it.duration_seconds,
            "media": {
                "id": str(asset.id),
                "original_name": asset.original_name,
                "stored_name": asset.stored_name,
                "media_type": asset.media_type,
                "width": asset.width,
                "height": asset.height,
                "s3_key": asset.s3_key,
                "version": asset.version
            } if asset else None
        })

    return {
        "id": str(block.id),
        "name": block.name,
        "description": block.description,
        "area": block.area,
        "display_mode": block.display_mode,
        "is_active": block.is_active,
        "version": block.version,
        "valid_from": block.valid_from,
        "valid_to": block.valid_to,
        "created_at": block.created_at,
        "updated_at": block.updated_at,
        "items": items_detail
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_advertising_block(
    req: AdvertisingBlockCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    media_map = {}
    for item in req.items:
        asset = await session.get(MediaAsset, item.media_asset_id)
        if not asset or asset.is_deleted:
            raise HTTPException(status_code=400, detail=f"Медиа-файл {item.media_asset_id} не найден.")
        media_map[str(asset.id)] = asset

    temp_block = AdvertisingBlock(
        name=req.name,
        description=req.description,
        area=req.area,
        display_mode=req.display_mode,
        is_active=req.is_active,
        version=1
    )
    temp_items = [
        PlaylistItem(
            advertising_block_id=temp_block.id,
            media_asset_id=it.media_asset_id,
            order_index=idx,
            duration_seconds=it.duration_seconds
        )
        for idx, it in enumerate(req.items)
    ]

    try:
        validate_advertising_block(temp_block, temp_items, media_map)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    block = AdvertisingBlock(
        name=req.name,
        description=req.description,
        area=req.area,
        display_mode=req.display_mode,
        is_active=req.is_active,
        version=1,
        valid_from=req.valid_from,
        valid_to=req.valid_to,
        created_by_user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    session.add(block)
    await session.flush()

    for idx, it in enumerate(req.items):
        pi = PlaylistItem(
            advertising_block_id=block.id,
            media_asset_id=it.media_asset_id,
            order_index=idx,
            duration_seconds=it.duration_seconds
        )
        session.add(pi)

    await session.commit()
    await record_audit_event(session, "AD_BLOCK_CREATED", "AdvertisingBlock", str(block.id), current_user.id, req.model_dump(mode="json"))

    return {"id": str(block.id), "version": block.version, "message": "Рекламный блок успешно создан"}


async def _handle_update_block(
    block_id: UUID,
    req: AdvertisingBlockUpdate,
    session: AsyncSession,
    current_user: User
) -> dict[str, Any]:
    block = await session.get(AdvertisingBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Рекламный блок не найден")

    # Optimistic Concurrency Control (OCC) Check
    if req.version is not None and block.version != req.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Конфликт версий: шаблон был изменён другим пользователем (текущая версия: {block.version}, получена: {req.version}). Обновите страницу."
        )

    # Apply metadata updates if provided
    if req.name is not None:
        block.name = req.name
    if req.description is not None:
        block.description = req.description
    if req.area is not None:
        block.area = req.area
    if req.display_mode is not None:
        block.display_mode = req.display_mode
    if req.is_active is not None:
        block.is_active = req.is_active
    if req.valid_from is not None:
        block.valid_from = req.valid_from
    if req.valid_to is not None:
        block.valid_to = req.valid_to

    # If items are updated, validate and rewrite playlist
    if req.items is not None:
        media_map = {}
        for item in req.items:
            asset = await session.get(MediaAsset, item.media_asset_id)
            if not asset or asset.is_deleted:
                raise HTTPException(status_code=400, detail=f"Медиа-файл {item.media_asset_id} не найден.")
            media_map[str(asset.id)] = asset

        temp_items = [
            PlaylistItem(
                advertising_block_id=block.id,
                media_asset_id=it.media_asset_id,
                order_index=idx,
                duration_seconds=it.duration_seconds
            )
            for idx, it in enumerate(req.items)
        ]

        try:
            validate_advertising_block(block, temp_items, media_map)
        except ValidationError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

        # Delete existing playlist items
        existing_items = (await session.exec(
            select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id)
        )).all()
        for ei in existing_items:
            await session.delete(ei)
        await session.flush()

        # Insert new ordered playlist items
        for idx, it in enumerate(req.items):
            pi = PlaylistItem(
                advertising_block_id=block.id,
                media_asset_id=it.media_asset_id,
                order_index=idx,
                duration_seconds=it.duration_seconds
            )
            session.add(pi)

    block.version += 1
    block.updated_at = datetime.now(timezone.utc)
    session.add(block)
    await session.commit()
    await session.refresh(block)

    await record_audit_event(
        session, "AD_BLOCK_UPDATED", "AdvertisingBlock", str(block.id), current_user.id,
        {"version": block.version, "name": block.name}
    )

    return {
        "id": str(block.id),
        "version": block.version,
        "message": "Рекламный блок успешно обновлен"
    }


@router.put("/{block_id}")
async def update_advertising_block_put(
    block_id: UUID,
    req: AdvertisingBlockUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    return await _handle_update_block(block_id, req, session, current_user)


@router.patch("/{block_id}")
async def update_advertising_block_patch(
    block_id: UUID,
    req: AdvertisingBlockUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    return await _handle_update_block(block_id, req, session, current_user)


@router.put("/{block_id}/items")
async def update_advertising_block_playlist(
    block_id: UUID,
    req: PlaylistUpdatePayload,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    """
    Dedicated endpoint to add, remove, and reorder playlist items transactionally.
    Guaranteed per-slide duration 1–60s, consecutive order 0..N-1, and OCC protection.
    """
    block = await session.get(AdvertisingBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Рекламный блок не найден")

    # OCC check
    if req.version is not None and block.version != req.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Конфликт версий: плейлист был изменён другим пользователем (текущая версия: {block.version}, получена: {req.version})."
        )

    media_map = {}
    for it in req.items:
        asset = await session.get(MediaAsset, it.media_asset_id)
        if not asset or asset.is_deleted:
            raise HTTPException(status_code=400, detail=f"Медиа-файл {it.media_asset_id} не найден.")
        media_map[str(asset.id)] = asset

    temp_items = [
        PlaylistItem(
            advertising_block_id=block.id,
            media_asset_id=it.media_asset_id,
            order_index=idx,
            duration_seconds=it.duration_seconds
        )
        for idx, it in enumerate(req.items)
    ]

    try:
        validate_advertising_block(block, temp_items, media_map)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # Transactional replace of playlist
    existing_items = (await session.exec(
        select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id)
    )).all()
    for ei in existing_items:
        await session.delete(ei)
    await session.flush()

    new_items = []
    for idx, it in enumerate(req.items):
        pi = PlaylistItem(
            advertising_block_id=block.id,
            media_asset_id=it.media_asset_id,
            order_index=idx,
            duration_seconds=it.duration_seconds
        )
        session.add(pi)
        new_items.append(pi)

    block.version += 1
    block.updated_at = datetime.now(timezone.utc)
    session.add(block)
    await session.commit()
    await session.refresh(block)

    await record_audit_event(
        session, "AD_BLOCK_PLAYLIST_UPDATED", "AdvertisingBlock", str(block.id), current_user.id,
        {"version": block.version, "items_count": len(new_items)}
    )

    return {
        "id": str(block.id),
        "version": block.version,
        "items_count": len(new_items),
        "message": "Плейлист успешно обновлен"
    }


@router.post("/{block_id}/duplicate", status_code=status.HTTP_201_CREATED)
async def duplicate_advertising_block(
    block_id: UUID,
    payload: Optional[DuplicateBlockPayload] = None,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    """Creates an exact independent clone of an advertising template in 1-click."""
    source = await session.get(AdvertisingBlock, block_id)
    if not source:
        raise HTTPException(status_code=404, detail="Исходный шаблон не найден")

    source_items = (await session.exec(
        select(PlaylistItem)
        .where(PlaylistItem.advertising_block_id == source.id)
        .order_by(PlaylistItem.order_index)
    )).all()

    target_name = (payload.name if payload and payload.name else f"{source.name} (копия)").strip()

    new_block = AdvertisingBlock(
        name=target_name,
        description=source.description,
        area=source.area,
        display_mode=source.display_mode,
        is_active=True,
        version=1,
        valid_from=source.valid_from,
        valid_to=source.valid_to,
        created_by_user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    session.add(new_block)
    await session.flush()

    for it in source_items:
        new_pi = PlaylistItem(
            advertising_block_id=new_block.id,
            media_asset_id=it.media_asset_id,
            order_index=it.order_index,
            duration_seconds=it.duration_seconds
        )
        session.add(new_pi)

    await session.commit()
    await session.refresh(new_block)

    await record_audit_event(
        session, "AD_BLOCK_DUPLICATED", "AdvertisingBlock", str(new_block.id), current_user.id,
        {"source_id": str(source.id), "new_name": new_block.name}
    )

    return {
        "id": str(new_block.id),
        "name": new_block.name,
        "version": new_block.version,
        "message": "Шаблон успешно скопирован"
    }


@router.delete("/{block_id}")
async def delete_advertising_block(
    block_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    block = await session.get(AdvertisingBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Рекламный блок не найден")

    # Disassociate publication batches and jobs (immutable snapshot preserves history)
    await session.exec(
        update(PublicationBatch).where(PublicationBatch.advertising_block_id == block.id).values(advertising_block_id=None)
    )
    await session.exec(
        update(PublicationJob).where(PublicationJob.advertising_block_id == block.id).values(advertising_block_id=None)
    )

    # Disassociate default/override assignments from cashier topology without touching physical cashier content
    await session.exec(
        update(Cashier).where(Cashier.current_full_screen_block_id == block.id).values(current_full_screen_block_id=None)
    )
    await session.exec(
        update(Cashier).where(Cashier.current_mode32_block_id == block.id).values(current_mode32_block_id=None)
    )
    await session.exec(
        update(Cashier).where(Cashier.override_full_screen_block_id == block.id).values(override_full_screen_block_id=None)
    )
    await session.exec(
        update(Cashier).where(Cashier.override_mode32_block_id == block.id).values(override_mode32_block_id=None)
    )
    await session.exec(
        update(Branch).where(Branch.override_full_screen_block_id == block.id).values(override_full_screen_block_id=None)
    )
    await session.exec(
        update(Branch).where(Branch.override_mode32_block_id == block.id).values(override_mode32_block_id=None)
    )
    await session.exec(
        update(Region).where(Region.default_full_screen_block_id == block.id).values(default_full_screen_block_id=None)
    )
    await session.exec(
        update(Region).where(Region.default_mode32_block_id == block.id).values(default_mode32_block_id=None)
    )

    # Delete block (cascade deletes playlist items)
    await session.delete(block)
    await session.commit()

    await record_audit_event(session, "AD_BLOCK_DELETED", "AdvertisingBlock", str(block.id), current_user.id, {"name": block.name})
    return {"message": "Рекламный блок успешно удален"}


@router.get("/{block_id}/preview")
async def preview_advertising_block(
    block_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    block = await session.get(AdvertisingBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Рекламный блок не найден")

    items_query = select(PlaylistItem).where(PlaylistItem.advertising_block_id == block.id).order_by(PlaylistItem.order_index)
    items = (await session.exec(items_query)).all()

    media_map = {}
    slides = []
    for it in items:
        asset = await session.get(MediaAsset, it.media_asset_id)
        if asset:
            media_map[str(asset.id)] = asset
            slides.append({
                "order_index": it.order_index,
                "duration_seconds": it.duration_seconds,
                "media_url": f"/api/v1/media/{asset.id}/file",
                "s3_key": asset.s3_key,
                "original_name": asset.original_name,
                "media_type": asset.media_type,
                "width": asset.width,
                "height": asset.height
            })

    built = build_guest_screen_scene(block, items, media_map)
    aspect_ratio = "4:3" if block.area == "FULL_SCREEN" else "2:3"
    resolution = "1024x768" if block.area == "FULL_SCREEN" else "512x768"

    return {
        "id": str(block.id),
        "name": block.name,
        "area": block.area,
        "display_mode": block.display_mode,
        "version": block.version,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
        "scene_guid": built.scene_guid,
        "target_area": built.target_area,
        "raw_json": json.loads(built.raw_json),
        "slides": slides,
        "media_filenames": built.media_filenames
    }
