"""Audit trail and settings tables

Revision ID: 005_audit_trail
Revises: 004_publication_orchestration
Create Date: 2026-09-04 04:34:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_audit_trail'
down_revision: Union[str, None] = '004_publication_orchestration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=64), nullable=True),
        sa.Column('payload_diff', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)

    # 2. System Settings
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), nullable=False, default=1),
        sa.Column('worker_concurrency', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('max_concurrent_per_branch', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('ssh_connect_timeout_seconds', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('ssh_command_timeout_seconds', sa.Integer(), nullable=False, server_default='45'),
        sa.Column('sftp_timeout_seconds', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('minio_media_retention_days', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('cashier_backup_retention_days', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Insert default settings row
    op.execute(
        "INSERT INTO system_settings (id, worker_concurrency, max_concurrent_per_branch, "
        "ssh_connect_timeout_seconds, ssh_command_timeout_seconds, sftp_timeout_seconds, "
        "minio_media_retention_days, cashier_backup_retention_days, updated_at) "
        "VALUES (1, 15, 2, 10, 45, 60, 30, 7, NOW())"
    )


def downgrade() -> None:
    op.drop_table('system_settings')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_entity_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_table('audit_logs')
