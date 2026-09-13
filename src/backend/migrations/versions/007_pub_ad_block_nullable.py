"""Make publication advertising_block_id nullable with ON DELETE SET NULL

Revision ID: 007_pub_ad_block_nullable
Revises: 006_iteration2_cms_schema
Create Date: 2026-09-04 14:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '007_pub_ad_block_nullable'
down_revision: Union[str, None] = '006_iteration2_cms_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraints
    op.drop_constraint('publication_batches_advertising_block_id_fkey', 'publication_batches', type_='foreignkey')
    op.drop_constraint('publication_jobs_advertising_block_id_fkey', 'publication_jobs', type_='foreignkey')

    # Make advertising_block_id nullable
    op.alter_column('publication_batches', 'advertising_block_id', nullable=True)
    op.alter_column('publication_jobs', 'advertising_block_id', nullable=True)

    # Re-create foreign keys with ON DELETE SET NULL
    op.create_foreign_key(
        'publication_batches_advertising_block_id_fkey',
        'publication_batches', 'advertising_blocks',
        ['advertising_block_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'publication_jobs_advertising_block_id_fkey',
        'publication_jobs', 'advertising_blocks',
        ['advertising_block_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('publication_jobs_advertising_block_id_fkey', 'publication_jobs', type_='foreignkey')
    op.drop_constraint('publication_batches_advertising_block_id_fkey', 'publication_batches', type_='foreignkey')

    op.alter_column('publication_jobs', 'advertising_block_id', nullable=False)
    op.alter_column('publication_batches', 'advertising_block_id', nullable=False)

    op.create_foreign_key(
        'publication_jobs_advertising_block_id_fkey',
        'publication_jobs', 'advertising_blocks',
        ['advertising_block_id'], ['id'],
        ondelete='RESTRICT'
    )
    op.create_foreign_key(
        'publication_batches_advertising_block_id_fkey',
        'publication_batches', 'advertising_blocks',
        ['advertising_block_id'], ['id'],
        ondelete='RESTRICT'
    )
