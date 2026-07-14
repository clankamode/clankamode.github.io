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

export type GithubEventsResult =
  | { ok: true; events: GithubEvent[] }
  | { ok: false; reason: 'offline' };

export async function fetchGithubEvents(): Promise<GithubEventsResult> {
  try {
    const data = await fetchJson('/github/events');
    return { ok: true, events: parseGithubEvents(data) };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}

export type NowPayload = {
  current?: string;
  status?: string;
  history?: unknown[];
  team?: Record<string, unknown>;
  tasks?: unknown[];
  agents_active?: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Accept only well-shaped /now payloads so partial garbage never clears live UI. */
export function parseNowPayload(payload: unknown): NowPayload | null {
  if (!isPlainObject(payload)) return null;

  const result: NowPayload = {};

  if ('current' in payload) {
    if (typeof payload.current !== 'string') return null;
    result.current = payload.current;
  }
  if ('status' in payload) {
    if (typeof payload.status !== 'string') return null;
    result.status = payload.status;
  }
  if ('history' in payload) {
    if (!Array.isArray(payload.history)) return null;
    result.history = payload.history;
  }
  if ('team' in payload) {
    if (!isPlainObject(payload.team)) return null;
    result.team = payload.team;
  }
  if ('tasks' in payload) {
    if (!Array.isArray(payload.tasks)) return null;
    result.tasks = payload.tasks;
  }
  if ('agents_active' in payload) {
    if (typeof payload.agents_active !== 'number' || !Number.isFinite(payload.agents_active)) {
      return null;
    }
    result.agents_active = payload.agents_active;
  }

  // Require at least one recognizable field so empty objects don't count as success.
  if (
    result.current === undefined &&
    result.status === undefined &&
    result.history === undefined &&
    result.team === undefined &&
    result.tasks === undefined &&
    result.agents_active === undefined
  ) {
    return null;
  }

  return result;
}

export async function fetchNow(): Promise<NowPayload> {
  const data = await fetchJson('/now');
  const parsed = parseNowPayload(data);
  if (!parsed) {
    throw new Error('Invalid /now payload');
  }
  return parsed;
}

export function fetchGithubStats(): Promise<unknown> {
  return fetchJson('/github/stats');
}

export function fetchFleetSummary(): Promise<unknown> {
  return fetchJson('/fleet/summary');
}
