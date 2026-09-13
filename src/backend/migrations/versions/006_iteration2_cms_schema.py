"""Iteration 2 CMS schema updates: OCC versions, encrypted passwords, snapshot JSON

Revision ID: 006_iteration2_cms_schema
Revises: 005_audit_trail
Create Date: 2026-09-04 13:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '006_iteration2_cms_schema'
down_revision: Union[str, None] = '005_audit_trail'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Media Assets: add version column and drop unique constraints on sha256 & stored_name
    op.add_column(
        'media_assets',
        sa.Column('version', sa.Integer(), nullable=False, server_default='1')
    )
    
    # Drop unique index if exists, create non-unique index for deduplication support
    try:
        op.drop_index('ix_media_assets_sha256', table_name='media_assets')
    except Exception:
        pass
    op.create_index(op.f('ix_media_assets_sha256'), 'media_assets', ['sha256'], unique=False)

    try:
        op.drop_index('ix_media_assets_stored_name', table_name='media_assets')
    except Exception:
        pass
    op.create_index(op.f('ix_media_assets_stored_name'), 'media_assets', ['stored_name'], unique=False)

    # 2. Advertising Blocks: add version column for OCC
    op.add_column(
        'advertising_blocks',
        sa.Column('version', sa.Integer(), nullable=False, server_default='1')
    )

    # 3. Cashiers: add ssh_password_encrypted column
    op.add_column(
        'cashiers',
        sa.Column('ssh_password_encrypted', sa.LargeBinary(), nullable=True)
    )

    # 4. Publication Batches: add content_snapshot_json
    op.add_column(
        'publication_batches',
        sa.Column('content_snapshot_json', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('publication_batches', 'content_snapshot_json')
    op.drop_column('cashiers', 'ssh_password_encrypted')
    op.drop_column('advertising_blocks', 'version')
    
    op.drop_index(op.f('ix_media_assets_stored_name'), table_name='media_assets')
    op.create_index('ix_media_assets_stored_name', 'media_assets', ['stored_name'], unique=True)
    op.drop_index(op.f('ix_media_assets_sha256'), table_name='media_assets')
    op.create_index('ix_media_assets_sha256', 'media_assets', ['sha256'], unique=True)
    
    op.drop_column('media_assets', 'version')
