"""Read endpoints for stored metrics and synced content."""

from __future__ import annotations

import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, get_owned_account
from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.content_item import ContentItem
from app.models.content_metrics import ContentMetrics
from app.schemas.metrics import (
    AccountMetricsDailyRead,
    ContentItemRead,
    ContentMetricsRead,
)

router = APIRouter(prefix="/accounts", tags=["metrics"])


@router.get("/{account_id}/metrics", response_model=list[AccountMetricsDailyRead])
async def get_account_metrics(
    account_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = 90,
) -> list[AccountMetricsDaily]:
    """Daily account metric snapshots, most recent first."""
    await get_owned_account(db, current_user, account_id)
    limit = max(1, min(limit, 365))
    stmt = (
        select(AccountMetricsDaily)
        .where(AccountMetricsDaily.connected_account_id == account_id)
        .order_by(AccountMetricsDaily.captured_date.desc())
        .limit(limit)
    )
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{account_id}/content", response_model=list[ContentItemRead])
async def get_account_content(
    account_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = 50,
) -> list[ContentItemRead]:
    """Synced content items, each annotated with its latest metric snapshot."""
    await get_owned_account(db, current_user, account_id)
    limit = max(1, min(limit, 200))

    items_stmt = (
        select(ContentItem)
        .where(ContentItem.connected_account_id == account_id)
        .order_by(ContentItem.published_at.desc())
        .limit(limit)
    )
    items = list((await db.execute(items_stmt)).scalars().all())
    if not items:
        return []

    item_ids = [item.id for item in items]
    metrics_stmt = (
        select(ContentMetrics)
        .where(ContentMetrics.content_item_id.in_(item_ids))
        .order_by(ContentMetrics.captured_at.desc())
    )
    latest_by_item: dict[uuid.UUID, ContentMetrics] = {}
    for metric in (await db.execute(metrics_stmt)).scalars():
        latest_by_item.setdefault(metric.content_item_id, metric)

    results: list[ContentItemRead] = []
    for item in items:
        read = ContentItemRead.model_validate(item)
        latest = latest_by_item.get(item.id)
        if latest is not None:
            read.latest_metrics = ContentMetricsRead.model_validate(latest)
        results.append(read)
    return results
