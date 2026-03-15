import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';
import { GENERATED_CONCEPT_INDEX } from '@/lib/concept-index.generated';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { OnboardingGoal } from '@/types/onboarding';

let db: ReturnType<typeof getSupabaseAdminClient> | null = null;
const getDB = () => (db ??= getSupabaseAdminClient());

const STALE_REVIEW_DAYS = 10;
const DEFAULT_TRACK = 'dsa';

type ConceptRow = { slug: string; label: string; description: string | null };
type ConceptStatRow = { concept_slug: string; exposures: number; internalized_count: number; last_seen_at: string | null };
type InternalizationRow = { concept_slug: string; created_at: string };
type DigestCandidate = Omit<DailyDigestItem, 'dayKey' | 'trackSlug' | 'reason'> & { score: number };

export interface DailyDigestItem {
  dayKey: string;
  trackSlug: string;
  mode: 'learn' | 'review';
  conceptSlug: string;
  conceptName: string;
  explanation: string;
  reason: string;
  practiceHref: string;
  practiceTitle: string;
  learnMinutes: number;
  practiceMinutes: number;
}

const goalToTrack = (goal: OnboardingGoal | null) => (goal === 'work' ? 'system-design' : DEFAULT_TRACK);

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickSeededCandidate<T extends { score: number; conceptSlug: string }>(items: T[], seed: string): T | null {
  if (items.length === 0) return null;
  const sorted = [...items].sort(
    (left, right) => right.score - left.score || left.conceptSlug.localeCompare(right.conceptSlug)
  );
  const shortlist = sorted.slice(0, Math.min(sorted.length, 3));
  return shortlist[hashString(seed) % shortlist.length] ?? shortlist[0] ?? null;
}

function getConceptPractice(conceptSlug: string) {
  const items = GENERATED_CONCEPT_INDEX[conceptSlug] ?? [];
  const practice = items.find((item) => item.type === 'practice');
  const learn = items.find((item) => item.type === 'learn');

  if (!practice) return null;

  return {
    practiceHref: practice.href,
    practiceTitle: practice.title,
    practiceMinutes: practice.estMinutes,
    learnMinutes: learn?.estMinutes ?? 5,
  };
}

function latestTimestamp(...values: Array<string | null | undefined>): number {
  return values.reduce((latest, value) => {
    if (!value) return latest;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
  }, 0);
}

export function selectDailyDigestCandidate(input: {
  concepts: ConceptRow[];
  stats: ConceptStatRow[];
  internalizations: InternalizationRow[];
  trackSlug: string;
  dayKey: string;
  userSeed: string;
}): DailyDigestItem | null {
  const statsByConcept = new Map(input.stats.map((row) => [row.concept_slug, row]));
  const internalizedAtByConcept = new Map<string, string>();

  for (const row of input.internalizations) {
    const existing = internalizedAtByConcept.get(row.concept_slug);
    if (!existing || Date.parse(row.created_at) > Date.parse(existing)) {
      internalizedAtByConcept.set(row.concept_slug, row.created_at);
    }
  }

  const now = Date.parse(`${input.dayKey}T12:00:00.000Z`);
  const reviewCandidates: DigestCandidate[] = [];
  const learnCandidates: DigestCandidate[] = [];

  for (const concept of input.concepts) {
    const practice = getConceptPractice(concept.slug);
    if (!practice) continue;

    const stat = statsByConcept.get(concept.slug);
    const lastInternalizedAt = internalizedAtByConcept.get(concept.slug) ?? null;
    const masteryCount = Math.max(stat?.internalized_count ?? 0, lastInternalizedAt ? 1 : 0);
    const explanation = concept.description?.trim() || `Sharpen ${concept.label} with one focused rep today.`;

    if (masteryCount > 0) {
      const lastActivityAt = latestTimestamp(stat?.last_seen_at, lastInternalizedAt);
      const staleDays = lastActivityAt > 0 ? Math.floor((now - lastActivityAt) / 86_400_000) : STALE_REVIEW_DAYS;
      if (staleDays >= STALE_REVIEW_DAYS) {
        reviewCandidates.push({ mode: 'review', conceptSlug: concept.slug, conceptName: concept.label, explanation, practiceHref: practice.practiceHref, practiceTitle: practice.practiceTitle, learnMinutes: practice.learnMinutes, practiceMinutes: practice.practiceMinutes, score: staleDays });
      }
      continue;
    }

    learnCandidates.push({ mode: 'learn', conceptSlug: concept.slug, conceptName: concept.label, explanation, practiceHref: practice.practiceHref, practiceTitle: practice.practiceTitle, learnMinutes: practice.learnMinutes, practiceMinutes: practice.practiceMinutes, score: (stat?.exposures ?? 0) * 10 + (stat?.last_seen_at ? 1 : 0) });
  }

  const selected = pickSeededCandidate(
    reviewCandidates.length > 0 ? reviewCandidates : learnCandidates,
    `${input.userSeed}:${input.trackSlug}:${input.dayKey}`
  );

  if (!selected) return null;

  return {
    dayKey: input.dayKey,
    trackSlug: input.trackSlug,
    mode: selected.mode,
    conceptSlug: selected.conceptSlug,
    conceptName: selected.conceptName,
    explanation: selected.explanation,
    reason: selected.mode === 'review'
      ? 'Review this before it goes cold.'
      : 'Build momentum on a concept you have not locked in yet.',
    practiceHref: selected.practiceHref,
    practiceTitle: selected.practiceTitle,
    learnMinutes: selected.learnMinutes,
    practiceMinutes: selected.practiceMinutes,
  };
}

export async function getDailyDigest(identity: EffectiveIdentity, day: Date = new Date()): Promise<DailyDigestItem | null> {
  const dayKey = day.toISOString().slice(0, 10);
  const { data: profile } = await getDB()
    .from('UserOnboardingProfiles')
    .select('goal, first_launch_track_slug')
    .or(buildIdentityOrFilter(identity))
    .maybeSingle();
  const trackSlug = profile?.first_launch_track_slug || goalToTrack(profile?.goal ?? null);

  const [conceptsResult, statsResult, internalizationsResult] = await Promise.all([
    getDB().from('Concepts').select('slug, label, description').eq('track_slug', trackSlug),
    getDB()
      .from('UserConceptStats')
      .select('concept_slug, exposures, internalized_count, last_seen_at')
      .or(buildIdentityOrFilter(identity))
      .eq('track_slug', trackSlug),
    getDB()
      .from('UserInternalizations')
      .select('concept_slug, created_at')
      .or(buildIdentityOrFilter(identity))
      .eq('track_slug', trackSlug)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  return selectDailyDigestCandidate({
    concepts: (conceptsResult.data ?? []) as ConceptRow[],
    stats: (statsResult.data ?? []) as ConceptStatRow[],
    internalizations: (internalizationsResult.data ?? []) as InternalizationRow[],
    trackSlug,
    dayKey,
    userSeed: identity.googleId || identity.email,
  });
}
