import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_PREFIX } from '@lon-crm/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
export const FRONTEND_DIST = path.join(repoRoot, 'frontend', 'dist');

export function shouldServeFrontend() {
  if (process.env.SERVE_FRONTEND === '1' || process.env.SERVE_FRONTEND === 'true') return true;
  if (process.env.VERCEL === '1' || process.env.VERCEL) return true;
  if (process.env.NODE_ENV === 'production' && existsSync(FRONTEND_DIST)) return true;
  return false;
}

/** Serve Vite build + SPA fallback (register after API routes). */
export function attachFrontendDist(app) {
  if (!existsSync(FRONTEND_DIST)) {
    console.warn(
      `[serveFrontend] ${FRONTEND_DIST} not found — run: npm run build -w @lon-crm/frontend`,
    );
    return;
  }

  app.use(
    express.static(FRONTEND_DIST, {
      index: false,
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    }),
  );

  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith(API_PREFIX) || req.path === '/health') return next();
    const indexHtml = path.join(FRONTEND_DIST, 'index.html');
    if (!existsSync(indexHtml)) return next();
    res.sendFile(indexHtml);
  });

  console.log(`[serveFrontend] static + SPA from ${FRONTEND_DIST}`);
}