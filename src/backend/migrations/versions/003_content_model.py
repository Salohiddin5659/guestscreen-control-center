"""Content model tables

Revision ID: 003_content_model
Revises: 002_security_and_users
Create Date: 2026-09-04 04:32:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_content_model'
down_revision: Union[str, None] = '002_security_and_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Media Assets
    op.create_table(
        'media_assets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('original_name', sa.String(length=255), nullable=False),
        sa.Column('stored_name', sa.String(length=100), nullable=False),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('media_type', sa.String(length=20), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('s3_bucket', sa.String(length=100), nullable=False, server_default='media'),
        sa.Column('s3_key', sa.String(length=255), nullable=False),
        sa.Column('uploaded_by_user_id', sa.UUID(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_media_assets_sha256'), 'media_assets', ['sha256'], unique=True)
    op.create_index(op.f('ix_media_assets_stored_name'), 'media_assets', ['stored_name'], unique=True)

    # 2. Advertising Blocks
    op.create_table(
        'advertising_blocks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('area', sa.String(length=30), nullable=False),
        sa.Column('display_mode', sa.String(length=30), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('valid_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_advertising_blocks_area'), 'advertising_blocks', ['area'], unique=False)
    op.create_index(op.f('ix_advertising_blocks_display_mode'), 'advertising_blocks', ['display_mode'], unique=False)

    # 3. Playlist Items
    op.create_table(
        'playlist_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('advertising_block_id', sa.UUID(), nullable=False),
        sa.Column('media_asset_id', sa.UUID(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['advertising_block_id'], ['advertising_blocks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_asset_id'], ['media_assets.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('advertising_block_id', 'order_index', name='uq_block_order')
    )
    op.create_index(op.f('ix_playlist_items_advertising_block_id'), 'playlist_items', ['advertising_block_id'], unique=False)
    op.create_index(op.f('ix_playlist_items_media_asset_id'), 'playlist_items', ['media_asset_id'], unique=False)

    # 4. Add FKs from topology tables to advertising_blocks
    op.create_foreign_key(
        'fk_regions_default_full_screen_block', 'regions', 'advertising_blocks',
        ['default_full_screen_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_regions_default_mode32_block', 'regions', 'advertising_blocks',
        ['default_mode32_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_branches_override_full_screen_block', 'branches', 'advertising_blocks',
        ['override_full_screen_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_branches_override_mode32_block', 'branches', 'advertising_blocks',
        ['override_mode32_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_cashiers_override_full_screen_block', 'cashiers', 'advertising_blocks',
        ['override_full_screen_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_cashiers_override_mode32_block', 'cashiers', 'advertising_blocks',
        ['override_mode32_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_cashiers_current_full_screen_block', 'cashiers', 'advertising_blocks',
        ['current_full_screen_block_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_cashiers_current_mode32_block', 'cashiers', 'advertising_blocks',
        ['current_mode32_block_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_cashiers_current_mode32_block', 'cashiers', type_='foreignkey')
    op.drop_constraint('fk_cashiers_current_full_screen_block', 'cashiers', type_='foreignkey')
    op.drop_constraint('fk_cashiers_override_mode32_block', 'cashiers', type_='foreignkey')
    op.drop_constraint('fk_cashiers_override_full_screen_block', 'cashiers', type_='foreignkey')
    op.drop_constraint('fk_branches_override_mode32_block', 'branches', type_='foreignkey')
    op.drop_constraint('fk_branches_override_full_screen_block', 'branches', type_='foreignkey')
    op.drop_constraint('fk_regions_default_mode32_block', 'regions', type_='foreignkey')
    op.drop_constraint('fk_regions_default_full_screen_block', 'regions', type_='foreignkey')

    op.drop_index(op.f('ix_playlist_items_media_asset_id'), table_name='playlist_items')
    op.drop_index(op.f('ix_playlist_items_advertising_block_id'), table_name='playlist_items')
    op.drop_table('playlist_items')

    op.drop_index(op.f('ix_advertising_blocks_display_mode'), table_name='advertising_blocks')
    op.drop_index(op.f('ix_advertising_blocks_area'), table_name='advertising_blocks')
    op.drop_table('advertising_blocks')

    op.drop_index(op.f('ix_media_assets_stored_name'), table_name='media_assets')
    op.drop_index(op.f('ix_media_assets_sha256'), table_name='media_assets')
    op.drop_table('media_assets')
