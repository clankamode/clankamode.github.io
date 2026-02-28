import { sanitizeIntentText } from '@/lib/intent-display';
import type { SessionIntent } from '@/lib/progress';
import { VALID_INTENT_TYPES } from '@/lib/session-llm-planner/types';

export function normalizeIntentType(
  value: SessionIntent['type'] | undefined,
  fallback: SessionIntent['type']
): SessionIntent['type'] {
  if (value && VALID_INTENT_TYPES.has(value)) return value;
  return fallback;
}

export function normalizeIntentText(value: string | undefined, fallback: string, title: string): string {
  const cleaned = value?.trim();
  if (!cleaned || cleaned.length < 24 || cleaned.length > 180 || !/because/i.test(cleaned)) {
    return sanitizeIntentText(fallback, { title, maxChars: 140, minChars: 24 });
  }
  return sanitizeIntentText(cleaned, { fallback, title, maxChars: 140, minChars: 24 });
}

export function normalizeTargetConcept(value: string | undefined, fallback: string | null | undefined): string | null {
  const cleaned = value?.trim();
  if (cleaned && cleaned.length >= 3 && cleaned.length <= 60) {
    return cleaned;
  }
  return fallback?.trim() || null;
}
