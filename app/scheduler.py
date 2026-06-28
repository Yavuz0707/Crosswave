"""Background scheduling: nightly auto-sync of all active accounts.

Wired into the FastAPI lifespan in ``app/main.py`` (not via ``@app.on_event``,
which Starlette ignores when a lifespan handler is present).
"""

from __future__ import annotations

import logging
import random
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.account_metrics_daily import AccountMetricsDaily
from app.models.connected_account import ConnectedAccount
from app.services.youtube.sync import sync_youtube_account

logger = logging.getLogger("app.scheduler")

scheduler = AsyncIOScheduler()


async def run_active_sync(db: AsyncSession) -> dict[str, int]:
    """Sync every ``status='active'`` account using the given session.

    Each account is committed independently so one failure does not lose the
    others. Returns ``{"synced": n, "failed": m}``.
    """
    accounts = list(
        (
            await db.execute(
                select(ConnectedAccount).where(ConnectedAccount.status == "active")
            )
        ).scalars()
    )
    logger.info("Scheduled sync: %d active account(s)", len(accounts))

    synced = 0
    failed = 0
    for account in accounts:
        try:
            await sync_youtube_account(db, account)
            await db.commit()
            synced += 1
            logger.info("Sync OK: %s (%s)", account.id, account.display_name)
        except Exception as exc:  # noqa: BLE001 - keep going on per-account errors
            await db.rollback()
            failed += 1
            logger.error("Sync FAILED: %s — %s", account.id, exc)
    return {"synced": synced, "failed": failed}


async def nightly_sync_job() -> None:
    """Cron entrypoint: opens its own session and syncs active accounts."""
    logger.info("Nightly sync started")
    async with SessionLocal() as db:
        result = await run_active_sync(db)
    logger.info(
        "Nightly sync finished: %d synced, %d failed",
        result["synced"],
        result["failed"],
    )


def start_scheduler() -> None:
    """Register jobs and start the scheduler (call inside a running loop)."""
    scheduler.add_job(
        nightly_sync_job,
        CronTrigger(hour=2, minute=0),  # every night at 02:00 (local time)
        id="nightly_sync",
        replace_existing=True,
    )
    if not scheduler.running:
        scheduler.start()
    logger.info("APScheduler başlatıldı — nightly sync: 02:00")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler durduruldu")


async def seed_dev_metrics_if_needed() -> None:
    """Dev-only: backfill 30 days of realistic metrics so charts aren't empty.

    Runs only when ``APP_ENV=development`` and there is little/no metric history.
    Uses ON CONFLICT DO NOTHING, so existing rows are never overwritten.
    """
    if settings.app_env.lower() != "development":
        return
    async with SessionLocal() as db:
        accounts = list((await db.execute(select(ConnectedAccount))).scalars())
        if not accounts:
            return

        # Charts are per-account, so gate per-account: only backfill an account
        # that has fewer than 2 of its own data points. ON CONFLICT DO NOTHING
        # keeps any real rows already captured for a date.
        seeded = 0
        for account in accounts:
            own_rows = await db.scalar(
                select(func.count())
                .select_from(AccountMetricsDaily)
                .where(AccountMetricsDaily.connected_account_id == account.id)
            )
            if own_rows and own_rows >= 2:
                continue

            followers = random.randint(50_000, 800_000)
            views = followers * random.randint(25, 45)
            rows = []
            for i in range(30):
                captured = date.today() - timedelta(days=29 - i)
                followers += random.randint(300, 2_500)
                views += random.randint(20_000, 120_000)
                rows.append(
                    {
                        "connected_account_id": account.id,
                        "captured_date": captured,
                        "followers_count": followers,
                        "views_count": views,
                        "engagement_rate": round(random.uniform(2.5, 6.5), 2),
                    }
                )
            stmt = pg_insert(AccountMetricsDaily).values(rows).on_conflict_do_nothing(
                constraint="uq_account_metrics_daily_account_date"
            )
            await db.execute(stmt)
            seeded += 1

        if seeded:
            await db.commit()
            logger.info("Dev metric seed: %d hesap dolduruldu", seeded)
