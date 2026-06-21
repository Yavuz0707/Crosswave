# Crosswave — Social Media Growth Tracking SaaS (Backend)

Agencies and freelancers track multiple client accounts from one panel and generate
automated white-label reports. **Sprint 1** ships the platform-agnostic backend with a
**YouTube-only** integration (YouTube Data API v3, public data, API key — no OAuth).

The data model is platform-agnostic: Instagram / TikTok can later be added through the
same `platforms` + `connected_accounts` structure with no schema changes.

## Tech Stack

- **Backend:** Python 3.12+, FastAPI
- **ORM / Migrations:** SQLAlchemy 2.0 (async) + Alembic
- **Database:** PostgreSQL
- **Auth:** JWT (agency users)
- **HTTP client:** httpx (YouTube Data API v3)

## Quick Start

```bash
# 1. Create & activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env        # then edit DATABASE_URL, JWT_SECRET, YOUTUBE_API_KEY

# 4. Create the database (PostgreSQL must be running)
createdb crosswave

# 5. Apply migrations
alembic upgrade head

# 6. Run the API
uvicorn app.main:app --reload
```

Open the interactive docs at http://localhost:8000/docs

## Project Layout

```
app/
  main.py                  # FastAPI app entrypoint
  core/
    config.py              # settings (pydantic-settings)
    security.py            # JWT + password hashing
    database.py            # async engine + session
  models/                  # SQLAlchemy models
  schemas/                 # Pydantic request/response schemas
  api/
    deps.py                # shared dependencies (auth, db)
    v1/
      auth.py
      clients.py
      accounts.py
      metrics.py
  services/
    youtube/
      client.py            # YouTube Data API v3 wrapper
      sync.py              # synchronization logic
alembic/                   # migration environment
```

## API Overview (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/health` | Health check |
| POST   | `/api/v1/auth/register` | Create agency + first user |
| POST   | `/api/v1/auth/login` | Obtain JWT access token |
| GET    | `/api/v1/auth/me` | Current user |
| GET/POST/PATCH/DELETE | `/api/v1/clients` | Manage clients |
| POST   | `/api/v1/accounts` | Connect a YouTube channel to a client |
| GET    | `/api/v1/accounts` | List connected accounts |
| POST   | `/api/v1/accounts/{id}/sync` | Pull latest stats from YouTube |
| GET    | `/api/v1/accounts/{id}/metrics` | Daily account metrics |
| GET    | `/api/v1/accounts/{id}/content` | Synced content items + latest metrics |

## Frontend

A React + Vite + TypeScript dashboard lives in [frontend/](frontend/), ported from
the approved design and wired to this API. See `frontend/README.md`.

## Testing

Integration tests use a dedicated `crosswave_test` database (created automatically
by `tests/conftest.py`) and mock all YouTube API calls — no network or quota use.

```bash
# install test deps (once)
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt

# run the suite
.\.venv\Scripts\python.exe -m pytest tests/ -v

# with coverage
.\.venv\Scripts\python.exe -m pytest tests/ --cov=app --cov-report=term-missing
```

Covered: auth (register/login/JWT), client CRUD + **multi-tenant isolation**,
account connect/duplicate/delete, and sync writing metrics + content (verified
against the DB).

## Roadmap (out of scope for Sprint 1)

- Instagram / TikTok integrations (data model already prepared)
- Scheduled automatic sync (APScheduler / Celery)
- Report generation & file storage
- Billing / subscriptions
- Frontend (built separately with Claude Design + React)
