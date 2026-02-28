import { supabase } from '@/lib/supabase';
import {
  ITEM_COMPLETED_LOOKBACK_DAYS,
  ITEM_COMPLETED_LOOKBACK_ROWS,
  SESSION_COMMITTED_LOOKBACK_DAYS,
  SESSION_COMMITTED_LOOKBACK_ROWS,
  SESSION_FINALIZED_LOOKBACK_HOURS,
  SESSION_FINALIZED_LOOKBACK_ROWS,
} from '@/lib/progress/constants';
import { buildIdentityFilter } from '@/lib/progress/identity';
import { normalizeSessionItemHref } from '@/lib/progress/helpers';

export async function getRecentlyItemHrefSets(
  userId: string,
  trackSlug: string,
  googleId?: string
): Promise<{
  finalized: Set<string>;
  completed: Set<string>;
  committed: Set<string>;
}> {
  const maxLookbackMs = Math.max(
    SESSION_FINALIZED_LOOKBACK_HOURS * 60 * 60 * 1000,
    ITEM_COMPLETED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    SESSION_COMMITTED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  );
  const lookbackISO = new Date(Date.now() - maxLookbackMs).toISOString();
  const { data, error } = await supabase
    .from('TelemetryEvents')
    .select('event_type, payload, created_at')
    .or(buildIdentityFilter(userId, googleId))
    .eq('track_slug', trackSlug)
    .in('event_type', ['session_finalized', 'item_completed', 'session_committed'])
    .gte('created_at', lookbackISO)
    .order('created_at', { ascending: false })
    .limit(1000);

  const finalized = new Set<string>();
  const completed = new Set<string>();
  const committed = new Set<string>();
  const nowMs = Date.now();
  const finalizedLookbackMs = SESSION_FINALIZED_LOOKBACK_HOURS * 60 * 60 * 1000;
  let finalizedRows = 0;
  let completedRows = 0;
  let committedRows = 0;

  if (error || !data) {
    return { finalized, completed, committed };
  }

  for (const row of data) {
    const eventType = (row as { event_type?: string }).event_type;

    if (eventType === 'session_finalized') {
      const createdAt = (row as { created_at?: string }).created_at;
      const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
      if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs > finalizedLookbackMs) continue;
      if (finalizedRows >= SESSION_FINALIZED_LOOKBACK_ROWS) continue;
      finalizedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const completedItems = (payload as { completedItems?: unknown }).completedItems;
      if (!Array.isArray(completedItems)) continue;
      for (const item of completedItems) {
        if (typeof item !== 'string' || item.length === 0) continue;
        finalized.add(normalizeSessionItemHref(item));
      }
      continue;
    }

    if (eventType === 'item_completed') {
      if (completedRows >= ITEM_COMPLETED_LOOKBACK_ROWS) continue;
      completedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const itemHref = (payload as { itemHref?: unknown }).itemHref;
      if (typeof itemHref !== 'string' || itemHref.length === 0) continue;
      completed.add(normalizeSessionItemHref(itemHref));
    } else if (eventType === 'session_committed') {
      if (committedRows >= SESSION_COMMITTED_LOOKBACK_ROWS) continue;
      committedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const itemHref = (payload as { itemHref?: unknown }).itemHref;
      if (typeof itemHref !== 'string' || itemHref.length === 0) continue;
      committed.add(normalizeSessionItemHref(itemHref));
    }
  }

  return { finalized, completed, committed };
}
