import { fetchGithubEvents, type GithubEvent } from './clanka-api';

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

export async function fetchEvents(): Promise<GithubEvent[]> {
  return fetchGithubEvents();
}
