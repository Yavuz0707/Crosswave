"""Synchronization logic: pull fresh YouTube stats into the database.

This is invoked manually via the ``/accounts/{id}/sync`` endpoint in Sprint 1.
A scheduler (APScheduler/Celery) can call the same function later.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.connected_account import ConnectedAccount
from app.models.content_item import ContentItem
from app.models.content_metrics import ContentMetrics
from app.services.youtube.client import (
    YouTubeAPIError,
    YouTubeClient,
    YouTubeVideo,
    get_youtube_client,
)

# Cap engagement_rate to the NUMERIC(5,2) column range (max 999.99).
_MAX_ENGAGEMENT = Decimal("999.99")


@dataclass(slots=True)
class SyncResult:
    captured_date: date
    followers_count: int | None
    views_count: int | None
    content_items_synced: int


def _compute_engagement_rate(videos: list[YouTubeVideo]) -> Decimal | None:
    """Average engagement across recent videos: (likes + comments) / views * 100."""
    total_views = sum(v.view_count or 0 for v in videos)
    if total_views <= 0:
        return None
    total_interactions = sum((v.like_count or 0) + (v.comment_count or 0) for v in videos)
    rate = Decimal(total_interactions) / Decimal(total_views) * Decimal(100)
    rate = min(rate, _MAX_ENGAGEMENT)
    return rate.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def sync_youtube_account(
    session: AsyncSession,
    account: ConnectedAccount,
    *,
    max_videos: int = 10,
    client: YouTubeClient | None = None,
) -> SyncResult:
    """Fetch the channel's current stats + recent uploads and persist them.

    - Upserts today's row in ``account_metrics_daily``.
    - Upserts ``content_items`` for recent uploads and appends a fresh
      ``content_metrics`` snapshot for each.

    Raises ``YouTubeAPIError`` if the channel cannot be fetched.
    """
    owns_client = client is None
    yt = client or get_youtube_client()
    try:
        channel = await yt.get_channel(channel_id=account.external_account_id)
        if channel is None:
            raise YouTubeAPIError(
                f"YouTube channel '{account.external_account_id}' was not found."
            )

        videos: list[YouTubeVideo] = []
        if channel.uploads_playlist_id:
            videos = await yt.get_recent_videos(
                channel.uploads_playlist_id, max_results=max_videos
            )
    finally:
        if owns_client:
            await yt.aclose()

    # Keep the stored display name fresh.
    if channel.title and channel.title != account.display_name:
        account.display_name = channel.title

    engagement_rate = _compute_engagement_rate(videos)
    today = datetime.now(timezone.utc).date()

    metrics_stmt = (
        pg_insert(AccountMetricsDaily)
        .values(
            connected_account_id=account.id,
            captured_date=today,
            followers_count=channel.subscriber_count,
            views_count=channel.view_count,
            engagement_rate=engagement_rate,
        )
        .on_conflict_do_update(
            constraint="uq_account_metrics_daily_account_date",
            set_={
                "followers_count": channel.subscriber_count,
                "views_count": channel.view_count,
                "engagement_rate": engagement_rate,
            },
        )
    )
    await session.execute(metrics_stmt)

    synced = 0
    for video in videos:
        item_stmt = (
            pg_insert(ContentItem)
            .values(
                connected_account_id=account.id,
                external_content_id=video.video_id,
                title=video.title,
                content_type="video",
                published_at=video.published_at,
                thumbnail_url=video.thumbnail_url,
            )
            .on_conflict_do_update(
                constraint="uq_content_items_account_external",
                set_={
                    "title": video.title,
                    "published_at": video.published_at,
                    "thumbnail_url": video.thumbnail_url,
                },
            )
            .returning(ContentItem.id)
        )
        result = await session.execute(item_stmt)
        content_item_id = result.scalar_one()

        session.add(
            ContentMetrics(
                content_item_id=content_item_id,
                views=video.view_count,
                likes=video.like_count,
                comments=video.comment_count,
                shares=None,  # not exposed by the public Data API
            )
        )
        synced += 1

    await session.flush()

    return SyncResult(
        captured_date=today,
        followers_count=channel.subscriber_count,
        views_count=channel.view_count,
        content_items_synced=synced,
    )
