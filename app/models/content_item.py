"""ContentItem: a piece of content (e.g. a YouTube video) on an account."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.connected_account import ConnectedAccount
    from app.models.content_metrics import ContentMetrics


class ContentItem(UUIDPKMixin, Base):
    __tablename__ = "content_items"
    __table_args__ = (
        UniqueConstraint(
            "connected_account_id",
            "external_content_id",
            name="uq_content_items_account_external",
        ),
    )

    connected_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("connected_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_content_id: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str | None] = mapped_column(Text)
    # e.g. "video", "short", "post", "reel" — platform-agnostic.
    content_type: Mapped[str] = mapped_column(String(20), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    thumbnail_url: Mapped[str | None] = mapped_column(Text)

    connected_account: Mapped["ConnectedAccount"] = relationship(
        back_populates="content_items"
    )
    metrics: Mapped[list["ContentMetrics"]] = relationship(
        back_populates="content_item", cascade="all, delete-orphan"
    )
