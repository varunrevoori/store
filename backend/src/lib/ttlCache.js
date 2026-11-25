/** Tiny in-memory TTL cache (per Node process). */
export function createTtlCache(ttlMs = 60_000) {
  const map = new Map();

  return {
    get(key) {
      const row = map.get(key);
      if (!row) return undefined;
      if (Date.now() > row.expires) {
        map.delete(key);
        return undefined;
      }
      return row.value;
    },
    set(key, value) {
      map.set(key, { value, expires: Date.now() + ttlMs });
    },
    delete(key) {
      map.delete(key);
    },
  };
}