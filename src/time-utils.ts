import { fetchGithubEvents, type GithubEventsResult } from './clanka-api';

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

/** Normalize live API short types and *Event names for terminal/activity tags. */
export function normalizeEventType(type: string): string {
  const raw = type.trim();
  if (!raw) return 'push';

  const upper = raw.toUpperCase();
  if (upper === 'PR' || upper === 'PULL_REQUEST' || upper === 'PULLREQUESTEVENT') return 'pr';
  if (upper === 'CREATE' || upper === 'CREATEEVENT') return 'create';
  if (upper === 'PUSH' || upper === 'PUSHEVENT') return 'push';

  return raw.replace(/Event$/i, '').toLowerCase() || 'push';
}

/** Blank event messages should not render as empty quotes. */
export function displayEventMessage(message: string): string {
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : '—';
}

export async function fetchEvents(): Promise<GithubEventsResult> {
  return fetchGithubEvents();
}
