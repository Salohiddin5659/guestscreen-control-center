from typing import List, Optional
from app.models.content import AdvertisingBlock, PlaylistItem, MediaAsset


class ValidationError(Exception):
    pass


def validate_advertising_block(
    block: AdvertisingBlock,
    items: List[PlaylistItem],
    media_map: dict[str, MediaAsset]  # key: media_asset_id as str
) -> None:
    """Validates advertising block configuration and playlist rules according to spec."""
    valid_areas = ("FULL_SCREEN", "MODE32_PROMO")
    if block.area not in valid_areas:
        raise ValidationError(f"Недопустимая область (Area): {block.area}. Разрешено: {valid_areas}")

    valid_modes = ("STATIC", "SLIDESHOW", "VIDEO")
    if block.display_mode not in valid_modes:
        raise ValidationError(f"Недопустимый режим отображения: {block.display_mode}. Разрешено: {valid_modes}")

    if not items:
        raise ValidationError("Рекламный шаблон должен содержать как минимум один медиа-элемент.")

    # Rule: STATIC mode must contain exactly 1 image
    if block.display_mode == "STATIC":
        if len(items) != 1:
            raise ValidationError(f"Для режима STATIC разрешен ровно 1 медиа-элемент, передано: {len(items)}.")
        media = media_map.get(str(items[0].media_asset_id))
        if media and media.media_type != "IMAGE":
            raise ValidationError("Для режима STATIC выбранный файл должен быть изображением (JPG/PNG/WebP).")

    # Rule: VIDEO mode must contain exactly 1 video item
    elif block.display_mode == "VIDEO":
        if len(items) != 1:
            raise ValidationError(f"Для режима VIDEO разрешен ровно 1 медиа-элемент, передано: {len(items)}.")
        media = media_map.get(str(items[0].media_asset_id))
        if media and media.media_type != "VIDEO":
            raise ValidationError("Для режима VIDEO выбранный медиа-файл должен быть видео (MP4).")

    # Rule: SLIDESHOW mode must contain 2 to 20 image items
    elif block.display_mode == "SLIDESHOW":
        if len(items) < 2:
            raise ValidationError(f"Для режима SLIDESHOW требуется как минимум 2 слайда, передано: {len(items)}.")
        if len(items) > 20:
            raise ValidationError(f"Для режима SLIDESHOW допускается максимум 20 слайдов, передано: {len(items)}.")

        for idx, item in enumerate(items):
            if item.duration_seconds < 1 or item.duration_seconds > 60:
                raise ValidationError(
                    f"Длительность показа слайда #{idx + 1} должна быть от 1 до 60 секунд. Передано: {item.duration_seconds}с."
                )
            media = media_map.get(str(item.media_asset_id))
            if media and media.media_type != "IMAGE":
                raise ValidationError(
                    f"В режиме SLIDESHOW разрешены исключительно изображения. Слайд #{idx + 1} является видео (смешивание видео в слайд-шоу запрещено)."
                )

    # Order indexes must be consecutive from 0 to N-1
    sorted_indexes = sorted(item.order_index for item in items)
    expected_indexes = list(range(len(items)))
    if sorted_indexes != expected_indexes:
        raise ValidationError(f"Индексы порядка (order_index) должны быть последовательными от 0 до {len(items)-1}.")
