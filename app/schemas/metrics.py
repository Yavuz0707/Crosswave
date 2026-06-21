"""Metrics & content schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AccountMetricsDailyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    connected_account_id: uuid.UUID
    captured_date: date
    followers_count: int | None
    views_count: int | None
    engagement_rate: Decimal | None


class ContentMetricsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    captured_at: datetime
    views: int | None
    likes: int | None
    comments: int | None
    shares: int | None


class ContentItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    connected_account_id: uuid.UUID
    external_content_id: str
    title: str | None
    content_type: str
    published_at: datetime | None
    thumbnail_url: str | None
    latest_metrics: ContentMetricsRead | None = None
