# -*- coding: utf-8 -*-
"""Unit tests for media storage, validation, deduplication, and service layer."""
import os
import shutil
import tempfile
import pytest
from src.adapters.local_storage import LocalFileSystemStorageProvider
from src.core.exceptions import InvalidMediaFormatError, SafetyBoundaryViolationError
from src.services.media_service import MediaService
from src.services.media_validator import sanitize_filename, validate_image_binary


@pytest.fixture
def temp_storage_dir():
    """Create isolated temporary directory for media storage tests."""
    temp_dir = tempfile.mkdtemp(prefix="gs_media_test_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_filename_sanitization():
    """Verify filename sanitization removes dangerous characters and paths."""
    assert sanitize_filename("my promo banner.jpg") == "my_promo_banner.jpg"
    assert sanitize_filename("../../../etc/passwd.jpg") == "passwd.jpg"
    assert sanitize_filename("banner!@#$%^&*().png") == "banner__________.png"

    with pytest.raises(InvalidMediaFormatError):
        sanitize_filename("script.exe")

    with pytest.raises(InvalidMediaFormatError):
        sanitize_filename("vector.svg")


@pytest.mark.asyncio
async def test_local_storage_provider_crud_and_traversal_guard(temp_storage_dir):
    """Verify LocalFileSystemStorageProvider save, get, and path traversal protection."""
    provider = LocalFileSystemStorageProvider(root_dir=temp_storage_dir)

    payload = b"test_binary_data"
    saved_path = await provider.save(payload, "test_file.bin")
    assert os.path.exists(saved_path)

    read_back = await provider.get("test_file.bin")
    assert read_back == payload

    assert await provider.exists("test_file.bin") is True
    assert await provider.exists("non_existent.bin") is False

    # Path traversal attempt MUST raise SafetyBoundaryViolationError
    with pytest.raises(SafetyBoundaryViolationError):
        await provider.save(payload, "../../escaped_file.bin")

    with pytest.raises(SafetyBoundaryViolationError):
        await provider.get("../../escaped_file.bin")


def test_media_validator_dimensions(sample_jpeg_1024x768, sample_jpeg_512x768):
    """Verify dimensions and aspect ratio validation."""
    # 1024x768 valid for FULL mode
    res_full = validate_image_binary(sample_jpeg_1024x768, "banner.jpg", ad_mode="FULL")
    assert res_full.width == 1024
    assert res_full.height == 768
    assert res_full.aspect_ratio == "4:3"
    assert res_full.format == "JPEG"

    # 1024x768 INVALID for SPLIT mode (requires 512x768)
    with pytest.raises(InvalidMediaFormatError):
        validate_image_binary(sample_jpeg_1024x768, "banner.jpg", ad_mode="SPLIT")

    # 512x768 valid for SPLIT mode
    res_split = validate_image_binary(sample_jpeg_512x768, "promo.jpg", ad_mode="SPLIT")
    assert res_split.width == 512
    assert res_split.height == 768
    assert res_split.format == "JPEG"

    # Corrupt binary rejection
    with pytest.raises(InvalidMediaFormatError):
        validate_image_binary(b"\xff\xd8\xff_corrupted_payload_without_jpeg_data", "bad.jpg")


def test_sha256_computation(sample_jpeg_1024x768):
    """Verify deterministic SHA-256 calculation."""
    sha = MediaService.compute_sha256(sample_jpeg_1024x768)
    assert len(sha) == 64
    assert all(c in "0123456789abcdef" for c in sha)
    # Recomputing produces identical hash
    assert MediaService.compute_sha256(sample_jpeg_1024x768) == sha
