# Lon CRM — Salons & Stores

**Stack:** React + TypeScript (`frontend/`) · Express.js + TypeScript (`backend/`).

**UI reference:** `LonSa.html` is read-only prototype (not committed; see `.gitignore`).

## Folder structure

```
frontend/          React + Vite + TypeScript
backend/           Express.js + TypeScript
packages/shared/   Zod types shared by frontend + backend
LonSa.html         Prototype reference (gitignored)
```

## Quick start

```bash
npm install
npm run dev            # backend :8080 + frontend :5173 (no Vite proxy; uses VITE_API_URL)
```

Or run one at a time: `npm run dev:backend`, `npm run dev:frontend`.

**Windows + Downloads folder:** If Vite fails with “Application Control policy has blocked” on Rollup, run `npm install` again (postinstall swaps in WASM Rollup). For a permanent fix, move the project out of `Downloads` (e.g. `C:\dev\stores`).

## Authentication (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Phone** — enable and add SMS (Twilio / MessageBird).
3. Copy **repo root** `.env.example` → `.env` and add Supabase keys (one file; Vite reads it via `envDir`).

**Flow:** email + password on the frontend → Supabase session JWT → Express `auth.getUser(token)` on protected routes.

## Local vs production (URLs — no code changes)

| | **Local** (`npm run dev`) | **Production** (one deployed app) |
|--|---------------------------|-------------------------------------|
| Frontend | `http://localhost:5173` | Your deploy URL (e.g. Vercel) |
| API | `http://localhost:8080` | Same host as the app (`/api/v1/*`) |
| Set in `.env` | `VITE_API_URL=http://localhost:8080`, `WEB_ORIGIN=http://localhost:5173` | **Do not set** `VITE_API_URL` |
| CORS | `WEB_ORIGIN` + any localhost port in dev | Auto from `VERCEL_URL` when `WEB_ORIGIN` unset; optional `WEB_ORIGIN` for custom domain |

You never edit deploy URLs in the repo—only `.env` locally and the host’s environment in production.

Run `npm run check:env` to verify Supabase hosts match (no secrets printed).

## Production — one deployment (frontend + API together)

Express serves `/api/v1/*` and the built React app from `frontend/dist` on the **same URL**.

- **Vercel:** `vercel.json` builds the frontend, rewrites to `api/index.js` (Express).
- **Render / Railway / VPS:** `npm run build` then `npm start` with `NODE_ENV=production`.

### Environment variables (one Vercel project)

Set in **Vercel → Settings → Environment Variables** (Production). Redeploy after changes.

| Variable | Required | Local | Production (unified) |
|----------|----------|-------|----------------------|
| `VITE_SUPABASE_URL` | Yes | `.env` | Host env |
| `VITE_SUPABASE_ANON_KEY` | Yes | `.env` | Host env |
| `SUPABASE_URL` | Yes | Same project URL | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `.env` | Host env |
| `VITE_SKIP_AUTH` / `SKIP_AUTH` | Yes | `false` | `false` |
| `VITE_API_URL` | Local only | `http://localhost:8080` | **Leave unset** |
| `WEB_ORIGIN` | Local | `http://localhost:5173` | Optional (auto on Vercel) |
| `DEFAULT_VERTICAL` | Optional | `salon` | `salon` |

**Production example (no public URLs — only Supabase + flags):**

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SKIP_AUTH=false
SKIP_AUTH=false
```

Vercel build: root `.`, repo `vercel.json` (`npm install`, `npm run build`, rewrite → `/api`).

### Render / Railway (same repo, one web service)

| Setting | Value |
|---------|--------|
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Env | Same table as above + `NODE_ENV=production` |

### Checklist

1. All secrets on **one** service (Vercel or Render), not split across two hosts.
2. Redeploy after env changes (frontend env vars need a new build).
3. Visit `/health` → `{ "ok": true }`. Visit `/login` → sign in should hit `/api/v1/tenant/bootstrap` on the **same domain**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:frontend` | Vite dev server |
| `npm run dev:backend` | Express with `tsx watch` |
| `npm run typecheck` | TypeScript check both packages |
| `npm run build` | Build backend + frontend |