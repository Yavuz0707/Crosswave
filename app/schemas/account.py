"""Connected account schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.platform import PLATFORM_YOUTUBE


class AccountConnectRequest(BaseModel):
    """Connect a public social account to a client.

    For YouTube, ``channel`` accepts a channel id ("UC..."), an @handle, a legacy
    username, or a full channel URL.
    """

    client_id: uuid.UUID
    channel: str = Field(min_length=1, max_length=255)
    platform: str = PLATFORM_YOUTUBE


class ConnectedAccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: uuid.UUID
    platform_id: int
    external_account_id: str
    display_name: str | None
    status: str
    connected_at: datetime


class AccountSyncResult(BaseModel):
    """Summary returned after pulling fresh stats from the platform."""

    account_id: uuid.UUID
    captured_date: date
    followers_count: int | None
    views_count: int | None
    content_items_synced: int
    message: str
