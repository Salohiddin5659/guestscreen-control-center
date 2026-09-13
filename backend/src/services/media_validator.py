# -*- coding: utf-8 -*-
"""Image format, magic bytes, dimensions, and filename validation service."""
import io
import re
from dataclasses import dataclass
from typing import Tuple
from PIL import Image, UnidentifiedImageError

from src.core.exceptions import InvalidMediaFormatError
from src.models.media import AdMode

JPEG_MAGIC = b"\xff\xd8\xff"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]+$")


@dataclass(frozen=True)
class ValidatedMedia:
    """Metadata of an authentic, validated image asset."""
    width: int
    height: int
    format: str
    mime_type: str
    aspect_ratio: str
    sanitized_filename: str


def sanitize_filename(filename: str) -> str:
    """Sanitize filename, stripping path components and dangerous characters."""
    clean = filename.replace("\\", "/").split("/")[-1]
    name, ext = clean.rsplit(".", 1) if "." in clean else (clean, "")
    ext = ext.lower()

    if ext not in ("jpg", "jpeg", "png"):
        raise InvalidMediaFormatError(
            f"Unsupported file extension '{ext}'. Only .jpg, .jpeg, and .png are allowed."
        )

    # Normalize jpeg to jpg
    if ext == "jpeg":
        ext = "jpg"

    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name)
    return f"{safe_name}.{ext}"


def validate_image_binary(file_bytes: bytes, filename: str, ad_mode: str = "FULL") -> ValidatedMedia:
    """Validate image magic bytes, header integrity, dimensions, and aspect ratio.

    Args:
        file_bytes: Raw binary content of uploaded image.
        filename: Original filename.
        ad_mode: Expected mode ('FULL' or 'SPLIT').

    Returns:
        ValidatedMedia dataclass with dimensions and format.

    Raises:
        InvalidMediaFormatError: If file is invalid, corrupt, or has incompatible dimensions.
    """
    if len(file_bytes) < 32:
        raise InvalidMediaFormatError("File too small to be a valid image.")

    if len(file_bytes) > 50 * 1024 * 1024:  # 50 MB limit
        raise InvalidMediaFormatError("File size exceeds 50 MB limit.")

    # 1. Magic Bytes Check
    if file_bytes.startswith(JPEG_MAGIC):
        expected_format = "JPEG"
        mime_type = "image/jpeg"
    elif file_bytes.startswith(PNG_MAGIC):
        expected_format = "PNG"
        mime_type = "image/png"
    else:
        raise InvalidMediaFormatError(
            "File header mismatch: binary does not start with valid JPEG or PNG magic bytes."
        )

    # 2. Pillow Header Inspection
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()  # Verify structural integrity
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise InvalidMediaFormatError(f"Image binary is corrupted or malformed: {exc}") from exc

    # Re-open for dimension inspection after verify() closes/invalidates the stream
    with Image.open(io.BytesIO(file_bytes)) as img:
        width, height = img.size
        actual_format = img.format

    if actual_format != expected_format:
        raise InvalidMediaFormatError(
            f"Image format mismatch: header states {expected_format} but decoded as {actual_format}."
        )

    # 3. Dimension and Aspect Ratio Verification
    clean_mode = ad_mode.upper()
    if clean_mode in ("FULL", AdMode.FULL.value):
        # FULL SCREEN mode requires 1024x768 (4:3)
        aspect_ratio = "4:3"
        if (width, height) != (1024, 768):
            # Allow exact 4:3 ratios but recommend 1024x768
            gcd_val = _gcd(width, height)
            simplified = f"{width // gcd_val}:{height // gcd_val}"
            if simplified != "4:3":
                raise InvalidMediaFormatError(
                    f"FULL SCREEN mode requires 1024x768 resolution (4:3 aspect ratio), got {width}x{height}."
                )
    elif clean_mode in ("SPLIT", AdMode.SPLIT.value):
        # 50/50 promo mode requires strictly 512x768
        aspect_ratio = "2:3"
        if (width, height) != (512, 768):
            raise InvalidMediaFormatError(
                f"50/50 promo mode requires strictly 512x768 resolution, got {width}x{height}."
            )
    else:
        aspect_ratio = f"{width}:{height}"

    sanitized = sanitize_filename(filename)

    return ValidatedMedia(
        width=width,
        height=height,
        format=actual_format,
        mime_type=mime_type,
        aspect_ratio=aspect_ratio,
        sanitized_filename=sanitized,
    )


def _gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a
