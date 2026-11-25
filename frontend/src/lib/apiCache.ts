const TTL_MS = 20_000;

type Entry = { expires: number; body: unknown };

const cache = new Map<string, Entry>();
const inFlight = new Map<string, Promise<Response>>();

function cacheKey(url: string) {
  return url;
}

export async function cachedGet(url: string, fetcher: () => Promise<Response>): Promise<Response> {
  const key = cacheKey(url);
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires) {
    return new Response(JSON.stringify(hit.body), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const pending = inFlight.get(key);
  if (pending) return pending.then((r) => r.clone());

  const promise = fetcher().then(async (res) => {
    inFlight.delete(key);
    if (res.ok) {
      const body = await res.clone().json();
      cache.set(key, { expires: Date.now() + TTL_MS, body });
    }
    return res;
  });
  inFlight.set(key, promise);
  return promise;
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(prefix)) cache.delete(key);
  }
}

const BOOTSTRAP_KEY = 'lon_bootstrap_v1';
const BOOTSTRAP_TTL = 120_000;

export function readBootstrapCache(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(BOOTSTRAP_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: Record<string, unknown> };
    if (Date.now() - at > BOOTSTRAP_TTL) {
      sessionStorage.removeItem(BOOTSTRAP_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeBootstrapCache(data: Record<string, unknown>) {
  sessionStorage.setItem(BOOTSTRAP_KEY, JSON.stringify({ at: Date.now(), data }));
}

export function clearBootstrapCache() {
  sessionStorage.removeItem(BOOTSTRAP_KEY);
}