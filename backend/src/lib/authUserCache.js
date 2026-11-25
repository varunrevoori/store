import { createTtlCache } from './ttlCache.js';

/** Avoid calling Supabase auth.getUser on every parallel API request. */
const cache = createTtlCache(60_000);

export function getCachedAuthUser(token) {
  return cache.get(token);
}

export function setCachedAuthUser(token, user) {
  cache.set(token, user);
}