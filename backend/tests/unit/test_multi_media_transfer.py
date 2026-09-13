# -*- coding: utf-8 -*-
"""Unit tests for MultiMediaTransferEngine batch staging and verification (T054)."""
from unittest.mock import AsyncMock, MagicMock
import uuid
import pytest

from src.core.exceptions import StagingVerificationFailedError
from src.models.media import MediaAsset
from src.services.multi_media_transfer import MultiMediaTransferEngine


def _make_asset(filename: str, sha256: str) -> MediaAsset:
    return MediaAsset(
        id=uuid.uuid4(),
        filename=filename,
        storage_path=f"full/{filename}",
        sha256=sha256,
        file_size_bytes=1024,
        mime_type="image/jpeg",
        width=1024,
        height=768,
        aspect_ratio="4:3",
        ad_mode="FULL",
    )


@pytest.mark.asyncio
async def test_batch_staging_and_verification_success():
    """Verify that multiple media files are staged, verified, and promoted cleanly."""
    mock_cmd = MagicMock()
    mock_cmd.hash_verify = AsyncMock(side_effect=["hash1", "hash2", "hash3"])
    mock_cmd.staging_move = AsyncMock()

    mock_staging = MagicMock()
    mock_staging.get_staging_file_path = MagicMock(side_effect=lambda dep, fn: f"C:\\staging\\{dep}\\{fn}")
    mock_staging.promote_staging_file = AsyncMock()
    mock_staging.cleanup_staging = AsyncMock()

    mock_storage = MagicMock()
    mock_storage.get = AsyncMock(return_value=b"fake_image_bytes")

    engine = MultiMediaTransferEngine(
        command_adapter=mock_cmd,
        staging_manager=mock_staging,
        storage_provider=mock_storage,
    )

    # Mock SSH connection and SFTP client
    mock_sftp_client = AsyncMock()
    mock_sftp_client.upload_bytes = AsyncMock()

    mock_conn = MagicMock()
    # Mock SFTPStorageClient in engine
    assets = [
        _make_asset("slide1.jpg", "hash1"),
        _make_asset("slide2.jpg", "hash2"),
        _make_asset("slide3.jpg", "hash3"),
    ]

    from unittest.mock import patch
    with patch("src.services.multi_media_transfer.SFTPStorageClient") as mock_sftp_cls:
        mock_sftp_instance = AsyncMock()
        mock_sftp_cls.return_value = mock_sftp_instance

        promoted = await engine.stage_and_verify_media(
            conn=mock_conn,
            media_list=assets,
            deployment_id=str(uuid.uuid4()),
        )

        assert promoted == ["slide1.jpg", "slide2.jpg", "slide3.jpg"]
        assert mock_sftp_instance.upload_bytes.call_count == 3
        assert mock_cmd.hash_verify.call_count == 3
        assert mock_staging.promote_staging_file.call_count == 3


@pytest.mark.asyncio
async def test_batch_staging_sha_mismatch_aborts_and_cleans_up():
    """Verify that a SHA mismatch immediately stops the pipeline and cleans up staging."""
    mock_cmd = MagicMock()
    # Second file has wrong hash
    mock_cmd.hash_verify = AsyncMock(side_effect=["hash1", "corrupt_hash", "hash3"])

    mock_staging = MagicMock()
    mock_staging.get_staging_file_path = MagicMock(side_effect=lambda dep, fn: f"C:\\staging\\{dep}\\{fn}")
    mock_staging.promote_staging_file = AsyncMock()
    mock_staging.cleanup_staging = AsyncMock()

    mock_storage = MagicMock()
    mock_storage.get = AsyncMock(return_value=b"fake_image_bytes")

    engine = MultiMediaTransferEngine(
        command_adapter=mock_cmd,
        staging_manager=mock_staging,
        storage_provider=mock_storage,
    )

    mock_conn = MagicMock()
    assets = [
        _make_asset("slide1.jpg", "hash1"),
        _make_asset("slide2.jpg", "expected_hash2"),
    ]

    from unittest.mock import patch
    with patch("src.services.multi_media_transfer.SFTPStorageClient") as mock_sftp_cls:
        mock_sftp_instance = AsyncMock()
        mock_sftp_cls.return_value = mock_sftp_instance

        with pytest.raises(StagingVerificationFailedError, match="SHA-256 mismatch"):
            await engine.stage_and_verify_media(
                conn=mock_conn,
                media_list=assets,
                deployment_id=str(uuid.uuid4()),
            )

        # Ensure staging was cleaned up
        mock_staging.cleanup_staging.assert_called_once()
        # Ensure promote was NOT called
        mock_staging.promote_staging_file.assert_not_called()
