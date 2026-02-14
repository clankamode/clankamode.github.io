interface SanitizeIntentOptions {
  fallback?: string;
  title?: string | null;
  maxChars?: number;
  minChars?: number;
}

function capitalize(text: string): string {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

function trimToWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace < Math.floor(maxChars * 0.6)) return sliced;
  return sliced.slice(0, lastSpace).trimEnd();
}

function normalizeIntentCore(text: string, title?: string | null): string {
  let normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return normalized;

  const escapedTitle = title?.trim()
    ? title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : null;

  if (escapedTitle) {
    const titledTaskPrefix = new RegExp(
      `^(?:read|solve|review|learn|study|complete|work through)\\s+${escapedTitle}\\s+because\\s+`,
      'i'
    );
    normalized = normalized.replace(titledTaskPrefix, '');
  }

  normalized = normalized
    .replace(/^(?:read|solve|review|learn|study|complete|work through)\s+.+?\s+because\s+/i, '')
    .replace(/^this\s+/i, '')
    .replace(/^reinforces\b/i, 'Reinforce')
    .replace(/^builds\b/i, 'Build')
    .replace(/^makes\b/i, 'Make')
    .replace(/^connects\b/i, 'Connect')
    .replace(/^reveals\b/i, 'See')
    .replace(/^breaks\b/i, 'Challenge')
    .replace(/\s+/g, ' ')
    .trim();

  return capitalize(normalized);
}

export function sanitizeIntentText(input: string | null | undefined, options: SanitizeIntentOptions = {}): string {
  const fallback = options.fallback || 'Continue with your next concept.';
  const maxChars = options.maxChars ?? 140;
  const minChars = options.minChars ?? 24;
  const source = (input || '').trim();
  const base = source || fallback;

  let cleaned = normalizeIntentCore(base, options.title);
  if (cleaned.length < minChars && source) {
    cleaned = normalizeIntentCore(fallback, options.title);
  }

  cleaned = trimToWordBoundary(cleaned, maxChars).replace(/[;,:\-–—\s]+$/g, '').trim();
  if (!/[.!?]$/.test(cleaned)) {
    cleaned = `${cleaned}.`;
  }

  if (cleaned.length < minChars) {
    const fallbackClean = normalizeIntentCore(fallback, options.title);
    const fallbackTrimmed = trimToWordBoundary(fallbackClean, maxChars).replace(/[;,:\-–—\s]+$/g, '').trim();
    return /[.!?]$/.test(fallbackTrimmed) ? fallbackTrimmed : `${fallbackTrimmed}.`;
  }

  return cleaned;
}
