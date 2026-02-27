import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { SessionItem } from '@/lib/progress';

function getDayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getCachedSessionPlan(
  email: string,
  trackSlug: string,
): Promise<SessionItem[] | null> {
  const dayKey = getDayKeyUTC();
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('SessionPlanCache')
    .select('items')
    .eq('email', email)
    .eq('track_slug', trackSlug)
    .eq('day_key', dayKey)
    .single();
  if (error || !data) return null;
  return data.items as SessionItem[];
}

export async function storeCachedSessionPlan(
  email: string,
  trackSlug: string,
  items: SessionItem[],
): Promise<void> {
  const dayKey = getDayKeyUTC();
  const admin = getSupabaseAdminClient();
  await admin
    .from('SessionPlanCache')
    .upsert(
      { email, track_slug: trackSlug, day_key: dayKey, items, generated_at: new Date().toISOString() },
      { onConflict: 'email,track_slug,day_key' }
    );
}
