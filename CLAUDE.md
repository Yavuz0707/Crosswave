# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Crosswave is a white-label social-media growth-tracking SaaS for agencies. The
**backend** (`app/`, FastAPI) and **frontend** (`frontend/`, React+Vite+TS) are
independent; the frontend talks to the backend over a REST API. **Sprint 1 ships
YouTube only** (Data API v3, public data, API key — no OAuth), but the data model
is deliberately platform-agnostic.

## Commands

Backend (run from repo root; a `.venv` already exists — Python 3.14, pip + venv, no `uv`):

```bash
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt   # deps (+test deps)
.venv/Scripts/python.exe -m alembic upgrade head                  # apply migrations
.venv/Scripts/uvicorn app.main:app --reload                       # run API (:8000, docs at /docs)
.venv/Scripts/python.exe -m alembic revision --autogenerate -m "msg"  # new migration
```

Tests (require a running local PostgreSQL — see Database notes):

```bash
.venv/Scripts/python.exe -m pytest tests/ -v                      # full suite
.venv/Scripts/python.exe -m pytest tests/test_auth.py::test_login_success   # single test
.venv/Scripts/python.exe -m pytest tests/ --cov=app --cov-report=term-missing
```

Frontend (`cd frontend`):

```bash
npm install
npm run dev        # Vite dev server (:5173)
npm run build      # tsc -b && vite build  (this is the type-check gate)
npm run lint       # eslint
```

CI (`.github/workflows/ci.yml`) runs backend pytest (against a Postgres service) and
`npm run build` on every push/PR.

## Architecture (the parts that span files)

**Platform-agnostic core.** New platforms are rows in `platforms` + records in
`connected_accounts`, never schema changes. `app/services/youtube/` is the only
platform-specific code; adding Instagram/TikTok means adding a sibling service, not
touching models or the API shape. Keep this assumption when extending.

**Multi-tenant isolation is enforced in code, not the DB.** Every request is scoped
to `current_user.agency_id`. The helpers `get_owned_client` / `get_owned_account`
in `app/api/deps.py` are the single choke point — they 404 anything outside the
caller's agency. Any new client/account-scoped endpoint MUST go through them (there
is a regression test for cross-agency access in `tests/test_clients.py`).

**Async DB session lifecycle.** `app/core/database.py` `get_db` yields one
`AsyncSession` per request, commits on success, rolls back on exception. Handlers
therefore use `await db.flush()` (not commit) to populate generated PKs mid-request.

**Sync flow.** `POST /accounts/{id}/sync` → `app/services/youtube/sync.py`
`sync_youtube_account()` pulls channel stats + recent uploads and writes them with
PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` upserts:
`account_metrics_daily` is unique per `(connected_account_id, captured_date)` (one row
per day), and `content_items` is unique per `(connected_account_id, external_content_id)`.
`engagement_rate` is derived from recent videos (likes+comments / views); the public API
gives no `shares`, so it stays NULL.

**Auth.** JWT (`app/core/security.py`, PyJWT + bcrypt). `register` creates an agency +
its first `owner` user and returns a token. Frontend stores the token in
`localStorage` (see the XSS caveat in `frontend/src/api/client.ts`) and attaches it via
an axios interceptor; a 401 fires a `cw:unauthorized` event that drops the session.

**Frontend was ported from a design export.** The source of truth for visual design
(palette, typography, layout) is `tasarım/Agency Dashboard.dc.html` (a static Claude
Design export, branded "Vinea" → renamed "Crosswave"). Reproduce that look; don't
redesign. Design tokens live in `frontend/src/styles/global.css`. Features the Sprint-1
backend can't serve (audience demographics, reports, billing, team) are rendered as
honest "not available yet" empty states — do not fabricate data for them.

## Conventions & gotchas

- **PostgreSQL-specific by design**: `gen_random_uuid()` server defaults and
  `ON CONFLICT` upserts mean tests need a real Postgres — **SQLite will not work**.
- **Tests self-provision their DB**: `tests/conftest.py` creates/rebuilds a separate
  `crosswave_test` database from `DATABASE_URL` and TRUNCATEs between tests. External
  YouTube calls are mocked by patching `get_youtube_client` in **both**
  `app.api.v1.accounts` and `app.services.youtube.sync` (it is imported by name in each).
- **Frontend tsconfig is strict**: `verbatimModuleSyntax` (use `import type` for
  type-only imports) and `noUnusedLocals`/`noUnusedParameters`. `jsx: react-jsx` means
  there is no global `React` — import `type { ReactNode }` rather than writing `React.ReactNode`.
- **Models register via `app/models/__init__.py`**; add new models to its imports so
  Alembic autogenerate and `Base.metadata` see them.
- **Secrets**: `.env` (real keys) is git-ignored; `.env.example` templates are tracked.
  Local dev Postgres is `postgresql+asyncpg://postgres:1234@localhost:5432/crosswave`.

## Out of scope (Sprint 1)

Instagram/TikTok integrations, scheduled auto-sync (APScheduler/Celery), report
generation/storage, billing — build the data model so these slot in later, but don't
implement them yet.
