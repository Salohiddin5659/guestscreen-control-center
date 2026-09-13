# -*- coding: utf-8 -*-
"""Integration test suite for Cashbox Registry, Credentials, Status Drift, and Settings (T030)."""
import os
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.exceptions import (
    EntityConflictError,
    EntityNotFoundError,
    ValidationDomainError,
)
from src.core.security import MasterKey
from src.models.cashbox import CashboxStatus
from src.models.credential import SSHAuthType
from src.services.cashbox_service import CashboxService
from src.services.cashbox_status_service import CashboxStatusService
from src.services.credential_service import CredentialService
from src.services.setting_service import SystemSettingService


@pytest.mark.asyncio
async def test_location_crud(async_db_session: AsyncSession):
    """Test Location creation, uniqueness, retrieval, update, and deletion."""
    svc = CashboxService()

    loc = await svc.create_location(
        async_db_session,
        code="MSK_CENTRAL",
        name="Moscow Central Branch",
        description="Flagship restaurant",
    )
    assert loc.code == "MSK_CENTRAL"
    assert loc.name == "Moscow Central Branch"

    # Duplicate code rejection
    with pytest.raises(EntityConflictError):
        await svc.create_location(async_db_session, code="MSK_CENTRAL", name="Duplicate")

    # Retrieval
    fetched = await svc.get_location(async_db_session, loc.id)
    assert fetched.id == loc.id
    assert fetched.name == "Moscow Central Branch"

    # List
    locations = await svc.list_locations(async_db_session)
    assert len(locations) == 1
    assert locations[0].code == "MSK_CENTRAL"

    # Update
    updated = await svc.update_location(async_db_session, loc.id, name="Moscow Updated")
    assert updated.name == "Moscow Updated"

    # Delete
    deleted = await svc.delete_location(async_db_session, loc.id)
    assert deleted is True

    with pytest.raises(EntityNotFoundError):
        await svc.get_location(async_db_session, loc.id)


@pytest.mark.asyncio
async def test_cashbox_group_crud(async_db_session: AsyncSession):
    """Test CashboxGroup creation, uniqueness, retrieval, update, and deletion."""
    svc = CashboxService()

    group = await svc.create_group(
        async_db_session,
        code="DRIVE_THRU",
        name="Drive-Thru Terminals",
        description="High throughput lane",
    )
    assert group.code == "DRIVE_THRU"

    # Duplicate code rejection
    with pytest.raises(EntityConflictError):
        await svc.create_group(async_db_session, code="DRIVE_THRU", name="Duplicate Group")

    # List & Retrieve
    groups = await svc.list_groups(async_db_session)
    assert len(groups) == 1
    assert groups[0].code == "DRIVE_THRU"

    fetched = await svc.get_group(async_db_session, group.id)
    assert fetched.id == group.id

    # Update
    updated = await svc.update_group(async_db_session, group.id, name="Drive-Thru Lanes")
    assert updated.name == "Drive-Thru Lanes"

    # Delete
    await svc.delete_group(async_db_session, group.id)
    with pytest.raises(EntityNotFoundError):
        await svc.get_group(async_db_session, group.id)


@pytest.mark.asyncio
async def test_cashbox_crud_and_validation(async_db_session: AsyncSession):
    """Test Cashbox registration, IP collision guard, filtering, and deletion."""
    svc = CashboxService()

    loc = await svc.create_location(async_db_session, code="SPB_01", name="SPb Nevsky")
    grp = await svc.create_group(async_db_session, code="BAR_01", name="Bar Area")

    # 1. Successful creation
    cb1 = await svc.create_cashbox(
        async_db_session,
        name="Kassa Nevsky 1",
        ip_address="10.0.0.241",
        ssh_port=22,
        location_id=loc.id,
        group_id=grp.id,
    )
    assert cb1.name == "Kassa Nevsky 1"
    assert cb1.ip_address == "10.0.0.241"
    assert cb1.status == "ACTIVE"

    # 2. IP collision prevention
    with pytest.raises(EntityConflictError):
        await svc.create_cashbox(
            async_db_session,
            name="Kassa Collision",
            ip_address="10.0.0.241",
        )

    # 3. Invalid IP format
    with pytest.raises(ValidationDomainError):
        await svc.create_cashbox(
            async_db_session,
            name="Kassa Bad IP",
            ip_address="not.an.ip.address",
        )

    # 4. Invalid SSH port
    with pytest.raises(ValidationDomainError):
        await svc.create_cashbox(
            async_db_session,
            name="Kassa Bad Port",
            ip_address="10.0.0.242",
            ssh_port=70000,
        )

    # 5. Non-existent location ID
    with pytest.raises(EntityNotFoundError):
        await svc.create_cashbox(
            async_db_session,
            name="Kassa Ghost Loc",
            ip_address="10.0.0.243",
            location_id=uuid.uuid4(),
        )

    # 6. Second cashbox for filtering
    cb2 = await svc.create_cashbox(
        async_db_session,
        name="Kassa Nevsky 2",
        ip_address="10.0.0.242",
        location_id=loc.id,
    )

    # Filter by location
    loc_cashboxes = await svc.list_cashboxes(async_db_session, location_id=loc.id)
    assert len(loc_cashboxes) == 2

    # Filter by group
    grp_cashboxes = await svc.list_cashboxes(async_db_session, group_id=grp.id)
    assert len(grp_cashboxes) == 1
    assert grp_cashboxes[0].id == cb1.id

    # Filter by search string
    search_res = await svc.list_cashboxes(async_db_session, search="242")
    assert len(search_res) == 1
    assert search_res[0].id == cb2.id

    # Retrieval by IP
    by_ip = await svc.get_cashbox_by_ip(async_db_session, "10.0.0.241")
    assert by_ip.id == cb1.id

    # Update IP collision check
    with pytest.raises(EntityConflictError):
        await svc.update_cashbox(async_db_session, cb2.id, ip_address="10.0.0.241")

    # Update cashbox properties
    updated_cb = await svc.update_cashbox(async_db_session, cb1.id, name="Kassa Nevsky Main")
    assert updated_cb.name == "Kassa Nevsky Main"

    # Delete cashbox
    await svc.delete_cashbox(async_db_session, cb2.id)
    with pytest.raises(EntityNotFoundError):
        await svc.get_cashbox(async_db_session, cb2.id)


@pytest.mark.asyncio
async def test_credential_encryption_roundtrip(async_db_session: AsyncSession):
    """Test AES-256-GCM authenticated encryption and decryption of SSH credentials."""
    raw_key = b"0123456789abcdef0123456789abcdef"
    master_key = MasterKey(raw_key)

    cred_svc = CredentialService()
    plaintext_password = "SuperSecretPOSAdminPassword!2026"

    # Create password credential
    cred = await cred_svc.create_credential(
        async_db_session,
        name="Cashbox Admin Credential",
        username="ucs_admin",
        secret=plaintext_password,
        auth_type=SSHAuthType.PASSWORD,
        master_key=master_key,
    )

    assert cred.name == "Cashbox Admin Credential"
    assert cred.username == "ucs_admin"
    assert cred.auth_type == "PASSWORD"

    # Zero-leak assertion: ciphertext is raw bytes, not containing plaintext password
    assert plaintext_password.encode("utf-8") not in cred.ciphertext
    assert len(cred.nonce) == 12
    assert len(cred.tag) == 16

    # Decrypt and verify roundtrip
    decrypted = await cred_svc.get_decrypted_secret(
        async_db_session, cred.id, master_key=master_key
    )
    assert decrypted == plaintext_password

    # Test update secret
    new_password = "EvenMoreSecretPassword!999"
    await cred_svc.update_credential(
        async_db_session, cred.id, secret=new_password, master_key=master_key
    )
    decrypted_new = await cred_svc.get_decrypted_secret(
        async_db_session, cred.id, master_key=master_key
    )
    assert decrypted_new == new_password

    # Test SSH key fingerprint calculation
    sample_key = "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAA=\n-----END OPENSSH PRIVATE KEY-----"
    key_cred = await cred_svc.create_credential(
        async_db_session,
        name="SSH Key Credential",
        username="ucs_ssh_key",
        secret=sample_key,
        auth_type=SSHAuthType.KEY,
        master_key=master_key,
    )
    assert key_cred.key_fingerprint is not None
    assert key_cred.key_fingerprint.startswith("SHA256:")

    # Delete credential
    await cred_svc.delete_credential(async_db_session, cred.id)
    with pytest.raises(EntityNotFoundError):
        await cred_svc.get_credential(async_db_session, cred.id)


@pytest.mark.asyncio
async def test_cashbox_status_lifecycle_and_drift(async_db_session: AsyncSession):
    """Test status transitions, version synchronization, drift tracking, and fleet stats."""
    cb_svc = CashboxService()
    status_svc = CashboxStatusService()

    cb = await cb_svc.create_cashbox(
        async_db_session,
        name="Status Monoblock",
        ip_address="10.0.0.150",
    )

    # Initial state
    assert cb.status == CashboxStatus.ACTIVE.value
    assert cb.desired_version == 0
    assert cb.actual_version == 0

    # Transition status
    updated = await status_svc.update_status(async_db_session, cb.id, CashboxStatus.MAINTENANCE)
    assert updated.status == CashboxStatus.MAINTENANCE.value

    # Invalid status rejection
    with pytest.raises(ValidationDomainError):
        await status_svc.update_status(async_db_session, cb.id, "NON_EXISTENT_STATE")

    # Set desired version (e.g. operator published new ad campaign v2)
    await status_svc.update_desired_version(async_db_session, cb.id, version=2)
    assert cb.desired_version == 2
    assert cb.actual_version == 0

    # Cashbox is now out of sync (desired != actual and status is MAINTENANCE)
    out_of_sync = await status_svc.get_out_of_sync_cashboxes(async_db_session)
    assert len(out_of_sync) == 1
    assert out_of_sync[0].id == cb.id

    # Record successful deployment
    await status_svc.record_deployment_success(async_db_session, cb.id, actual_version=2)
    assert cb.actual_version == 2
    assert cb.last_deployment_at is not None

    # Still out of sync because status is MAINTENANCE
    out_of_sync = await status_svc.get_out_of_sync_cashboxes(async_db_session)
    assert len(out_of_sync) == 1

    # Transition back to ACTIVE -> now synchronized!
    await status_svc.update_status(async_db_session, cb.id, CashboxStatus.ACTIVE)
    out_of_sync_now = await status_svc.get_out_of_sync_cashboxes(async_db_session)
    assert len(out_of_sync_now) == 0

    # Record inventory scan timestamp
    await status_svc.record_inventory_scan(async_db_session, cb.id)
    assert cb.last_inventory_at is not None

    # Fleet statistics check
    stats = await status_svc.get_fleet_statistics(async_db_session)
    assert stats["total_cashboxes"] == 1
    assert stats["synchronized_count"] == 1
    assert stats["drifted_count"] == 0
    assert stats["sync_rate_percent"] == 100.0
    assert stats["status_counts"]["ACTIVE"] == 1


@pytest.mark.asyncio
async def test_system_setting_service_dynamic_fallback(async_db_session: AsyncSession):
    """Test dynamic runtime settings with PostgreSQL persistence and core config fallback."""
    setting_svc = SystemSettingService()

    # 1. Fallback to default in Settings (DEFAULT_CONCURRENCY_LIMIT is 4)
    concurrency = await setting_svc.get_setting(
        async_db_session, "DEFAULT_CONCURRENCY_LIMIT"
    )
    assert concurrency == 4

    # 2. Dynamic override in PostgreSQL
    await setting_svc.set_setting(
        async_db_session,
        key="DEFAULT_CONCURRENCY_LIMIT",
        value=12,
        description="Increased concurrency limit for large fleet rollout",
    )

    overridden = await setting_svc.get_setting(
        async_db_session, "DEFAULT_CONCURRENCY_LIMIT"
    )
    assert overridden == 12

    # 3. Listing settings contains both overridden and defaults
    all_settings = await setting_svc.list_settings(async_db_session)
    assert all_settings["DEFAULT_CONCURRENCY_LIMIT"] == 12
    assert "HOT_RELOAD_TIMEOUT_SEC" in all_settings

    # 4. Custom setting with full dictionary payload
    await setting_svc.set_setting(
        async_db_session,
        key="MAINTENANCE_SCHEDULE",
        value={"start_hour": 3, "end_hour": 5, "days": ["Mon", "Tue"]},
    )
    custom = await setting_svc.get_setting(async_db_session, "MAINTENANCE_SCHEDULE")
    assert isinstance(custom, dict)
    assert custom["start_hour"] == 3

    # 5. Delete custom setting reverts to fallback default
    await setting_svc.delete_setting(async_db_session, "DEFAULT_CONCURRENCY_LIMIT")
    reverted = await setting_svc.get_setting(
        async_db_session, "DEFAULT_CONCURRENCY_LIMIT"
    )
    assert reverted == 4
