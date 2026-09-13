# -*- coding: utf-8 -*-
"""GuestScreen 3.1.1.0 advertising scene JSON serialization and deserialization codec (T038)."""
import json
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from src.core.exceptions import ValidationDomainError
from src.models.media import AdMode


class SceneItem(BaseModel):
    """Individual slide item in a dynamic scene gallery."""
    src: str = Field(description="Relative media path e.g. media/uploads/banner.jpg")


class GuestScreenScene(BaseModel):
    """Pydantic model representing UCS GuestScreen 3.1.1.0 scene Raw column JSON."""
    type: str = Field(default="image", description="'image' for static, 'gallery' for dynamic")
    width: int = Field(default=1024, description="1024 for FULL SCREEN, 512 for 50/50")
    height: int = Field(default=768, description="Standard height 768px")
    src: Optional[str] = Field(default=None, description="Image path for static mode")
    interval: Optional[int] = Field(default=None, description="Slide interval in milliseconds")
    items: Optional[List[SceneItem]] = Field(default=None, description="Slide items for dynamic gallery")
    slides: Optional[List[SceneItem]] = Field(default=None, description="Compatible slide items key")

    @field_validator("width")
    @classmethod
    def validate_scene_width(cls, v: int) -> int:
        if v not in (1024, 512):
            raise ValueError(f"Unsupported scene width {v}. Expected 1024 (FULL) or 512 (50/50).")
        return v

    @field_validator("height")
    @classmethod
    def validate_scene_height(cls, v: int) -> int:
        if v != 768:
            raise ValueError(f"Unsupported scene height {v}. Expected 768.")
        return v


def build_static_scene(ad_mode: AdMode | str, filename: str) -> str:
    """Build serialized JSON string for a single static advertising banner.

    Args:
        ad_mode: AdMode.FULL (1024x768) or AdMode.SPLIT (512x768).
        filename: Target image filename in uploads directory.

    Returns:
        Compact JSON string matching UCS GuestScreen specifications.
    """
    clean_mode = ad_mode.value if isinstance(ad_mode, AdMode) else str(ad_mode).upper()
    width = 1024 if "FULL" in clean_mode else 512
    clean_fn = filename.strip().replace("\\", "/").split("/")[-1]

    scene = GuestScreenScene(
        type="image",
        width=width,
        height=768,
        src=f"media/uploads/{clean_fn}",
    )
    return scene.model_dump_json(exclude_none=True)


def build_gallery_scene(
    ad_mode: AdMode | str,
    filenames: List[str],
    interval_sec: int = 5,
) -> str:
    """Build serialized JSON string for a dynamic rotating gallery playlist.

    Args:
        ad_mode: AdMode.FULL (1024x768) or AdMode.SPLIT (512x768).
        filenames: Ordered list of media filenames in uploads directory.
        interval_sec: Display duration per slide in seconds (default 5).

    Returns:
        Compact JSON string matching UCS GuestScreen specifications.
    """
    if not filenames:
        raise ValidationDomainError("Dynamic gallery scene requires at least one media item.")

    clean_mode = ad_mode.value if isinstance(ad_mode, AdMode) else str(ad_mode).upper()
    width = 1024 if "FULL" in clean_mode else 512
    interval_ms = int(interval_sec * 1000)

    items = [
        SceneItem(src=f"media/uploads/{fn.strip().replace('\\', '/').split('/')[-1]}")
        for fn in filenames
    ]

    scene = GuestScreenScene(
        type="gallery",
        width=width,
        height=768,
        interval=interval_ms,
        items=items,
        slides=items,
    )
    return scene.model_dump_json(exclude_none=True)


def parse_scene(raw_json: str) -> GuestScreenScene:
    """Parse, validate, and return GuestScreenScene from JSON string."""
    try:
        data = json.loads(raw_json.strip())
        return GuestScreenScene.model_validate(data)
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValidationDomainError(f"Failed to parse GuestScreen scene JSON: {exc}") from exc


def extract_referenced_media(raw_json: str) -> List[str]:
    """Extract list of media filenames referenced by scene JSON."""
    clean = raw_json.strip()
    if not clean:
        return []

    try:
        scene = parse_scene(clean)
    except ValidationDomainError:
        return []

    filenames: List[str] = []
    if scene.src:
        fn = scene.src.replace("\\", "/").split("/")[-1]
        if fn:
            filenames.append(fn)

    items = scene.items or scene.slides or []
    for item in items:
        fn = item.src.replace("\\", "/").split("/")[-1]
        if fn and fn not in filenames:
            filenames.append(fn)

    return filenames
