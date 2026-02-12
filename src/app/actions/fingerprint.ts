'use server';

import { supabase } from '@/lib/supabase';
import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';

const STUBBORN_THRESHOLD = 3;

export interface ConceptStatWithMetadata {
  concept_slug: string;
  track_slug: string;
  exposures: number;
  internalized_count: number;
  last_seen_at: string | null;
  concept: {
    label: string;
    short_label: string | null;
    kind: string;
  };
}

export interface InternalizationWithMetadata {
  id: string;
  concept_slug: string;
  track_slug: string;
  picked: string;
  note: string | null;
  created_at: string;
  session_id: string;
  concept: {
    label: string;
    short_label: string | null;
  };
}

export interface StubbornConcept {
  concept_slug: string;
  exposures: number;
  label: string;
}

export interface FingerprintData {
  conceptStats: ConceptStatWithMetadata[];
  internalizations: InternalizationWithMetadata[];
  stubbornConcepts: StubbornConcept[];
}

function toIdentity(userId: string, googleId?: string): EffectiveIdentity {
  return googleId ? { email: userId, googleId } : { email: userId };
}

export async function getFingerprintData(
  userId: string,
  googleId?: string,
  trackSlug?: string
): Promise<FingerprintData> {
  const identity = toIdentity(userId, googleId);

  let statsQuery = supabase
    .from('UserConceptStats')
    .select('concept_slug, track_slug, exposures, internalized_count, last_seen_at')
    .or(buildIdentityOrFilter(identity))
    .order('exposures', { ascending: false });

  if (trackSlug) {
    statsQuery = statsQuery.eq('track_slug', trackSlug);
  }

  const { data: stats, error: statsError } = await statsQuery;

  if (statsError) {
    console.error('Failed to fetch concept stats:', statsError);
    throw statsError;
  }

  const allConceptSlugs = [...new Set((stats || []).map(s => s.concept_slug))];
  const { data: allConcepts } = await supabase
    .from('Concepts')
    .select('slug, label, short_label, kind')
    .in('slug', allConceptSlugs);

  const allConceptMap = new Map(
    (allConcepts || []).map(c => [c.slug, { label: c.label, short_label: c.short_label, kind: c.kind }])
  );

  let internalizationsQuery = supabase
    .from('UserInternalizations')
    .select('id, concept_slug, track_slug, picked, note, created_at, session_id')
    .or(buildIdentityOrFilter(identity))
    .order('created_at', { ascending: false })
    .limit(100);

  if (trackSlug) {
    internalizationsQuery = internalizationsQuery.eq('track_slug', trackSlug);
  }

  const { data: internalizations, error: internalizationsError } = await internalizationsQuery;

  if (internalizationsError) {
    console.error('Failed to fetch internalizations:', internalizationsError);
    throw internalizationsError;
  }

  const conceptSlugs = [...new Set((internalizations || []).map(i => i.concept_slug))];
  const { data: concepts } = await supabase
    .from('Concepts')
    .select('slug, label, short_label')
    .in('slug', conceptSlugs);

  const conceptMap = new Map(
    (concepts || []).map(c => [c.slug, { label: c.label, short_label: c.short_label }])
  );

  const conceptStats: ConceptStatWithMetadata[] = (stats || []).map((stat) => {
    const conceptData = allConceptMap.get(stat.concept_slug);
    return {
      concept_slug: stat.concept_slug,
      track_slug: stat.track_slug,
      exposures: stat.exposures,
      internalized_count: stat.internalized_count,
      last_seen_at: stat.last_seen_at,
      concept: {
        label: conceptData?.label || stat.concept_slug,
        short_label: conceptData?.short_label || null,
        kind: conceptData?.kind || 'unknown',
      },
    };
  });

  const transformedInternalizations: InternalizationWithMetadata[] = (internalizations || []).map((item) => {
    const conceptData = conceptMap.get(item.concept_slug);
    return {
      id: item.id,
      concept_slug: item.concept_slug,
      track_slug: item.track_slug,
      picked: item.picked,
      note: item.note,
      created_at: item.created_at,
      session_id: item.session_id,
      concept: {
        label: conceptData?.label || item.concept_slug,
        short_label: conceptData?.short_label || null,
      },
    };
  });

  const stubborn: StubbornConcept[] = conceptStats
    .filter((s) => s.exposures >= STUBBORN_THRESHOLD && s.internalized_count === 0)
    .map((s) => ({
      concept_slug: s.concept_slug,
      exposures: s.exposures,
      label: s.concept.label,
    }));

  return {
    conceptStats,
    internalizations: transformedInternalizations,
    stubbornConcepts: stubborn,
  };
}

export async function getLastInternalization(
  userId: string,
  googleId?: string
): Promise<{ label: string; conceptSlug: string; relativeTime: string } | null> {
  const identity = toIdentity(userId, googleId);

  const { data, error } = await supabase
    .from('UserInternalizations')
    .select('concept_slug, created_at')
    .or(buildIdentityOrFilter(identity))
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: concept } = await supabase
    .from('Concepts')
    .select('label')
    .eq('slug', data.concept_slug)
    .single();

  if (!concept) return null;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDiff = Math.round((new Date(data.created_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeTime = Math.abs(daysDiff) < 1 ? 'today' : rtf.format(daysDiff, 'day');

  return {
    label: concept.label,
    conceptSlug: data.concept_slug,
    relativeTime
  };
}
