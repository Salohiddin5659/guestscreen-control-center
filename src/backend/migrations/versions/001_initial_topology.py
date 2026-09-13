"""Initial topology tables

Revision ID: 001_initial_topology
Revises: 
Create Date: 2026-09-04 04:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '001_initial_topology'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Regions
    op.create_table(
        'regions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('default_full_screen_block_id', sa.UUID(), nullable=True),
        sa.Column('default_mode32_block_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_regions_code'), 'regions', ['code'], unique=True)
    op.create_index(op.f('ix_regions_name'), 'regions', ['name'], unique=True)

    # 2. Branches
    op.create_table(
        'branches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('region_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('override_full_screen_block_id', sa.UUID(), nullable=True),
        sa.Column('override_mode32_block_id', sa.UUID(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['region_id'], ['regions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_branches_code'), 'branches', ['code'], unique=True)
    op.create_index(op.f('ix_branches_region_id'), 'branches', ['region_id'], unique=False)

    # 3. Cashiers
    op.create_table(
        'cashiers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('branch_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('ssh_port', sa.Integer(), nullable=False, server_default='22'),
        sa.Column('ssh_credential_id', sa.UUID(), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('override_full_screen_block_id', sa.UUID(), nullable=True),
        sa.Column('override_mode32_block_id', sa.UUID(), nullable=True),
        sa.Column('current_full_screen_block_id', sa.UUID(), nullable=True),
        sa.Column('current_mode32_block_id', sa.UUID(), nullable=True),
        sa.Column('current_content_version', sa.String(length=64), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_sync_status', sa.String(length=30), nullable=False, server_default='UNKNOWN'),
        sa.Column('guest_screen_version', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cashiers_branch_id'), 'cashiers', ['branch_id'], unique=False)
    op.create_index(op.f('ix_cashiers_ip_address'), 'cashiers', ['ip_address'], unique=True)
    op.create_index(op.f('ix_cashiers_last_sync_status'), 'cashiers', ['last_sync_status'], unique=False)

    # 4. Maintenance Windows
    op.create_table(
        'maintenance_windows',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('branch_id', sa.UUID(), nullable=False),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='Asia/Tashkent'),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('branch_id')
    )


def downgrade() -> None:
    op.drop_table('maintenance_windows')
    op.drop_index(op.f('ix_cashiers_last_sync_status'), table_name='cashiers')
    op.drop_index(op.f('ix_cashiers_ip_address'), table_name='cashiers')
    op.drop_index(op.f('ix_cashiers_branch_id'), table_name='cashiers')
    op.drop_table('cashiers')
    op.drop_index(op.f('ix_branches_region_id'), table_name='branches')
    op.drop_index(op.f('ix_branches_code'), table_name='branches')
    op.drop_table('branches')
    op.drop_index(op.f('ix_regions_name'), table_name='regions')
    op.drop_index(op.f('ix_regions_code'), table_name='regions')
    op.drop_table('regions')
