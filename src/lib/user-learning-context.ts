import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export interface UserLearningContext {
  conceptSlug: string;
  exposures: number;
  internalizedCount: number;
  lastSeenAt: string | null;
  recentInternalizations: string[]; // picked values, latest 3
}

function slugifyConcept(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

interface ConceptStatRow {
  concept_slug: string;
  exposures: number;
  internalized_count: number;
  last_seen_at: string | null;
}

interface InternalizationRow {
  concept_slug: string;
  picked: string;
}

/**
 * Returns learning history for the given user across the provided concept names.
 * Concept names are slugified before querying. Only concepts found in UserConceptStats
 * are returned. Aggregates across tracks.
 */
export async function getUserLearningContext(
  userId: number,
  keyConcepts: string[],
): Promise<UserLearningContext[]> {
  if (keyConcepts.length === 0) return [];

  const slugs = [...new Set(keyConcepts.map(slugifyConcept).filter(Boolean))];
  if (slugs.length === 0) return [];

  const admin = getSupabaseAdminClient();

  const { data: statsData, error: statsError } = await admin
    .from('UserConceptStats')
    .select('concept_slug, exposures, internalized_count, last_seen_at')
    .eq('user_id', userId)
    .in('concept_slug', slugs);

  if (statsError) {
    console.error('[getUserLearningContext] failed to fetch concept stats:', statsError);
    return [];
  }

  if (!statsData || statsData.length === 0) return [];

  // Aggregate across tracks: sum exposures/internalizations, keep latest last_seen_at
  const conceptMap = new Map<string, UserLearningContext>();
  for (const raw of statsData as ConceptStatRow[]) {
    const existing = conceptMap.get(raw.concept_slug);
    if (existing) {
      existing.exposures += raw.exposures;
      existing.internalizedCount += raw.internalized_count;
      if (
        raw.last_seen_at &&
        (!existing.lastSeenAt || raw.last_seen_at > existing.lastSeenAt)
      ) {
        existing.lastSeenAt = raw.last_seen_at;
      }
    } else {
      conceptMap.set(raw.concept_slug, {
        conceptSlug: raw.concept_slug,
        exposures: raw.exposures,
        internalizedCount: raw.internalized_count,
        lastSeenAt: raw.last_seen_at,
        recentInternalizations: [],
      });
    }
  }

  const foundSlugs = [...conceptMap.keys()];

  const { data: internalizationsData, error: internalizationsError } = await admin
    .from('UserInternalizations')
    .select('concept_slug, picked')
    .eq('user_id', userId)
    .in('concept_slug', foundSlugs)
    .order('created_at', { ascending: false })
    .limit(foundSlugs.length * 5);

  if (internalizationsError) {
    console.error('[getUserLearningContext] failed to fetch internalizations:', internalizationsError);
  }

  for (const raw of (internalizationsData ?? []) as InternalizationRow[]) {
    const entry = conceptMap.get(raw.concept_slug);
    if (entry && entry.recentInternalizations.length < 3) {
      entry.recentInternalizations.push(raw.picked);
    }
  }

  return [...conceptMap.values()];
}
