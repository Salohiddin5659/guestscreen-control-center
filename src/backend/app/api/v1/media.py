import io
import os
import asyncio
import logging
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, Response
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User
from app.models.content import MediaAsset, AdvertisingBlock, PlaylistItem
from app.services.storage_service import storage_service
from app.services.media_validator import validate_media_content
from app.services.thumbnail_service import generate_image_thumbnail
from app.services.audit_service import record_audit_event
from app.services.media_gc import delete_s3_object_if_unreferenced

router = APIRouter(prefix="/media", tags=["Media Assets"])


class MediaUpdatePayload(BaseModel):
    original_name: Optional[str] = None
    version: Optional[int] = None


class TemplateUsageItem(BaseModel):
    id: UUID
    name: str
    area: str
    display_mode: str
    is_active: bool


class MediaUsageResponse(BaseModel):
    asset_id: UUID
    usage_count: int
    templates: List[TemplateUsageItem]


@router.get("", response_model=List[MediaAsset])
async def list_media_assets(
    media_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(MediaAsset).where(MediaAsset.is_deleted == False)
    if media_type:
        query = query.where(MediaAsset.media_type == media_type.upper())
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            col(MediaAsset.original_name).ilike(search_pattern) |
            col(MediaAsset.stored_name).ilike(search_pattern)
        )
    query = query.order_by(MediaAsset.created_at.desc()).offset(skip).limit(limit)
    return (await session.exec(query)).all()


@router.get("/{asset_id}", response_model=MediaAsset)
async def get_media_asset(
    asset_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")
    return asset


logger = logging.getLogger("gs_control_center.media")


def resolve_media_file_path(asset: MediaAsset) -> Optional[str]:
    """Finds physical file on disk across known persistent storage paths."""
    candidates = [
        f"/app/data/storage/media/media/{asset.stored_name}",
        f"/app/data/storage/media/{asset.s3_key}",
        f"/app/data/storage/{asset.s3_key}",
        f"/app/data/storage/media/{asset.stored_name}",
        f"/app/data/media/{asset.stored_name}",
        f"/app/data/media/{asset.original_name}",
        f"/app/data/media/{os.path.basename(asset.s3_key)}",
        f"/app/data/storage/{os.path.basename(asset.s3_key)}",
        f"/app/data/{asset.s3_key}",
        f"/app/data/media/{asset.id}",
    ]
    for p in candidates:
        if os.path.isfile(p) and os.path.getsize(p) > 0:
            return p
    return None


@router.get("/{asset_id}/file")
async def get_media_asset_file(
    asset_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # 1. Immediate local disk resolution (0.03 ms - fastest path)
    file_path = resolve_media_file_path(asset)
    if file_path:
        return FileResponse(
            path=file_path,
            media_type=asset.mime_type or "application/octet-stream",
            filename=asset.original_name,
            headers={
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Accept-Ranges": "bytes",
            }
        )

    # 2. If missing on disk, fallback to MinIO with a strict short timeout
    content = None
    try:
        content = await asyncio.wait_for(
            storage_service.download_file_bytes(asset.s3_key),
            timeout=1.0
        )
    except Exception:
        pass

    if content:
        # Cache locally for subsequent fast hits
        cache_path = f"/app/data/storage/{asset.s3_key}"
        try:
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            with open(cache_path, "wb") as f:
                f.write(content)
        except Exception:
            pass
        return Response(
            content=content,
            media_type=asset.mime_type or "application/octet-stream",
            headers={
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Accept-Ranges": "bytes",
            }
        )

    raise HTTPException(status_code=404, detail="Файл в хранилище не найден")


@router.get("/{asset_id}/thumbnail")
async def get_media_asset_thumbnail(
    asset_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # 1. Check if WebP thumbnail is already cached on disk
    thumb_path = f"/app/data/storage/thumbnails/{asset.sha256}.webp"
    if os.path.isfile(thumb_path) and os.path.getsize(thumb_path) > 0:
        return FileResponse(
            path=thumb_path,
            media_type="image/webp",
            headers={
                "Cache-Control": "public, max-age=604800, immutable",
                "Accept-Ranges": "bytes",
            }
        )

    # 2. If not cached, resolve full file from disk
    file_path = resolve_media_file_path(asset)
    if not file_path:
        raise HTTPException(status_code=404, detail="Файл в хранилище не найден")

    # 3. If IMAGE, generate WebP thumbnail on the fly and save to disk
    if str(asset.media_type).upper() == "IMAGE":
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            thumb_bytes = generate_image_thumbnail(raw_bytes, max_width=320, max_height=240)
            if thumb_bytes:
                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
                with open(thumb_path, "wb") as tf:
                    tf.write(thumb_bytes)
                return FileResponse(
                    path=thumb_path,
                    media_type="image/webp",
                    headers={
                        "Cache-Control": "public, max-age=604800, immutable",
                        "Accept-Ranges": "bytes",
                    }
                )
        except Exception as e:
            logger.warning(f"Could not generate thumbnail for {asset_id}: {e}")

    # 4. Fallback to serving original file with standard caching
    return FileResponse(
        path=file_path,
        media_type=asset.mime_type or "application/octet-stream",
        filename=asset.original_name,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Accept-Ranges": "bytes",
        }
    )


async def _process_upload(
    file: UploadFile,
    session: AsyncSession,
    current_user: User
) -> dict[str, Any]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Файл пуст")

    try:
        val_result = validate_media_content(content, file.filename or "media.jpg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Check if a MediaAsset with the same SHA-256 already exists and is active
    existing = (await session.exec(
        select(MediaAsset).where(
            MediaAsset.sha256 == val_result.sha256,
            MediaAsset.is_deleted == False
        )
    )).first()

    if existing:
        return {
            "asset": existing,
            "warnings": ["Файл с идентичным содержимым (SHA-256) уже загружен в библиотеку."],
            "is_duplicate": True
        }

    # S3 content-addressed path
    s3_key = f"media/{val_result.stored_name}"

    # 1. Save to local persistent storage paths on disk (/app/data/media and /app/data/storage)
    local_paths = [
        f"/app/data/media/{val_result.stored_name}",
        f"/app/data/storage/{s3_key}",
    ]
    for lp in local_paths:
        try:
            os.makedirs(os.path.dirname(lp), exist_ok=True)
            if not os.path.exists(lp):
                with open(lp, "wb") as f:
                    f.write(content)
        except Exception as e:
            pass

    # 2. Generate and save thumbnail locally if image
    if val_result.media_type == "IMAGE":
        thumb_bytes = generate_image_thumbnail(content)
        if thumb_bytes:
            thumb_path = f"/app/data/storage/thumbnails/{val_result.sha256}.webp"
            try:
                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
                if not os.path.exists(thumb_path):
                    with open(thumb_path, "wb") as f:
                        f.write(thumb_bytes)
            except Exception:
                pass

    # 3. MinIO synchronization (graceful and non-blocking: does not block if MinIO is not deployed)
    try:
        async def _sync_to_s3():
            if not await storage_service.object_exists(s3_key):
                await storage_service.upload_file(
                    file_obj=io.BytesIO(content),
                    key=s3_key,
                    content_type=val_result.mime_type
                )
            if val_result.media_type == "IMAGE" and thumb_bytes:
                thumb_key = f"thumbnails/{val_result.sha256}.webp"
                if not await storage_service.object_exists(thumb_key):
                    await storage_service.upload_file(
                        file_obj=io.BytesIO(thumb_bytes),
                        key=thumb_key,
                        content_type="image/webp"
                    )
        await asyncio.wait_for(_sync_to_s3(), timeout=0.5)
    except Exception:
        pass

    asset = MediaAsset(
        original_name=file.filename or val_result.stored_name,
        stored_name=val_result.stored_name,
        sha256=val_result.sha256,
        mime_type=val_result.mime_type,
        media_type=val_result.media_type,
        file_size_bytes=val_result.file_size,
        width=val_result.width,
        height=val_result.height,
        s3_bucket="media",
        s3_key=s3_key,
        uploaded_by_user_id=current_user.id,
        version=1,
        created_at=datetime.now(timezone.utc)
    )
    session.add(asset)
    await session.commit()
    await session.refresh(asset)

    await record_audit_event(
        session, "MEDIA_UPLOADED", "MediaAsset", str(asset.id), current_user.id,
        {"filename": file.filename, "sha256": val_result.sha256, "size": val_result.file_size}
    )

    return {
        "asset": asset,
        "warnings": val_result.warnings,
        "is_duplicate": False
    }


# Canonical endpoint
@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_media_canonical(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    return await _process_upload(file, session, current_user)


# Backwards-compatible alias
@router.post("/upload")
async def upload_media_alias(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    return await _process_upload(file, session, current_user)


@router.post("/upload-multiple")
async def upload_multiple_media(
    files: List[UploadFile] = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    items = []
    all_warnings = []
    for f in files:
        try:
            res = await _process_upload(f, session, current_user)
            asset = res["asset"]
            items.append({
                "id": str(asset.id),
                "original_name": asset.original_name,
                "stored_name": asset.stored_name,
                "size_bytes": asset.file_size_bytes,
                "file_size_bytes": asset.file_size_bytes,
                "sha256": asset.sha256,
                "width": asset.width,
                "height": asset.height,
                "mime_type": asset.mime_type,
                "is_duplicate": res.get("is_duplicate", False),
            })
            if res.get("warnings"):
                all_warnings.extend(res["warnings"])
        except Exception as e:
            all_warnings.append(f"{f.filename}: {str(e)}")

    return {
        "uploaded_count": len(items),
        "items": items,
        "warnings": all_warnings
    }


@router.patch("/{asset_id}", response_model=MediaAsset)
async def update_media_asset(
    asset_id: UUID,
    payload: MediaUpdatePayload,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # Optimistic Concurrency Control (OCC) check
    if payload.version is not None and asset.version != payload.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Конфликт версий: файл был изменён другим пользователем (текущая версия: {asset.version}, получена: {payload.version}). Обновите данные."
        )

    if payload.original_name is not None and payload.original_name.strip():
        asset.original_name = payload.original_name.strip()

    asset.version += 1
    session.add(asset)
    await session.commit()
    await session.refresh(asset)

    await record_audit_event(
        session, "MEDIA_RENAMED", "MediaAsset", str(asset.id), current_user.id,
        {"new_name": asset.original_name, "version": asset.version}
    )
    return asset


@router.post("/{asset_id}/replace")
async def replace_media_asset_content(
    asset_id: UUID,
    file: UploadFile = File(...),
    version: Optional[int] = Form(None),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # OCC check
    if version is not None and asset.version != version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Конфликт версий: файл был изменён другим пользователем (текущая версия: {asset.version}, получена: {version})."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Новый файл пуст")

    try:
        val_result = validate_media_content(content, file.filename or asset.original_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    old_s3_key = asset.s3_key
    old_sha256 = asset.sha256
    new_s3_key = f"media/{val_result.stored_name}"

    # 1. Save to local persistent storage paths on disk (/app/data/media and /app/data/storage)
    for lp in [f"/app/data/media/{val_result.stored_name}", f"/app/data/storage/{new_s3_key}"]:
        try:
            os.makedirs(os.path.dirname(lp), exist_ok=True)
            with open(lp, "wb") as f:
                f.write(content)
        except Exception:
            pass

    # 2. Generate and save thumbnail locally if IMAGE
    thumb_bytes = None
    if val_result.media_type == "IMAGE":
        thumb_bytes = generate_image_thumbnail(content)
        if thumb_bytes:
            thumb_path = f"/app/data/storage/thumbnails/{val_result.sha256}.webp"
            try:
                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
                with open(thumb_path, "wb") as tf:
                    tf.write(thumb_bytes)
            except Exception:
                pass

    # 3. MinIO sync (graceful fallback)
    try:
        if not await storage_service.object_exists(new_s3_key):
            await storage_service.upload_file(
                file_obj=io.BytesIO(content),
                key=new_s3_key,
                content_type=val_result.mime_type
            )
        if val_result.media_type == "IMAGE" and thumb_bytes:
            thumb_key = f"thumbnails/{val_result.sha256}.webp"
            if not await storage_service.object_exists(thumb_key):
                await storage_service.upload_file(
                    file_obj=io.BytesIO(thumb_bytes),
                    key=thumb_key,
                    content_type="image/webp"
                )
    except Exception:
        pass

    # Update metadata and bump version
    asset.original_name = file.filename or asset.original_name
    asset.stored_name = val_result.stored_name
    asset.sha256 = val_result.sha256
    asset.mime_type = val_result.mime_type
    asset.media_type = val_result.media_type
    asset.file_size_bytes = val_result.file_size
    asset.width = val_result.width
    asset.height = val_result.height
    asset.s3_key = new_s3_key
    asset.version += 1

    session.add(asset)
    await session.commit()
    await session.refresh(asset)

    # Conditionally delete old physical object if no other active asset points to it
    if old_s3_key != new_s3_key:
        await delete_s3_object_if_unreferenced(session, old_s3_key, sha256=old_sha256, exclude_asset_id=asset.id)

    await record_audit_event(
        session, "MEDIA_REPLACED", "MediaAsset", str(asset.id), current_user.id,
        {"filename": asset.original_name, "new_sha256": asset.sha256, "version": asset.version}
    )

    return {
        "asset": asset,
        "warnings": val_result.warnings,
        "message": "Медиа-файл успешно заменен"
    }


@router.get("/{asset_id}/usage", response_model=MediaUsageResponse)
async def get_media_asset_usage(
    asset_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # Find distinct advertising blocks referencing this asset
    query = (
        select(AdvertisingBlock)
        .join(PlaylistItem, PlaylistItem.advertising_block_id == AdvertisingBlock.id)
        .where(PlaylistItem.media_asset_id == asset_id)
        .distinct()
    )
    blocks = (await session.exec(query)).all()

    templates = [
        TemplateUsageItem(
            id=b.id,
            name=b.name,
            area=b.area,
            display_mode=b.display_mode,
            is_active=b.is_active
        )
        for b in blocks
    ]

    return MediaUsageResponse(
        asset_id=asset_id,
        usage_count=len(templates),
        templates=templates
    )


@router.delete("/{asset_id}")
async def delete_media_asset(
    asset_id: UUID,
    force: bool = Query(default=False),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    asset = await session.get(MediaAsset, asset_id)
    if not asset or asset.is_deleted:
        raise HTTPException(status_code=404, detail="Медиа-файл не найден")

    # Check playlist references
    item_query = select(PlaylistItem).where(PlaylistItem.media_asset_id == asset_id)
    referencing_items = (await session.exec(item_query)).all()
    if referencing_items:
        if not force:
            query = (
                select(AdvertisingBlock)
                .join(PlaylistItem, PlaylistItem.advertising_block_id == AdvertisingBlock.id)
                .where(PlaylistItem.media_asset_id == asset_id)
                .distinct()
            )
            referencing_templates = (await session.exec(query)).all()
            template_names = ", ".join([f"«{t.name}»" for t in referencing_templates[:3]])
            more = f" и еще {len(referencing_templates) - 3}" if len(referencing_templates) > 3 else ""
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Медиа-файл используется в {len(referencing_templates)} рекламных шаблонах ({template_names}{more}). Чтобы удалить его, подтвердите принудительное удаление."
            )
        else:
            # Force unlinking: remove from playlist items
            for item in referencing_items:
                await session.delete(item)
            await session.commit()

    asset.is_deleted = True
    session.add(asset)
    await session.commit()

    # Trigger transactional S3 reference count check
    physical_deleted = await delete_s3_object_if_unreferenced(
        session, asset.s3_key, sha256=asset.sha256, exclude_asset_id=asset.id
    )

    await record_audit_event(
        session, "MEDIA_DELETED", "MediaAsset", str(asset.id), current_user.id,
        {"filename": asset.original_name, "physical_deleted": physical_deleted}
    )
    return {
        "message": "Медиа-файл успешно удален",
        "physical_deleted": physical_deleted
    }
