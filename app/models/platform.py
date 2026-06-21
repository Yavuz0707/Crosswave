"""Platform: a social network (youtube, instagram, tiktok, ...).

Platform-agnostic by design — new platforms are added as rows, not schema changes.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.connected_account import ConnectedAccount

# Canonical platform names. Only YouTube is wired up in Sprint 1.
PLATFORM_YOUTUBE = "youtube"


class Platform(Base):
    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    connected_accounts: Mapped[list["ConnectedAccount"]] = relationship(
        back_populates="platform"
    )
