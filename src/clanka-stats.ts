const API_BASE = 'https://clanka-api.clankamode.workers.dev';
const SITE_LAUNCH = new Date('2026-02-19T00:00:00Z');

const API_TIMEOUT_MS = 5000;

interface GithubStats {
  repoCount: number;
  totalStars: number;
  lastPushedAt: string;
  lastPushedRepo: string;
}

interface FleetScore {
  score?: number;
  status?: string;
}

const MIN_VALID_PUSHED_AT_MS = Date.parse('2008-01-01T00:00:00Z');
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function parsePushedAt(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;

  const now = Date.now();
  if (parsed < MIN_VALID_PUSHED_AT_MS || parsed > now + MAX_CLOCK_SKEW_MS) return null;
  return parsed;
}

function relativeTime(then: number): string {
  const diffMs = Date.now() - then;
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
}

function uptimeDays(): number {
  const diffMs = Date.now() - SITE_LAUNCH.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export async function loadLiveStats(): Promise<void> {
  // Always update uptime — no network needed
  setText('stat-uptime', `// ${uptimeDays()}d online`);

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/github/stats`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API ${response.status}`);

    const data = (await response.json()) as GithubStats;

    setText('stat-repos', `${data.repoCount} repos`);
    setText('stat-stars', `${data.totalStars} stars`);
    const pushedAt = parsePushedAt(data.lastPushedAt);
    const pushedRepo = typeof data.lastPushedRepo === 'string' ? data.lastPushedRepo.trim() : '';
    if (pushedAt === null) {
      setText('stat-last-commit', 'last push: unavailable');
    } else if (pushedRepo.length === 0) {
      setText('stat-last-commit', `last push: ${relativeTime(pushedAt)}`);
    } else {
      setText('stat-last-commit', `last push: ${relativeTime(pushedAt)} (${pushedRepo})`);
    }

    const fleetController = new AbortController();
    const fleetTimeoutId = window.setTimeout(() => fleetController.abort(), API_TIMEOUT_MS);
    try {
      const fleetResponse = await fetch(`${API_BASE}/fleet/score`, {
        headers: { Accept: 'application/json' },
        signal: fleetController.signal,
      });

      window.clearTimeout(fleetTimeoutId);

      if (!fleetResponse.ok) throw new Error(`API ${fleetResponse.status}`);

      const fleetData = (await fleetResponse.json()) as FleetScore;
      const score = Number(fleetData.score);
      if (Number.isFinite(score)) {
        setText('stat-fleet-score', `fleet: ${Math.round(score)}%`);
      }
    } catch {
      // Leave existing fallback text as-is — graceful degradation
    } finally {
      window.clearTimeout(fleetTimeoutId);
    }
  } catch {
    // Leave existing fallback text as-is — graceful degradation
  }
}
