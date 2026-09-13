"""Publication orchestration tables

Revision ID: 004_publication_orchestration
Revises: 003_content_model
Create Date: 2026-09-04 04:33:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_publication_orchestration'
down_revision: Union[str, None] = '003_content_model'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Publication Batches
    op.create_table(
        'publication_batches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('advertising_block_id', sa.UUID(), nullable=False),
        sa.Column('scope_type', sa.String(length=20), nullable=False),
        sa.Column('scope_target_ids', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='PENDING'),
        sa.Column('total_cashiers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('awaiting_restart_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('offline_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('initiated_by_user_id', sa.UUID(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['advertising_block_id'], ['advertising_blocks.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['initiated_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_publication_batches_advertising_block_id'), 'publication_batches', ['advertising_block_id'], unique=False)
    op.create_index(op.f('ix_publication_batches_status'), 'publication_batches', ['status'], unique=False)

    # 2. Publication Jobs
    op.create_table(
        'publication_jobs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=False),
        sa.Column('cashier_id', sa.UUID(), nullable=False),
        sa.Column('advertising_block_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='PENDING'),
        sa.Column('idempotency_key', sa.String(length=128), nullable=False),
        sa.Column('current_attempt', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['advertising_block_id'], ['advertising_blocks.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['batch_id'], ['publication_batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cashier_id'], ['cashiers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id', 'cashier_id', name='uq_batch_cashier')
    )
    op.create_index(op.f('ix_publication_jobs_batch_id'), 'publication_jobs', ['batch_id'], unique=False)
    op.create_index(op.f('ix_publication_jobs_cashier_id'), 'publication_jobs', ['cashier_id'], unique=False)
    op.create_index(op.f('ix_publication_jobs_idempotency_key'), 'publication_jobs', ['idempotency_key'], unique=False)
    op.create_index(op.f('ix_publication_jobs_status'), 'publication_jobs', ['status'], unique=False)

    # 3. Job Attempts
    op.create_table(
        'job_attempts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('job_id', sa.UUID(), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('previous_scene_raw', sa.Text(), nullable=True),
        sa.Column('remote_backup_path', sa.String(length=255), nullable=True),
        sa.Column('execution_log', sa.Text(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['publication_jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_attempts_job_id'), 'job_attempts', ['job_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_job_attempts_job_id'), table_name='job_attempts')
    op.drop_table('job_attempts')

    op.drop_index(op.f('ix_publication_jobs_status'), table_name='publication_jobs')
    op.drop_index(op.f('ix_publication_jobs_idempotency_key'), table_name='publication_jobs')
    op.drop_index(op.f('ix_publication_jobs_cashier_id'), table_name='publication_jobs')
    op.drop_index(op.f('ix_publication_jobs_batch_id'), table_name='publication_jobs')
    op.drop_table('publication_jobs')

    op.drop_index(op.f('ix_publication_batches_status'), table_name='publication_batches')
    op.drop_index(op.f('ix_publication_batches_advertising_block_id'), table_name='publication_batches')
    op.drop_table('publication_batches')
