const API_BASE = 'https://clanka-api.clankamode.workers.dev';
const SITE_LAUNCH = new Date('2026-02-19T00:00:00Z');

interface GithubStats {
  repoCount: number;
  totalStars: number;
  lastPushedAt: string;
  lastPushedRepo: string;
}

function relativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
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
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/github/stats`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API ${response.status}`);

    const data = (await response.json()) as GithubStats;

    setText('stat-repos', `${data.repoCount} repos`);
    setText('stat-stars', `${data.totalStars} stars`);
    setText(
      'stat-last-commit',
      `last push: ${relativeTime(data.lastPushedAt)} (${data.lastPushedRepo})`,
    );
  } catch {
    // Leave existing fallback text as-is — graceful degradation
  }
}
