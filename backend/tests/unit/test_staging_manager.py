# -*- coding: utf-8 -*-
"""Unit tests for StagingManager path generation and atomic promotion (T040)."""
import uuid
import pytest

from src.adapters.staging_manager import StagingManager
from src.core.exceptions import SafetyBoundaryViolationError, UnauthorizedCommandError


def test_staging_paths_generation():
    """Verify clean Windows path generation for staging and production directories."""
    dep_id = str(uuid.uuid4())
    filename = "banner_1024x768.jpg"

    staging_dir = StagingManager.get_staging_dir(dep_id)
    assert f".staging\\{dep_id}" in staging_dir
    assert staging_dir.startswith(r"C:\UCS\GuestScreen\Front\media\uploads")

    staging_file = StagingManager.get_staging_file_path(dep_id, filename)
    assert staging_file.endswith(f".staging\\{dep_id}\\{filename}")

    prod_file = StagingManager.get_production_file_path(filename)
    assert prod_file == rf"C:\UCS\GuestScreen\Front\media\uploads\{filename}"


def test_staging_manager_injection_prevention():
    """Verify that malicious dep_id or filename raises error during path resolution."""
    with pytest.raises(UnauthorizedCommandError):
        StagingManager.get_staging_dir("bad_id; calc.exe")

    with pytest.raises(UnauthorizedCommandError):
        StagingManager.get_production_file_path("../../evil.exe")
