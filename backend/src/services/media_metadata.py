# -*- coding: utf-8 -*-
"""Image metadata extraction utilities."""
import io
from dataclasses import dataclass
from typing import Any, Dict, Optional
from PIL import Image


@dataclass(frozen=True)
class MediaMetadataDetails:
    """Detailed structural metadata of an image asset."""
    width: int
    height: int
    format: str
    mode: str
    file_size_bytes: int
    info: Dict[str, Any]


def extract_media_metadata(file_bytes: bytes) -> MediaMetadataDetails:
    """Extract metadata, color mode, and headers from raw image bytes."""
    with Image.open(io.BytesIO(file_bytes)) as img:
        return MediaMetadataDetails(
            width=img.width,
            height=img.height,
            format=str(img.format),
            mode=str(img.mode),
            file_size_bytes=len(file_bytes),
            info={k: str(v) for k, v in img.info.items() if isinstance(k, str)},
        )
