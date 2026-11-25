import { createTtlCache } from './ttlCache.js';

const cache = createTtlCache(30_000);

export function getCachedMembership(userId, orgHeader) {
  return cache.get(`${userId}:${orgHeader ?? '*'}`);
}

export function setCachedMembership(userId, orgHeader, membership) {
  cache.set(`${userId}:${orgHeader ?? '*'}`, membership);
}