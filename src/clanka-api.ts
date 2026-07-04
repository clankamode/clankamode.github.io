const API_BASE = 'https://clanka-api.clankamode.workers.dev';
const DEFAULT_TTL_MS = 15_000;
const FETCH_TIMEOUT_MS = 5_000;

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
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      if (!response.ok) {
        throw new Error(`API ${response.status}`);
      }

      const data = await response.json();
      responseCache.set(url, { data, expiresAt: Date.now() + ttlMs });
      return data;
    } finally {
      clearTimeout(timer);
    }
  })();

  inFlight.set(url, request);

  try {
    return await request;
  } finally {
    inFlight.delete(url);
  }
}

export type GithubEvent = {
  type: string;
  repo: string;
  message: string;
  timestamp: string;
};

function isGithubEvent(value: unknown): value is GithubEvent {
  if (!value || typeof value !== 'object') return false;

  const event = value as Partial<GithubEvent>;
  return (
    typeof event.type === 'string' &&
    typeof event.repo === 'string' &&
    typeof event.message === 'string' &&
    typeof event.timestamp === 'string'
  );
}

/** Accepts both `{ events: [...] }` and bare array payloads from clanka-api. */
export function parseGithubEvents(payload: unknown): GithubEvent[] {
  if (Array.isArray(payload)) {
    return payload.filter(isGithubEvent);
  }

  if (payload && typeof payload === 'object' && 'events' in payload) {
    const events = (payload as { events: unknown }).events;
    return Array.isArray(events) ? events.filter(isGithubEvent) : [];
  }

  return [];
}

export async function fetchGithubEvents(): Promise<GithubEvent[]> {
  try {
    const data = await fetchJson('/github/events');
    return parseGithubEvents(data);
  } catch {
    return [];
  }
}

export function fetchNow(): Promise<unknown> {
  return fetchJson('/now');
}

export function fetchGithubStats(): Promise<unknown> {
  return fetchJson('/github/stats');
}

export function fetchFleetSummary(): Promise<unknown> {
  return fetchJson('/fleet/summary');
}
