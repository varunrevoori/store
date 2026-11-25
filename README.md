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

## Deploy frontend (Vercel)

This repo is an **npm workspaces** monorepo; the Vite app lives in `frontend/` but install/build must run from the **repository root** (for `@lon-crm/shared`).

1. **Project → Settings → General → Root Directory:** leave empty (`.` / repo root), not `frontend`.
2. **Project → Settings → Build & Development:** clear any custom **Install Command** (remove `npm install --prefix=..`). Use defaults or the `vercel.json` in this repo (`npm install`, `npm run build`, output `frontend/dist`).
3. **Environment variables:** set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` (your hosted API URL).

Redeploy after changing Root Directory or install settings.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:frontend` | Vite dev server |
| `npm run dev:backend` | Express with `tsx watch` |
| `npm run typecheck` | TypeScript check both packages |
| `npm run build` | Build backend + frontend |