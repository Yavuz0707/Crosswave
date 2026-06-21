"""Sync + metrics/content read tests (YouTube calls are mocked)."""

from __future__ import annotations

import uuid

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.content_item import ContentItem
from app.models.content_metrics import ContentMetrics
from tests.conftest import FakeYouTubeClient


async def _connect_account(client: AsyncClient, headers: dict[str, str]) -> str:
    client_id = (
        await client.post("/api/v1/clients", json={"name": "Aurora"}, headers=headers)
    ).json()["id"]
    account = (
        await client.post(
            "/api/v1/accounts",
            json={"client_id": client_id, "channel": "@aurora"},
            headers=headers,
        )
    ).json()
    return account["id"]


async def test_sync_writes_metrics_and_content(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
    db_session: AsyncSession,
) -> None:
    account_id = await _connect_account(client, auth_headers)

    resp = await client.post(f"/api/v1/accounts/{account_id}/sync", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["followers_count"] == 1_240_000
    assert body["views_count"] == 48_200_000
    assert body["content_items_synced"] == 2

    account_uuid = uuid.UUID(account_id)
    metrics_count = await db_session.scalar(
        select(func.count())
        .select_from(AccountMetricsDaily)
        .where(AccountMetricsDaily.connected_account_id == account_uuid)
    )
    assert metrics_count == 1

    items_count = await db_session.scalar(
        select(func.count())
        .select_from(ContentItem)
        .where(ContentItem.connected_account_id == account_uuid)
    )
    assert items_count == 2

    content_metrics_count = await db_session.scalar(
        select(func.count()).select_from(ContentMetrics)
    )
    assert content_metrics_count == 2


async def test_sync_missing_account_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    resp = await client.post(
        f"/api/v1/accounts/{uuid.uuid4()}/sync", headers=auth_headers
    )
    assert resp.status_code == 404


async def test_metrics_and_content_readable_after_sync(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    account_id = await _connect_account(client, auth_headers)
    await client.post(f"/api/v1/accounts/{account_id}/sync", headers=auth_headers)

    metrics_resp = await client.get(
        f"/api/v1/accounts/{account_id}/metrics", headers=auth_headers
    )
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert len(metrics) == 1
    assert metrics[0]["followers_count"] == 1_240_000
    assert metrics[0]["views_count"] == 48_200_000

    content_resp = await client.get(
        f"/api/v1/accounts/{account_id}/content", headers=auth_headers
    )
    assert content_resp.status_code == 200
    content = content_resp.json()
    assert len(content) == 2
    titles = {c["title"] for c in content}
    assert "How we grew to 1M subscribers" in titles

    first = next(c for c in content if c["external_content_id"] == "vid_0001")
    assert first["latest_metrics"] is not None
    assert first["latest_metrics"]["views"] == 482_000
    assert first["latest_metrics"]["likes"] == 31_200


async def test_sync_twice_same_day_upserts_single_row(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
    db_session: AsyncSession,
) -> None:
    account_id = await _connect_account(client, auth_headers)
    await client.post(f"/api/v1/accounts/{account_id}/sync", headers=auth_headers)
    await client.post(f"/api/v1/accounts/{account_id}/sync", headers=auth_headers)

    metrics_count = await db_session.scalar(
        select(func.count())
        .select_from(AccountMetricsDaily)
        .where(AccountMetricsDaily.connected_account_id == uuid.UUID(account_id))
    )
    # The (connected_account_id, captured_date) upsert keeps one row per day.
    assert metrics_count == 1
