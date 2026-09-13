# -*- coding: utf-8 -*-
"""Integration tests for all SQLAlchemy 2.x domain models and metadata."""
import uuid
import pytest
from src.models import (
    Base,
    Location,
    CashboxGroup,
    Cashbox,
    CashboxStatus,
    SSHCredential,
    SSHAuthType,
    MediaAsset,
    AdMode,
    Playlist,
    PlaylistItem,
    AdConfiguration,
    ConfigurationAssignment,
    CashboxInventory,
    Deployment,
    DeploymentStep,
    DeploymentStatus,
    RollbackSnapshot,
    AuditLog,
    SystemSetting,
    User,
)


def test_metadata_contains_all_tables():
    """Verify that Base.metadata registers all required tables."""
    expected_tables = {
        "locations",
        "cashbox_groups",
        "ssh_credentials",
        "cashboxes",
        "media_assets",
        "playlists",
        "playlist_items",
        "ad_configurations",
        "configuration_assignments",
        "cashbox_inventory",
        "deployments",
        "deployment_steps",
        "rollback_snapshots",
        "audit_logs",
        "system_settings",
        "users",
    }
    actual_tables = set(Base.metadata.tables.keys())
    for t in expected_tables:
        assert t in actual_tables, f"Missing expected table in metadata: {t}"


def test_model_instantiation():
    """Verify in-memory model instantiation and property defaults."""
    loc = Location(code="MOSCOW", name="Moscow Region")
    assert loc.code == "MOSCOW"

    group = CashboxGroup(code="DRIVE_THRU", name="Drive-Thru Cashboxes")
    assert group.code == "DRIVE_THRU"

    cred = SSHCredential(
        name="kassa_admin",
        username="ucs_admin",
        auth_type=SSHAuthType.PASSWORD.value,
        ciphertext=b"encrypted_secret",
        nonce=b"123456789012",
        tag=b"1234567890123456",
    )
    assert cred.auth_type == "PASSWORD"

    cb = Cashbox(
        name="Kassa 1",
        ip_address="10.0.0.241",
        ssh_port=22,
        status=CashboxStatus.ACTIVE.value,
        desired_version=0,
        actual_version=0,
    )
    assert cb.ip_address == "10.0.0.241"
    assert cb.status == "ACTIVE"

    media = MediaAsset(
        filename="banner1.jpg",
        storage_path="/var/media/banner1.jpg",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        file_size_bytes=102400,
        mime_type="image/jpeg",
        width=1024,
        height=768,
        aspect_ratio="4:3",
        ad_mode=AdMode.FULL.value,
    )
    assert media.aspect_ratio == "4:3"

    dep = Deployment(
        cashbox_id=uuid.uuid4(),
        configuration_id=uuid.uuid4(),
        target_version=1,
        status=DeploymentStatus.PENDING.value,
        current_step=0,
    )
    assert dep.status == "PENDING"
    assert dep.current_step == 0
