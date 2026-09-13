# -*- coding: utf-8 -*-
"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-10 21:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. PostgreSQL Extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    # 2. Locations
    op.create_table(
        "locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_locations_code", "locations", ["code"])

    # 3. Cashbox Groups
    op.create_table(
        "cashbox_groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cashbox_groups_code", "cashbox_groups", ["code"])

    # 4. SSH Credentials (AES-256-GCM encrypted)
    op.create_table(
        "ssh_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("auth_type", sa.String(20), default="PASSWORD", nullable=False),
        sa.Column("ciphertext", sa.LargeBinary, nullable=False),
        sa.Column("nonce", sa.LargeBinary, nullable=False),
        sa.Column("tag", sa.LargeBinary, nullable=False),
        sa.Column("key_fingerprint", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 5. Cashboxes
    op.create_table(
        "cashboxes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=False, unique=True),
        sa.Column("ssh_port", sa.Integer, default=22, nullable=False),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashbox_groups.id", ondelete="SET NULL"), nullable=True),
        sa.Column("credential_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ssh_credentials.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(30), default="ACTIVE", nullable=False),
        sa.Column("screen_resolution", sa.String(20), default="1024x768", nullable=False),
        sa.Column("gs_version", sa.String(20), default="3.1.1.0", nullable=False),
        sa.Column("desired_version", sa.Integer, default=0, nullable=False),
        sa.Column("actual_version", sa.Integer, default=0, nullable=False),
        sa.Column("last_inventory_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_deployment_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cashboxes_ip_address", "cashboxes", ["ip_address"])
    op.create_index("ix_cashboxes_location_id", "cashboxes", ["location_id"])
    op.create_index("ix_cashboxes_group_id", "cashboxes", ["group_id"])
    op.create_index("ix_cashboxes_status", "cashboxes", ["status"])

    # 6. Media Assets
    op.create_table(
        "media_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(1024), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False, unique=True),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("width", sa.Integer, nullable=False),
        sa.Column("height", sa.Integer, nullable=False),
        sa.Column("aspect_ratio", sa.String(20), nullable=False),
        sa.Column("ad_mode", sa.String(20), default="FULL", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_media_assets_sha256", "media_assets", ["sha256"])

    # 7. Playlists
    op.create_table(
        "playlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("ad_mode", sa.String(20), nullable=False),
        sa.Column("is_dynamic", sa.Boolean, default=False, nullable=False),
        sa.Column("default_interval_sec", sa.Integer, default=5, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 8. Playlist Items
    op.create_table(
        "playlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("playlist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("position", sa.Integer, nullable=False),
        sa.Column("duration_seconds", sa.Integer, default=5, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("playlist_id", "position", name="uq_playlist_item_position"),
    )
    op.create_index("ix_playlist_items_playlist_id", "playlist_items", ["playlist_id"])
    op.create_index("ix_playlist_items_media_id", "playlist_items", ["media_id"])

    # 9. Ad Configurations
    op.create_table(
        "ad_configurations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("full_playlist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("playlists.id", ondelete="SET NULL"), nullable=True),
        sa.Column("split_playlist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("playlists.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ad_configurations_version", "ad_configurations", ["version"])

    # 10. Configuration Assignments
    op.create_table(
        "configuration_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("configuration_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ad_configurations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cashbox_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashboxes.id", ondelete="CASCADE"), nullable=True),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashbox_groups.id", ondelete="CASCADE"), nullable=True),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("locations.id", ondelete="CASCADE"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cfg_assign_config_id", "configuration_assignments", ["configuration_id"])
    op.create_index("ix_cfg_assign_cashbox_id", "configuration_assignments", ["cashbox_id"])
    op.create_index("ix_cfg_assign_group_id", "configuration_assignments", ["group_id"])
    op.create_index("ix_cfg_assign_location_id", "configuration_assignments", ["location_id"])

    # 11. Cashbox Inventory (Actual State)
    op.create_table(
        "cashbox_inventory",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("cashbox_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashboxes.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("gs_db_sha256", sa.String(64), nullable=True),
        sa.Column("sync_version_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("full_scene_raw", postgresql.JSONB, nullable=True),
        sa.Column("split_scene_raw", postgresql.JSONB, nullable=True),
        sa.Column("media_files", postgresql.JSONB, server_default="[]", nullable=True),
        sa.Column("unexpected_files", postgresql.JSONB, server_default="[]", nullable=True),
        sa.Column("audited_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cashbox_inventory_cashbox_id", "cashbox_inventory", ["cashbox_id"])

    # 12. Deployments
    op.create_table(
        "deployments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("cashbox_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cashboxes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("configuration_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ad_configurations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("target_version", sa.Integer, nullable=False),
        sa.Column("status", sa.String(30), default="PENDING", nullable=False),
        sa.Column("current_step", sa.Integer, default=0, nullable=False),
        sa.Column("is_rollback", sa.Boolean, default=False, nullable=False),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'VERIFYING', 'SUCCESS', 'FAILED', "
            "'ROLLING_BACK', 'ROLLED_BACK', 'CANCELLED', 'FAILED_MANUAL_INTERVENTION', 'NO_OP')",
            name="ck_deployment_status",
        ),
    )
    op.create_index("ix_deployments_cashbox_id", "deployments", ["cashbox_id"])
    op.create_index("ix_deployments_status", "deployments", ["status"])

    # 13. Deployment Steps
    op.create_table(
        "deployment_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("deployment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer, nullable=False),
        sa.Column("step_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), default="PENDING", nullable=False),
        sa.Column("details", postgresql.JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("deployment_id", "step_number", name="uq_deployment_step_number"),
    )
    op.create_index("ix_deployment_steps_deployment_id", "deployment_steps", ["deployment_id"])

    # 14. Rollback Snapshots
    op.create_table(
        "rollback_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("deployment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("previous_version", sa.Integer, nullable=False),
        sa.Column("previous_full_scene", postgresql.JSONB, nullable=True),
        sa.Column("previous_split_scene", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_rollback_snapshots_deployment_id", "rollback_snapshots", ["deployment_id"])

    # 15. Audit Logs
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("actor", sa.String(100), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(64), nullable=True),
        sa.Column("details", postgresql.JSONB, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_actor", "audit_logs", ["actor"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # Audit Log Immutability Trigger (Prevents UPDATE or DELETE on audit_logs)
    op.execute("""
    CREATE OR REPLACE FUNCTION trg_audit_logs_immutable()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'audit_logs entries are strictly immutable: UPDATE and DELETE are prohibited';
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_protect_audit_logs
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION trg_audit_logs_immutable();
    """)

    # 16. System Settings
    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", postgresql.JSONB, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 17. Users (Operators and Admins)
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), default="Operator", nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"])


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_protect_audit_logs ON audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS trg_audit_logs_immutable();")
    op.drop_table("users")
    op.drop_table("system_settings")
    op.drop_table("audit_logs")
    op.drop_table("rollback_snapshots")
    op.drop_table("deployment_steps")
    op.drop_table("deployments")
    op.drop_table("cashbox_inventory")
    op.drop_table("configuration_assignments")
    op.drop_table("ad_configurations")
    op.drop_table("playlist_items")
    op.drop_table("playlists")
    op.drop_table("media_assets")
    op.drop_table("cashboxes")
    op.drop_table("ssh_credentials")
    op.drop_table("cashbox_groups")
    op.drop_table("locations")
