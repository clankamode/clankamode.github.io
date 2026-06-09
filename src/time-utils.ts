export function relativeTime(iso: string): string {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return 'unknown';

  const ms = Date.now() - parsed;
  if (ms < 0) return ms > -60_000 ? 'just now' : 'in the future';
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

const API = 'https://clanka-api.clankamode.workers.dev';

export async function fetchEvents(): Promise<{ type: string; repo: string; message: string; timestamp: string }[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${API}/github/events`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json() as { events: { type: string; repo: string; message: string; timestamp: string }[] };
    const events = data.events ?? [];
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
