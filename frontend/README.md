# Crosswave — Frontend

React + TypeScript + Vite dashboard for the Crosswave agency analytics backend.
The visual design is ported from the approved Claude Design ("Vinea") export and
wired to the FastAPI REST API.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the API isn't on localhost:8000
npm run dev            # http://localhost:5173
```

The backend must be running (default `http://localhost:8000/api/v1`). See the
repository root README for backend setup.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Structure

```
src/
  api/            # axios client + typed endpoint wrappers (auth, clients, accounts, metrics)
  auth/           # AuthContext (JWT) + ProtectedRoute
  components/     # shared UI + dashboard widgets (Sidebar, StatCard, GrowthChart, ...)
  lib/            # formatting helpers + useCountUp animation hook
  pages/          # Login, Signup, Dashboard, Settings
  styles/         # global.css (design tokens ported from the design export)
```

## Notes

- **Auth token** is stored in `localStorage` for MVP convenience. It is XSS-exposed;
  production should switch to an httpOnly cookie issued by the backend (see
  `src/api/client.ts`).
- **YouTube-only**: Audience demographics and report generation are shown as
  honest "not available yet" empty states because the public YouTube Data API /
  Sprint 1 backend don't provide them. Instagram/TikTok are intentionally absent.
- **Animations** (Framer Motion): route transitions, stat count-up, chart
  draw-in, hover lift, sync spinner, toast, and skeleton shimmer.
