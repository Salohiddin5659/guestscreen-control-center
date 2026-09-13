# -*- coding: utf-8 -*-
"""Unit tests for GuestScreen scene JSON serialization and deserialization (T038)."""
import json
import pytest

from src.adapters.scene_serializer import (
    build_gallery_scene,
    build_static_scene,
    extract_referenced_media,
    parse_scene,
)
from src.core.exceptions import ValidationDomainError
from src.models.media import AdMode


def test_build_static_scene_full():
    """Verify static scene JSON for FULL SCREEN mode (1024x768)."""
    raw = build_static_scene(AdMode.FULL, "summer_promo.jpg")
    data = json.loads(raw)
    assert data["type"] == "image"
    assert data["width"] == 1024
    assert data["height"] == 768
    assert data["src"] == "media/uploads/summer_promo.jpg"

    scene = parse_scene(raw)
    assert scene.width == 1024
    assert scene.src == "media/uploads/summer_promo.jpg"

    media_list = extract_referenced_media(raw)
    assert media_list == ["summer_promo.jpg"]


def test_build_static_scene_split():
    """Verify static scene JSON for 50/50 mode (512x768)."""
    raw = build_static_scene(AdMode.SPLIT, "combo_banner.png")
    data = json.loads(raw)
    assert data["type"] == "image"
    assert data["width"] == 512
    assert data["height"] == 768
    assert data["src"] == "media/uploads/combo_banner.png"


def test_build_gallery_scene():
    """Verify dynamic rotating gallery scene JSON generation."""
    filenames = ["slide1.jpg", "slide2.jpg", "slide3.png"]
    raw = build_gallery_scene(AdMode.FULL, filenames, interval_sec=7)
    data = json.loads(raw)
    assert data["type"] == "gallery"
    assert data["width"] == 1024
    assert data["height"] == 768
    assert data["interval"] == 7000
    assert len(data["items"]) == 3
    assert data["items"][0]["src"] == "media/uploads/slide1.jpg"

    scene = parse_scene(raw)
    assert scene.type == "gallery"
    assert scene.interval == 7000

    media_list = extract_referenced_media(raw)
    assert media_list == filenames


def test_invalid_scene_validation():
    """Verify rejection of invalid scene dimensions and empty gallery."""
    # Invalid dimensions
    with pytest.raises(ValidationDomainError):
        parse_scene('{"type": "image", "width": 800, "height": 600, "src": "banner.jpg"}')

    # Empty gallery
    with pytest.raises(ValidationDomainError):
        build_gallery_scene(AdMode.FULL, [])
