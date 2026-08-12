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

function invalidateEndpoint(path: string): void {
  responseCache.delete(endpoint(path));
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

/** True when the payload is a recognized events envelope (including empty). */
export function isGithubEventsPayload(payload: unknown): boolean {
  if (Array.isArray(payload)) return true;
  if (!isPlainObject(payload)) return false;
  return Array.isArray(payload.events);
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
    if (!isGithubEventsPayload(data)) {
      // Don't TTL-cache error objects as a successful empty feed.
      invalidateEndpoint('/github/events');
      return { ok: false, reason: 'offline' };
    }
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

/** Accept well-shaped /now payloads. Invalid optional fields are stripped, not fatal. */
export function parseNowPayload(payload: unknown): NowPayload | null {
  if (!isPlainObject(payload)) return null;

  const result: NowPayload = {};

  if ('current' in payload && typeof payload.current === 'string') {
    const current = payload.current.trim();
    // Blank strings are not presence signal — treat as omitted.
    if (current.length > 0) result.current = current;
  }
  if ('status' in payload && typeof payload.status === 'string') {
    const status = payload.status.trim();
    if (status.length > 0) result.status = status;
  }
  if ('history' in payload && Array.isArray(payload.history)) {
    result.history = payload.history;
  }
  if ('team' in payload && isPlainObject(payload.team)) {
    result.team = payload.team;
  }
  if ('tasks' in payload && Array.isArray(payload.tasks)) {
    result.tasks = payload.tasks;
  }
  if ('agents_active' in payload) {
    const raw = payload.agents_active;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      result.agents_active = Math.floor(raw);
    } else if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        result.agents_active = Math.floor(parsed);
      }
    }
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
    // Don't keep a rejected shape in the shared TTL cache.
    invalidateEndpoint('/now');
    throw new Error('Invalid /now payload');
  }
  return parsed;
}

/** True when the payload has at least one well-typed stats field (zeros allowed). */
export function isGithubStatsPayload(payload: unknown): boolean {
  if (!isPlainObject(payload)) return false;

  let recognized = false;

  if ('repoCount' in payload) {
    if (typeof payload.repoCount !== 'number' || !Number.isFinite(payload.repoCount) || payload.repoCount < 0) {
      return false;
    }
    recognized = true;
  }
  if ('totalStars' in payload) {
    if (typeof payload.totalStars !== 'number' || !Number.isFinite(payload.totalStars) || payload.totalStars < 0) {
      return false;
    }
    recognized = true;
  }
  if ('lastPushedAt' in payload) {
    if (typeof payload.lastPushedAt !== 'string') return false;
    recognized = true;
  }
  if ('lastPushedRepo' in payload) {
    if (typeof payload.lastPushedRepo !== 'string') return false;
    recognized = true;
  }

  return recognized;
}

export async function fetchGithubStats(): Promise<unknown> {
  const data = await fetchJson('/github/stats');
  if (!isGithubStatsPayload(data)) {
    // Don't TTL-cache `{ error: '…' }` / `{}` as a successful stats response.
    invalidateEndpoint('/github/stats');
    throw new Error('Invalid /github/stats payload');
  }
  return data;
}

/** True when the payload is a recognized fleet summary envelope (including empty). */
export function isFleetSummaryPayload(payload: unknown): boolean {
  if (Array.isArray(payload)) return true;
  if (!isPlainObject(payload)) return false;

  if (Array.isArray(payload.repos) || Array.isArray(payload.fleet)) return true;

  if (isPlainObject(payload.summary)) {
    const summary = payload.summary;
    if (Array.isArray(summary.repos) || Array.isArray(summary.fleet)) return true;
  }

  return false;
}

export async function fetchFleetSummary(): Promise<unknown> {
  const data = await fetchJson('/fleet/summary');
  if (!isFleetSummaryPayload(data)) {
    // Don't TTL-cache `{ message: '…' }` as a successful empty registry.
    invalidateEndpoint('/fleet/summary');
    throw new Error('Invalid /fleet/summary payload');
  }
  return data;
}
