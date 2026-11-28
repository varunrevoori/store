/** Local dev defaults — override only via `.env`, not in application code. */
export const LOCAL_API_BASE = 'http://localhost:8080';
export const LOCAL_WEB_ORIGIN = 'http://localhost:5173';

export function trimTrailingSlash(value) {
  if (value == null || value === '') return '';
  return String(value).trim().replace(/\/$/, '');
}

/**
 * Express CORS allow-list from environment.
 * Production (Vercel): adds https://$VERCEL_URL when WEB_ORIGIN is unset.
 */
export function resolveWebOrigins(env = {}) {
  const explicit = String(env.WEB_ORIGIN ?? '')
    .split(',')
    .map((s) => trimTrailingSlash(s))
    .filter(Boolean);

  const auto = [];
  const onVercel = env.VERCEL === '1' || env.VERCEL === 'true' || Boolean(env.VERCEL);
  if (onVercel) {
    if (env.VERCEL_URL) auto.push(`https://${env.VERCEL_URL}`);
    if (env.VERCEL_BRANCH_URL) auto.push(`https://${env.VERCEL_BRANCH_URL}`);
    const prod = trimTrailingSlash(env.VERCEL_PROJECT_PRODUCTION_URL);
    if (prod) auto.push(prod);
  }

  const merged = [...explicit, ...auto].filter(Boolean);
  if (merged.length === 0) merged.push(LOCAL_WEB_ORIGIN);
  return [...new Set(merged)];
}

/**
 * Browser API base URL.
 * | Mode | VITE_API_URL | Result |
 * |------|----------------|--------|
 * | Local dev | `http://localhost:8080` (from .env) | env value |
 * | Local dev | unset | `http://localhost:8080` |
 * | Production unified | unset | current page origin (same host as API) |
 * | Split hosts | full API URL | env value |
 */
export function resolveApiBase({ apiUrlFromEnv, isDev, browserOrigin }) {
  const fromEnv = trimTrailingSlash(apiUrlFromEnv);
  if (fromEnv) return fromEnv;
  if (isDev) return LOCAL_API_BASE;
  const origin = trimTrailingSlash(browserOrigin);
  if (origin) return origin;
  return LOCAL_API_BASE;
}

export function deploymentLabel(env = {}) {
  if (env.VERCEL === '1' || env.VERCEL === 'true' || env.VERCEL) return 'vercel';
  if (env.NODE_ENV === 'production') return 'production';
  return 'local';
}