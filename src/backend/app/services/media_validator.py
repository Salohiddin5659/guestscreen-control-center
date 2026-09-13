import hashlib
import io
from typing import Tuple, Optional, List
from PIL import Image
import mimetypes


class MediaValidationResult:
    def __init__(
        self,
        sha256: str,
        media_type: str,
        mime_type: str,
        file_size: int,
        width: Optional[int],
        height: Optional[int],
        extension: str,
        warnings: List[str]
    ):
        self.sha256 = sha256
        self.media_type = media_type
        self.mime_type = mime_type
        self.file_size = file_size
        self.width = width
        self.height = height
        self.extension = extension
        self.warnings = warnings
        self.stored_name = f"{sha256}{extension}"


def validate_media_content(content: bytes, original_filename: str) -> MediaValidationResult:
    # 1. Compute SHA-256 hash
    hasher = hashlib.sha256()
    hasher.update(content)
    sha256 = hasher.hexdigest()
    file_size = len(content)

    # 2. Determine file extension
    ext = ""
    if "." in original_filename:
        ext = f".{original_filename.rsplit('.', 1)[-1].lower()}"

    # 3. Detect MIME type
    mime_type, _ = mimetypes.guess_type(original_filename)
    if not mime_type:
        mime_type = "application/octet-stream"

    warnings = []
    width = None
    height = None
    media_type = "IMAGE"

    # Check if video
    if ext in (".mp4", ".mov", ".avi", ".webm") or mime_type.startswith("video/"):
        media_type = "VIDEO"
        if not mime_type.startswith("video/"):
            mime_type = "video/mp4"
    else:
        # Inspect image dimensions via Pillow
        try:
            with Image.open(io.BytesIO(content)) as img:
                width, height = img.size
                format_mime = Image.MIME.get(img.format)
                if format_mime:
                    mime_type = format_mime

                # Check against standard UCS Guest Screen dimensions
                # Full screen mode: 1024x768
                # Mode 32 promo mode: 512x768
                is_fullscreen = (width == 1024 and height == 768)
                is_mode32 = (width == 512 and height == 768)
                if not (is_fullscreen or is_mode32):
                    warnings.append(
                        f"Изображение имеет нестандартное разрешение {width}x{height}. "
                        f"Рекомендуется 1024x768 (Full Screen) или 512x768 (Mode 32 Promo)."
                    )
        except Exception as e:
            raise ValueError(f"Не удалось распознать формат изображения: {e}")

    return MediaValidationResult(
        sha256=sha256,
        media_type=media_type,
        mime_type=mime_type,
        file_size=file_size,
        width=width,
        height=height,
        extension=ext,
        warnings=warnings
    )
