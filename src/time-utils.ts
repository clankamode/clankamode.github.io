export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
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
    const res = await fetch(`${API}/github/events`, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json() as { events: { type: string; repo: string; message: string; timestamp: string }[] };
    return data.events ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
