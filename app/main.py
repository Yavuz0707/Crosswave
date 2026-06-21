"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: dispose the DB engine on shutdown."""
    yield
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
