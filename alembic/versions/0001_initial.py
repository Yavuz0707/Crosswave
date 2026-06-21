"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-20

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # gen_random_uuid() is provided by pgcrypto on older PostgreSQL versions.
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "agencies",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "plan", sa.String(length=50), server_default=sa.text("'starter'"), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("agency_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "role", sa.String(length=50), server_default=sa.text("'member'"), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "clients",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("agency_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "platforms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "connected_accounts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform_id", sa.Integer(), nullable=False),
        sa.Column("external_account_id", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status", sa.String(length=20), server_default=sa.text("'active'"), nullable=False
        ),
        sa.Column(
            "connected_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["platform_id"], ["platforms.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "platform_id",
            "external_account_id",
            name="uq_connected_accounts_platform_external",
        ),
    )
    op.create_index(
        "idx_connected_accounts_client", "connected_accounts", ["client_id"]
    )

    op.create_table(
        "account_metrics_daily",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("connected_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("captured_date", sa.Date(), nullable=False),
        sa.Column("followers_count", sa.Integer(), nullable=True),
        sa.Column("views_count", sa.BigInteger(), nullable=True),
        sa.Column("engagement_rate", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.ForeignKeyConstraint(
            ["connected_account_id"], ["connected_accounts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "connected_account_id",
            "captured_date",
            name="uq_account_metrics_daily_account_date",
        ),
    )
    op.create_index(
        "idx_metrics_account_date",
        "account_metrics_daily",
        ["connected_account_id", sa.text("captured_date DESC")],
    )

    op.create_table(
        "content_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("connected_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("external_content_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(length=20), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["connected_account_id"], ["connected_accounts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "connected_account_id",
            "external_content_id",
            name="uq_content_items_account_external",
        ),
    )

    op.create_table(
        "content_metrics",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("content_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "captured_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("views", sa.BigInteger(), nullable=True),
        sa.Column("likes", sa.Integer(), nullable=True),
        sa.Column("comments", sa.Integer(), nullable=True),
        sa.Column("shares", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["content_item_id"], ["content_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_content_metrics_item_time",
        "content_metrics",
        ["content_item_id", sa.text("captured_at DESC")],
    )

    op.create_table(
        "goals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("connected_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metric_type", sa.String(length=50), nullable=False),
        sa.Column("target_value", sa.Numeric(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["connected_account_id"], ["connected_accounts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reports",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Seed the only platform wired up in Sprint 1.
    op.execute("INSERT INTO platforms (name) VALUES ('youtube') ON CONFLICT (name) DO NOTHING")


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("goals")
    op.drop_index("idx_content_metrics_item_time", table_name="content_metrics")
    op.drop_table("content_metrics")
    op.drop_table("content_items")
    op.drop_index("idx_metrics_account_date", table_name="account_metrics_daily")
    op.drop_table("account_metrics_daily")
    op.drop_index("idx_connected_accounts_client", table_name="connected_accounts")
    op.drop_table("connected_accounts")
    op.drop_table("platforms")
    op.drop_table("clients")
    op.drop_table("users")
    op.drop_table("agencies")
