"""Report generation endpoint: builds a PDF in memory and streams it back."""

from __future__ import annotations

import io
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.agency import Agency
from app.models.client import Client
from app.models.connected_account import ConnectedAccount
from app.models.content_item import ContentItem
from app.models.content_metrics import ContentMetrics
from app.models.goal import Goal
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest
from app.services.report import GoalRow, ReportData, VideoRow, build_pdf

router = APIRouter(prefix="/reports", tags=["reports"])

_DEFAULT_ACCENT = "#722F37"
_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

_GOAL_LABELS = {
    "followers_count": "Abone",
    "views_count": "Görüntülenme",
    "engagement_rate": "Etkileşim oranı",
}


@router.post("/generate")
async def generate_report(
    payload: ReportGenerateRequest, current_user: CurrentUser, db: DbSession
) -> StreamingResponse:
    """Generate a white-label PDF report for an account over a period."""
    account = await db.get(ConnectedAccount, payload.account_id)
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Connected account not found"
        )

    client = await db.get(Client, account.client_id)
    if client is None or client.agency_id != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this account.",
        )
    agency = await db.get(Agency, current_user.agency_id)

    # Daily metrics within the period (ascending).
    metrics = list(
        (
            await db.execute(
                select(AccountMetricsDaily)
                .where(
                    AccountMetricsDaily.connected_account_id == account.id,
                    AccountMetricsDaily.captured_date >= payload.period_start,
                    AccountMetricsDaily.captured_date <= payload.period_end,
                )
                .order_by(AccountMetricsDaily.captured_date.asc())
            )
        ).scalars()
    )
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bu dönem için yeterli metrik verisi bulunamadı.",
        )

    first, last = metrics[0], metrics[-1]
    growth_pct: float | None = None
    if (
        first.followers_count
        and last.followers_count is not None
        and first.followers_count > 0
    ):
        growth_pct = (
            (last.followers_count - first.followers_count) / first.followers_count * 100
        )

    top_videos = await _top_videos(db, account.id, payload)
    goals = await _goal_rows(db, account.id, payload, last)

    accent_hex = (
        payload.accent_color_hex
        if payload.accent_color_hex and _HEX_RE.match(payload.accent_color_hex)
        else _DEFAULT_ACCENT
    )

    data = ReportData(
        agency_name=agency.name if agency else "Crosswave",
        client_name=client.name,
        channel_name=account.display_name or account.external_account_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        generated_at=datetime.now(timezone.utc),
        metric_dates=[m.captured_date for m in metrics],
        metric_followers=[m.followers_count or 0 for m in metrics],
        summary_followers=last.followers_count,
        summary_views=last.views_count,
        growth_pct=growth_pct,
        top_videos=top_videos,
        goals=goals,
        accent_hex=accent_hex,
        agency_logo_url=payload.agency_logo_url,
    )

    pdf_bytes = build_pdf(data)

    # Record the generation (file_url stays NULL — we stream, not store).
    db.add(
        Report(
            client_id=client.id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            file_url=None,
        )
    )
    await db.flush()

    filename = f"crosswave-report-{account.id}-{payload.period_start}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _top_videos(
    db: DbSession, account_id: uuid.UUID, payload: ReportGenerateRequest
) -> list[VideoRow]:
    """Top 10 videos published in the period, ranked by views (desc)."""
    items = list(
        (
            await db.execute(
                select(ContentItem).where(
                    ContentItem.connected_account_id == account_id
                )
            )
        ).scalars()
    )
    in_period = [
        it
        for it in items
        if it.published_at
        and payload.period_start <= it.published_at.date() <= payload.period_end
    ]
    if not in_period:
        return []

    item_ids = [it.id for it in in_period]
    latest: dict[uuid.UUID, ContentMetrics] = {}
    for cm in (
        await db.execute(
            select(ContentMetrics)
            .where(ContentMetrics.content_item_id.in_(item_ids))
            .order_by(ContentMetrics.captured_at.desc())
        )
    ).scalars():
        latest.setdefault(cm.content_item_id, cm)

    rows: list[VideoRow] = []
    for it in in_period:
        m = latest.get(it.id)
        rows.append(
            VideoRow(
                title=it.title or "",
                published_at=it.published_at.date() if it.published_at else None,
                views=m.views if m else None,
                likes=m.likes if m else None,
                comments=m.comments if m else None,
            )
        )
    rows.sort(key=lambda r: r.views if r.views is not None else -1, reverse=True)
    return rows[:10]


async def _goal_rows(
    db: DbSession,
    account_id: uuid.UUID,
    payload: ReportGenerateRequest,
    last_metric: AccountMetricsDaily,
) -> list[GoalRow]:
    """Goals overlapping the period, with actuals from the latest metric."""
    goals_db = list(
        (
            await db.execute(
                select(Goal).where(
                    Goal.connected_account_id == account_id,
                    Goal.period_start <= payload.period_end,
                    Goal.period_end >= payload.period_start,
                )
            )
        ).scalars()
    )

    def actual_for(metric_type: str) -> float | None:
        if metric_type == "followers_count":
            return last_metric.followers_count
        if metric_type == "views_count":
            return last_metric.views_count
        if metric_type == "engagement_rate":
            return (
                float(last_metric.engagement_rate)
                if last_metric.engagement_rate is not None
                else None
            )
        return None

    rows: list[GoalRow] = []
    for goal in goals_db:
        actual = actual_for(goal.metric_type)
        target = float(goal.target_value)
        pct = (actual / target * 100) if (actual is not None and target > 0) else None
        rows.append(
            GoalRow(
                label=_GOAL_LABELS.get(goal.metric_type, goal.metric_type),
                target=target,
                actual=float(actual) if actual is not None else None,
                pct=pct,
            )
        )
    return rows
