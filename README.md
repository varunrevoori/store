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
3. Copy keys into `.env` (see `.env.example`):
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `frontend/.env`)
   - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (in root `.env` or `backend/.env`)

**Flow:** frontend `signInWithOtp` / `verifyOtp` → session JWT → Express validates with `auth.getUser(token)` on protected routes.

**CORS:** Frontend calls `VITE_API_URL` directly. Backend allows `WEB_ORIGIN` plus any `localhost` port in development. Set `WEB_ORIGIN` if you use a fixed production URL.

Dev OTP **`482619`** is no longer used; OTP comes from Supabase/SMS.

## Production — one deployment (frontend + API together)

The repo supports a **single host**: Express serves `/api/v1/*` and the built React app from `frontend/dist` on the **same URL** (e.g. [store-jet-sigma.vercel.app](https://store-jet-sigma.vercel.app)).

- **Vercel:** `vercel.json` builds the frontend, then routes all traffic to `api/index.js` (Express).
- **Render / Railway / VPS:** `npm run build` then `npm start` with `NODE_ENV=production` (serves `frontend/dist` when present).

Locally you still use two ports (`npm run dev` → Vite `:5173` + API `:8080`). In production the browser can use **same-origin** API calls (`VITE_API_URL` is optional).

### Environment variables (one Vercel project)

Set in **Vercel → Settings → Environment Variables** (Production). Redeploy after changes.

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Yes | Build + runtime; Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Build time; anon key only |
| `SUPABASE_URL` | Yes | Runtime (API); same URL as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Runtime (API); **never** expose to browser |
| `VITE_SKIP_AUTH` | Yes | `false` in production |
| `SKIP_AUTH` | Yes | `false` in production |
| `WEB_ORIGIN` | Recommended | `https://store-jet-sigma.vercel.app` (CORS if you ever split hosts) |
| `VITE_API_URL` | **Optional** | Leave empty on unified deploy — app uses `window.location.origin` |
| `DEFAULT_VERTICAL` | Optional | `salon` |

**Example (unified Vercel):**

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEB_ORIGIN=https://store-jet-sigma.vercel.app
VITE_SKIP_AUTH=false
SKIP_AUTH=false
```

Vercel build: root directory `.`, use repo `vercel.json` (`npm install`, `npm run build`, rewrite → `/api`).

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