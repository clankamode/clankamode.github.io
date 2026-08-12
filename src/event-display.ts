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
