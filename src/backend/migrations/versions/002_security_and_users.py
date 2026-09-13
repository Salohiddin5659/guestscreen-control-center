"""Security and users tables

Revision ID: 002_security_and_users
Revises: 001_initial_topology
Create Date: 2026-09-04 04:31:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_security_and_users'
down_revision: Union[str, None] = '001_initial_topology'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='OPERATOR'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 2. SSH Credentials
    op.create_table(
        'ssh_credentials',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('auth_type', sa.String(length=20), nullable=False, server_default='CORPORATE_KEY'),
        sa.Column('username', sa.String(length=100), nullable=False, server_default='Administrator'),
        sa.Column('encrypted_secret', sa.LargeBinary(), nullable=True),
        sa.Column('key_fingerprint', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Add FK from cashiers to ssh_credentials
    op.create_foreign_key(
        'fk_cashiers_ssh_credential_id',
        'cashiers', 'ssh_credentials',
        ['ssh_credential_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_cashiers_ssh_credential_id', 'cashiers', type_='foreignkey')
    op.drop_table('ssh_credentials')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
