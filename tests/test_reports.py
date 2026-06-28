"""PDF report endpoint tests (YouTube calls mocked)."""

from __future__ import annotations

import uuid
from datetime import date, timedelta

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from tests.conftest import FakeYouTubeClient, RegisterFn


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


def _period() -> dict[str, str]:
    end = date.today()
    start = end - timedelta(days=400)
    return {"period_start": start.isoformat(), "period_end": end.isoformat()}


async def test_generate_report_returns_pdf(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
    db_session: AsyncSession,
) -> None:
    account_id = await _connect_account(client, auth_headers)
    await client.post(f"/api/v1/accounts/{account_id}/sync", headers=auth_headers)

    resp = await client.post(
        "/api/v1/reports/generate",
        json={"account_id": account_id, **_period()},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:5] == b"%PDF-"
    assert len(resp.content) > 1024

    report_count = await db_session.scalar(select(func.count()).select_from(Report))
    assert report_count == 1


async def test_generate_report_no_metrics_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    # Connected but never synced -> no metrics in the period.
    account_id = await _connect_account(client, auth_headers)
    resp = await client.post(
        "/api/v1/reports/generate",
        json={"account_id": account_id, **_period()},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "metrik" in resp.json()["detail"].lower()


async def test_generate_report_other_agency_forbidden(
    client: AsyncClient,
    register: RegisterFn,
    mock_youtube: type[FakeYouTubeClient],
) -> None:
    agency_a = await register(email="a-rep@agency.co", agency="A")
    agency_b = await register(email="b-rep@agency.co", agency="B")

    account_id = await _connect_account(client, agency_a)
    resp = await client.post(
        "/api/v1/reports/generate",
        json={"account_id": account_id, **_period()},
        headers=agency_b,
    )
    assert resp.status_code == 403


async def test_generate_report_unknown_account_404(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    resp = await client.post(
        "/api/v1/reports/generate",
        json={"account_id": str(uuid.uuid4()), **_period()},
        headers=auth_headers,
    )
    assert resp.status_code == 404
