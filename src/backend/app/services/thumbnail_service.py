import io
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger("gs_control_center.thumbnail")

THUMBNAIL_WIDTH = 256
THUMBNAIL_HEIGHT = 192


def generate_image_thumbnail(content: bytes, max_width: int = THUMBNAIL_WIDTH, max_height: int = THUMBNAIL_HEIGHT) -> bytes:
    """Generates a compressed WebP thumbnail keeping aspect ratio."""
    try:
        with Image.open(io.BytesIO(content)) as img:
            # Convert RGBA / P to RGB if needed
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                # Alpha composite onto white background
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                bg.paste(img, (0, 0), img.convert("RGBA"))
                img_to_resize = bg.convert("RGB")
            else:
                img_to_resize = img.convert("RGB")

            img_to_resize.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            img_to_resize.save(output, format="WEBP", quality=80)
            return output.getvalue()
    except Exception as e:
        logger.error(f"Failed to generate thumbnail: {e}")
        # Return empty bytes if generation fails
        return b""
