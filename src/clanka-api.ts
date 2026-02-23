const API_BASE = 'https://clanka-api.clankamode.workers.dev';
const DEFAULT_TTL_MS = 15_000;

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function endpoint(path: string): string {
  return `${API_BASE}${path}`;
}

async function fetchJson(path: string, ttlMs = DEFAULT_TTL_MS): Promise<unknown> {
  const url = endpoint(path);
  const cached = responseCache.get(url);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pending = inFlight.get(url);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    responseCache.set(url, { data, expiresAt: Date.now() + ttlMs });
    return data;
  })();

  inFlight.set(url, request);

  try {
    return await request;
  } finally {
    inFlight.delete(url);
  }
}

export function fetchNow(): Promise<unknown> {
  return fetchJson('/now');
}

export function fetchFleetSummary(): Promise<unknown> {
  return fetchJson('/fleet/summary');
}
