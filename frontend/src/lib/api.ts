import { API_PREFIX, resolveApiBase } from '@lon-crm/shared';
import { cachedGet, invalidateApiCache } from './apiCache';
import { supabase } from './supabase';
import { getStoredBranchId, getStoredOrgSlug } from './tenantStorage';

function computeApiBase(): string {
  const browserOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
  return resolveApiBase({
    apiUrlFromEnv: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
    browserOrigin,
  });
}

const API_BASE = computeApiBase();

let readAccessToken: (() => string | null | undefined) | null = null;

/** Lets API calls use the React session token (avoids getSession() races right after login). */
export function registerApiAccessToken(reader: () => string | null | undefined) {
  readAccessToken = reader;
}

async function resolveAccessToken(): Promise<string | null> {
  const fromCtx = readAccessToken?.() ?? null;
  if (fromCtx) return fromCtx;
  if (!supabase) return null;
  const { data: refreshed } = await supabase.auth.getSession();
  if (refreshed.session?.access_token) return refreshed.session.access_token;
  const { data: userData } = await supabase.auth.getUser();
  return userData.user ? (await supabase.auth.getSession()).data.session?.access_token ?? null : null;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  const adminRoute = /\/admin(\/|$)/.test(input);
  const bootstrapRoute = /\/tenant\/bootstrap/.test(input);
  const orgSlug = getStoredOrgSlug();
  if (!adminRoute && !bootstrapRoute && orgSlug) headers.set('X-Org-Id', orgSlug);
  const branchId = getStoredBranchId();
  if (!adminRoute && branchId) headers.set('X-Branch-Id', branchId);
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    headers.set('X-Dev-Role', 'manager');
  }

  const token = await resolveAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const path = input.startsWith(API_PREFIX)
    ? input
    : `${API_PREFIX}${input.startsWith('/') ? input : `/${input}`}`;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const isGet = (init.method ?? 'GET').toUpperCase() === 'GET';
  const useCache =
    isGet && !adminRoute && !path.includes('/auth/') && !path.includes('/tenant/bootstrap');

  if (useCache) {
    return cachedGet(url, () => fetch(url, { ...init, headers, credentials: 'include', mode: 'cors' }));
  }
  return fetch(url, { ...init, headers, credentials: 'include', mode: 'cors' });
}

/** Avoid infinite spinners when the API is down or VITE_API_URL points at localhost. */
export async function apiFetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const ext = init.signal;
  if (ext) {
    ext.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  try {
    return await apiFetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export { invalidateApiCache };