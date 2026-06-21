"""Shared pytest fixtures: test database, HTTP client, and YouTube mocking.

A dedicated ``crosswave_test`` database is created (next to the real one) and
fully rebuilt once per session, then truncated between tests for isolation.
External YouTube calls are replaced with an in-memory fake so tests never hit
the network or consume API quota.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models import Base
from app.services.youtube.client import YouTubeChannel, YouTubeVideo

# ---------------------------------------------------------------------------
# Database URLs derived from the configured DATABASE_URL.
# ---------------------------------------------------------------------------
_BASE_URL = make_url(settings.database_url)
TEST_DB_NAME = "crosswave_test"
TEST_URL = _BASE_URL.set(database=TEST_DB_NAME)
ADMIN_URL = _BASE_URL.set(database="postgres")

# Every table except ``platforms`` (its seed row must survive between tests).
DATA_TABLES = [
    "content_metrics",
    "content_items",
    "account_metrics_daily",
    "goals",
    "reports",
    "connected_accounts",
    "clients",
    "users",
    "agencies",
]


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def _prepare_database() -> AsyncIterator[None]:
    """Create the test database (if needed) and (re)build a clean schema."""
    admin_engine = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    async with admin_engine.connect() as conn:
        exists = await conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": TEST_DB_NAME},
        )
        if not exists:
            await conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    await admin_engine.dispose()

    engine = create_async_engine(TEST_URL)
    async with engine.begin() as conn:
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("INSERT INTO platforms (name) VALUES ('youtube') ON CONFLICT (name) DO NOTHING")
        )
    await engine.dispose()
    yield


@pytest_asyncio.fixture
async def engine(_prepare_database: None) -> AsyncIterator[AsyncEngine]:
    """Function-scoped engine; truncates data tables before each test."""
    eng = create_async_engine(TEST_URL)
    async with eng.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE "
                + ", ".join(DATA_TABLES)
                + " RESTART IDENTITY CASCADE"
            )
        )
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """A session for direct DB assertions inside tests."""
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(engine: AsyncEngine) -> AsyncIterator[AsyncClient]:
    """HTTP client wired to the app with ``get_db`` overridden to the test DB."""
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
RegisterFn = Callable[..., Awaitable[dict[str, str]]]


@pytest.fixture
def register(client: AsyncClient) -> RegisterFn:
    """Return a helper that registers a user and yields auth headers."""

    async def _register(
        email: str = "owner@agency.co",
        password: str = "password123",
        agency: str = "Atlas Social",
    ) -> dict[str, str]:
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password, "agency_name": agency},
        )
        assert resp.status_code == 201, resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return _register


@pytest_asyncio.fixture
async def auth_headers(register: RegisterFn) -> dict[str, str]:
    """Auth headers for a default registered user."""
    return await register()


# ---------------------------------------------------------------------------
# YouTube API mock
# ---------------------------------------------------------------------------
FAKE_CHANNEL = YouTubeChannel(
    channel_id="UCtest00000000000000001",
    title="Aurora Studio",
    subscriber_count=1_240_000,
    view_count=48_200_000,
    video_count=2,
    uploads_playlist_id="UUtest00000000000000001",
    hidden_subscriber_count=False,
)

FAKE_VIDEOS = [
    YouTubeVideo(
        video_id="vid_0001",
        title="How we grew to 1M subscribers",
        published_at=datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc),
        thumbnail_url="https://img.example/1.jpg",
        view_count=482_000,
        like_count=31_200,
        comment_count=1_800,
    ),
    YouTubeVideo(
        video_id="vid_0002",
        title="The studio setup tour 2026",
        published_at=datetime(2026, 6, 9, 12, 0, tzinfo=timezone.utc),
        thumbnail_url="https://img.example/2.jpg",
        view_count=126_000,
        like_count=9_400,
        comment_count=612,
    ),
]


class FakeYouTubeClient:
    """Drop-in replacement for ``YouTubeClient`` used in tests."""

    async def __aenter__(self) -> "FakeYouTubeClient":
        return self

    async def __aexit__(self, *exc: object) -> None:
        return None

    async def aclose(self) -> None:
        return None

    async def resolve_channel(self, raw: str) -> YouTubeChannel | None:
        if raw == "__missing__":
            return None
        return FAKE_CHANNEL

    async def get_channel(
        self,
        *,
        channel_id: str | None = None,
        handle: str | None = None,
        username: str | None = None,
    ) -> YouTubeChannel | None:
        return FAKE_CHANNEL

    async def get_recent_videos(
        self, uploads_playlist_id: str, max_results: int = 10
    ) -> list[YouTubeVideo]:
        return FAKE_VIDEOS


@pytest.fixture
def mock_youtube(monkeypatch: pytest.MonkeyPatch) -> type[FakeYouTubeClient]:
    """Patch the YouTube client factory in both call sites."""

    def factory() -> FakeYouTubeClient:
        return FakeYouTubeClient()

    monkeypatch.setattr("app.api.v1.accounts.get_youtube_client", factory)
    monkeypatch.setattr("app.services.youtube.sync.get_youtube_client", factory)
    return FakeYouTubeClient
