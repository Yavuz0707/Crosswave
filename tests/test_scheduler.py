"""Nightly auto-sync tests (YouTube mocked, no real scheduler started)."""

from __future__ import annotations

import uuid

from httpx import AsyncClient
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.connected_account import ConnectedAccount
from app.scheduler import run_active_sync
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


async def test_run_active_sync_writes_metrics(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
    db_session: AsyncSession,
) -> None:
    account_id = await _connect_account(client, auth_headers)

    result = await run_active_sync(db_session)
    assert result == {"synced": 1, "failed": 0}

    metric_count = await db_session.scalar(
        select(func.count())
        .select_from(AccountMetricsDaily)
        .where(AccountMetricsDaily.connected_account_id == uuid.UUID(account_id))
    )
    assert metric_count == 1


async def test_inactive_accounts_are_skipped(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
    db_session: AsyncSession,
) -> None:
    account_id = await _connect_account(client, auth_headers)
    await db_session.execute(
        update(ConnectedAccount)
        .where(ConnectedAccount.id == uuid.UUID(account_id))
        .values(status="paused")
    )
    await db_session.commit()

    result = await run_active_sync(db_session)
    assert result == {"synced": 0, "failed": 0}

    metric_count = await db_session.scalar(
        select(func.count())
        .select_from(AccountMetricsDaily)
        .where(AccountMetricsDaily.connected_account_id == uuid.UUID(account_id))
    )
    assert metric_count == 0
