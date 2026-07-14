import { fetchFleetSummary, fetchGithubStats } from './clanka-api';
import { withRetries } from './retry';

const SITE_LAUNCH = new Date('2026-02-19T00:00:00Z');

interface GithubStats {
  repoCount: number;
  totalStars: number;
  lastPushedAt: string;
  lastPushedRepo: string;
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
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function resolveFleetTotal(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;

  const root = data as Record<string, unknown>;
  const candidates: unknown[] = [root.totalRepos];

  if (root.summary && typeof root.summary === 'object') {
    candidates.push((root.summary as Record<string, unknown>).totalRepos);
  }

  if (Array.isArray(root.repos)) candidates.push(root.repos.length);
  if (Array.isArray(root.fleet)) candidates.push(root.fleet.length);

  if (root.summary && typeof root.summary === 'object') {
    const summary = root.summary as Record<string, unknown>;
    if (Array.isArray(summary.repos)) candidates.push(summary.repos.length);
    if (Array.isArray(summary.fleet)) candidates.push(summary.fleet.length);
  }

  for (const candidate of candidates) {
    const total = Number(candidate);
    if (Number.isFinite(total) && total >= 0) return total;
  }

  return null;
}

export async function loadLiveStats(): Promise<void> {
  setText('stat-uptime', `// ${uptimeDays()}d online`);

  try {
    const data = (await withRetries(() => fetchGithubStats())) as GithubStats;

    const repoCount = Number(data.repoCount);
    if (Number.isFinite(repoCount)) {
      setText('stat-repos', `${repoCount} repos`);
    }

    const totalStars = Number(data.totalStars);
    if (Number.isFinite(totalStars)) {
      setText('stat-stars', `${totalStars} stars`);
    }

    const pushedAt = parsePushedAt(data.lastPushedAt);
    const pushedRepo = typeof data.lastPushedRepo === 'string' ? data.lastPushedRepo.trim() : '';
    if (pushedAt === null) {
      setText('stat-last-commit', 'last push: unavailable');
    } else if (pushedRepo.length === 0) {
      setText('stat-last-commit', `last push: ${relativeTime(pushedAt)}`);
    } else {
      setText('stat-last-commit', `last push: ${relativeTime(pushedAt)} (${pushedRepo})`);
    }

    try {
      const fleetData = await withRetries(() => fetchFleetSummary());
      const total = resolveFleetTotal(fleetData);
      if (total !== null) {
        setText('stat-fleet-score', `fleet: ${total} repos`);
      } else {
        setText('stat-fleet-score', 'fleet: unavailable');
      }
    } catch {
      // Leave existing fallback text as-is — graceful degradation
    }
  } catch {
    // Leave existing fallback text as-is — graceful degradation
  }
}
