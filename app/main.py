"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import engine
from app.scheduler import (
    seed_dev_metrics_if_needed,
    shutdown_scheduler,
    start_scheduler,
)

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Start the nightly-sync scheduler (and dev seed) on startup; clean up on shutdown."""
    try:
        start_scheduler()
        await seed_dev_metrics_if_needed()
    except Exception:  # noqa: BLE001 - never let startup helpers block the app
        logger.exception("Scheduler/seed startup failed")
    yield
    shutdown_scheduler()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Social media growth tracking SaaS — backend API (Sprint 1: YouTube).",
    lifespan=lifespan,
)

# CORS — the frontend is built separately; tighten origins for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": settings.app_name, "version": __version__}
