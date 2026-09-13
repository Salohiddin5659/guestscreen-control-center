import json
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset

# Physical UCS Guest Screen Scene GUIDs mapped strictly by display Area
GUID_FULLSCREEN_SCENE = "2509359c-2d71-4344-9be4-7d90dd453083"
GUID_MODE32_PROMO_SCENE = "68906ed2-49a3-4dc3-bb8a-6fa7943f39c3"

# Backward compatibility aliases
GUID_FULLSCREEN = GUID_FULLSCREEN_SCENE
GUID_MODE32_PROMO = GUID_MODE32_PROMO_SCENE

GUID_FULLSCREEN_STATIC = GUID_FULLSCREEN_SCENE
GUID_FULLSCREEN_GALLERY = GUID_FULLSCREEN_SCENE
GUID_FULLSCREEN_VIDEO = GUID_FULLSCREEN_SCENE

GUID_MODE32_STATIC = GUID_MODE32_PROMO_SCENE
GUID_MODE32_GALLERY = GUID_MODE32_PROMO_SCENE
GUID_MODE32_VIDEO = GUID_MODE32_PROMO_SCENE


@dataclass
class BuiltScene:
    scene_guid: str
    target_area: str
    display_mode: str
    raw_json: str
    media_filenames: List[str]


def build_guest_screen_scene(
    block: AdvertisingBlock,
    items: List[PlaylistItem],
    media_map: Dict[str, MediaAsset],
    existing_scene_raw: str = None
) -> BuiltScene:
    """
    Constructs the exact JSON string to be stored in SQLite scenes.Raw
    for a given AdvertisingBlock and its ordered PlaylistItems.
    If existing_scene_raw is provided (as a JSON string), it preserves original extra fields.
    Scene GUID is resolved strictly by Area:
      - FULL_SCREEN -> GUID_FULLSCREEN_SCENE (2509359c-2d71-4344-9be4-7d90dd453083)
      - MODE32_PROMO -> GUID_MODE32_PROMO_SCENE (68906ed2-49a3-4dc3-bb8a-6fa7943f39c3)
    Display mode (STATIC / SLIDESHOW / VIDEO) determines only the JSON scene type and parameters.
    """
    area = block.area
    mode = block.display_mode

    # Resolve scene GUID strictly by Area
    if area == "FULL_SCREEN":
        scene_guid = GUID_FULLSCREEN_SCENE
    elif area == "MODE32_PROMO":
        scene_guid = GUID_MODE32_PROMO_SCENE
    else:
        raise ValueError(f"Unknown area: {area}")

    if mode not in ("STATIC", "SLIDESHOW", "VIDEO"):
        raise ValueError(f"Unsupported display mode {mode} for {area}")

    # Gather ordered media assets
    ordered_items = sorted(items, key=lambda x: x.order_index)
    filenames: List[str] = []
    
    # Try to parse existing scene template if present
    base_data: Dict[str, Any] = {}
    if existing_scene_raw:
        try:
            base_data = json.loads(existing_scene_raw)
        except Exception:
            base_data = {}

    if mode == "STATIC":
        item = ordered_items[0]
        media = media_map.get(str(item.media_asset_id))
        stored_name = media.stored_name if media else f"item_{item.id}.jpg"
        filenames.append(stored_name)

        w_int = 1024 if area == "FULL_SCREEN" else 512
        w_str = str(w_int)

        params = {
            "width": w_str,
            "height": "768",
            "align": "center",
            "full": False,
            "fileName": stored_name
        }

        # Target payload for image-scene
        payload = {
            "guid": scene_guid,
            "name": base_data.get("name", "Рекламный блок" if area == "FULL_SCREEN" else "Галерея"),
            "type": "image",
            "src": f"media/uploads/{stored_name}",
            "fit": "cover",
            "width": w_int,
            "height": 768,
            "params": params
        }

    elif mode == "SLIDESHOW":
        slides = []
        interval = ordered_items[0].duration_seconds if ordered_items else 7

        for item in ordered_items:
            media = media_map.get(str(item.media_asset_id))
            stored_name = media.stored_name if media else f"item_{item.id}.jpg"
            filenames.append(stored_name)
            slides.append({
                "src": f"media/uploads/{stored_name}",
                "duration": item.duration_seconds
            })

        w_int = 1024 if area == "FULL_SCREEN" else 512
        frames = [{"type": "image", "name": s["src"].split("/")[-1]} for s in slides]
        payload = {
            "guid": scene_guid,
            "name": base_data.get("name", "Рекламный блок" if area == "FULL_SCREEN" else "Галерея"),
            "type": "gallery",
            "interval": interval,
            "slides": slides,
            "fit": "cover",
            "width": w_int,
            "height": 768,
            "mappedScenes": base_data.get("mappedScenes", []),
            "params": {
                "frame": frames,
                "interval": str(interval)
            }
        }

    elif mode == "VIDEO":
        item = ordered_items[0]
        media = media_map.get(str(item.media_asset_id))
        stored_name = media.stored_name if media else f"item_{item.id}.mp4"
        filenames.append(stored_name)

        payload = {
            **base_data,
            "type": "video",
            "src": f"media/uploads/{stored_name}",
            "autoplay": True,
            "loop": True,
            "muted": True
        }
        if area == "FULL_SCREEN":
            payload["width"] = 1024
            payload["height"] = 768
        else:
            payload["width"] = 512
            payload["height"] = 768

    raw_json = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))

    return BuiltScene(
        scene_guid=scene_guid,
        target_area=area,
        display_mode=mode,
        raw_json=raw_json,
        media_filenames=filenames
    )
