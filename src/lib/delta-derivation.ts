import { supabase } from '@/lib/supabase';
import type { SessionItem, LearningDelta } from '@/lib/progress';
import type { Concept, ConceptDependency, UserConceptStats } from '@/types/concepts';
import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';

interface ArticleConceptData {
    slug: string;
    concept_tags: string[];
    primary_concept: string | null;
}

interface DeltaDerivationResult {
    delta: LearningDelta;
    debugInfo: {
        seenTags: string[];
        unknownTags: string[];
        introducedCount: number;
        reinforcedCount: number;
        unlockedCount: number;
    };
}

export async function deriveLearningDelta(
    userId: string,
    trackSlug: string,
    completedItems: SessionItem[],
    googleId?: string
): Promise<DeltaDerivationResult> {
    const [articleData, conceptDict, dependencies, userStats] = await Promise.all([
        fetchArticleConceptData(completedItems),
        fetchConceptDictionary(trackSlug),
        fetchHardDependencies(trackSlug),
        fetchUserConceptStats(userId, trackSlug, googleId),
    ]);

    const knownConcepts = new Set(conceptDict.map(c => c.slug));
    const rawSeenTags = new Set<string>();
    for (const article of articleData) {
        for (const tag of article.concept_tags) {
            rawSeenTags.add(tag);
        }
        if (article.primary_concept) {
            rawSeenTags.add(article.primary_concept);
        }
    }

    const seenTags: string[] = [];
    const unknownTags: string[] = [];
    for (const tag of rawSeenTags) {
        if (knownConcepts.has(tag)) {
            seenTags.push(tag);
        } else {
            unknownTags.push(tag);
        }
    }

    const statsMap = new Map<string, { exposures: number; internalized: number }>();
    for (const stat of userStats) {
        statsMap.set(stat.concept_slug, {
            exposures: stat.exposures,
            internalized: stat.internalized_count,
        });
    }

    const introduced: string[] = [];
    const reinforced: string[] = [];

    for (const tag of seenTags) {
        const stat = statsMap.get(tag);
        const prevExposures = stat?.exposures ?? 0;

        if (prevExposures === 0) {
            introduced.push(tag);
        } else {
            reinforced.push(tag);
        }
    }

    const prevSatisfied = new Set<string>();
    for (const stat of userStats) {
        if (stat.exposures >= 2 || stat.internalized_count >= 1) {
            prevSatisfied.add(stat.concept_slug);
        }
    }

    const postSatisfied = new Set(prevSatisfied);
    for (const tag of seenTags) {
        const stat = statsMap.get(tag);
        const priorExposures = stat?.exposures ?? 0;
        const internalizedCount = stat?.internalized ?? 0;
        if (priorExposures >= 1 || internalizedCount >= 1) {
            postSatisfied.add(tag);
        }
    }

    const depsMap = new Map<string, string[]>();
    for (const dep of dependencies) {
        if (!knownConcepts.has(dep.concept_slug) || !knownConcepts.has(dep.depends_on_slug)) {
            continue;
        }
        if (!depsMap.has(dep.concept_slug)) {
            depsMap.set(dep.concept_slug, []);
        }
        depsMap.get(dep.concept_slug)!.push(dep.depends_on_slug);
    }

    const unlocked: string[] = [];
    for (const [concept, hardDeps] of depsMap.entries()) {
        if (hardDeps.length === 0) continue;

        const prevOk = hardDeps.every(dep => prevSatisfied.has(dep));
        const postOk = hardDeps.every(dep => postSatisfied.has(dep));

        if (!prevOk && postOk) {
            unlocked.push(concept);
        }
    }

    const delta: LearningDelta = {
        introduced: prioritizeForDisplay(introduced, articleData, conceptDict).slice(0, 3),
        reinforced: prioritizeForDisplay(reinforced, articleData, conceptDict).slice(0, 3),
        unlocked: prioritizeForDisplay(unlocked, articleData, conceptDict).slice(0, 3),
    };

    return {
        delta,
        debugInfo: {
            seenTags,
            unknownTags,
            introducedCount: introduced.length,
            reinforcedCount: reinforced.length,
            unlockedCount: unlocked.length,
        },
    };
}

export function resolveDeltaLabels(
    delta: LearningDelta,
    conceptDict: Concept[]
): LearningDelta {
    const labelMap = new Map(conceptDict.map(c => [c.slug, c.label]));

    return {
        introduced: delta.introduced.map(s => labelMap.get(s) ?? s),
        reinforced: delta.reinforced.map(s => labelMap.get(s) ?? s),
        unlocked: delta.unlocked.map(s => labelMap.get(s) ?? s),
    };
}

export async function updateUserConceptStats(
    userId: string,
    trackSlug: string,
    seenTags: string[],
    internalizedConcept?: string,
    googleId?: string
): Promise<void> {
    const now = new Date().toISOString();
    const identity: EffectiveIdentity = googleId ? { email: userId, googleId } : { email: userId };

    for (const tag of seenTags) {
        const { error } = await supabase.rpc('increment_concept_exposure', {
            p_email: userId,
            p_track_slug: trackSlug,
            p_concept_slug: tag,
            p_last_seen_at: now,
        });

        if (error) {
            const { data: existing } = await supabase
                .from('UserConceptStats')
                .select('exposures, internalized_count')
                .or(buildIdentityOrFilter(identity))
                .eq('track_slug', trackSlug)
                .eq('concept_slug', tag)
                .maybeSingle();

            await supabase
                .from('UserConceptStats')
                .upsert({
                    email: userId,
                    google_id: googleId ?? null,
                    track_slug: trackSlug,
                    concept_slug: tag,
                    exposures: (existing?.exposures ?? 0) + 1,
                    internalized_count: existing?.internalized_count ?? 0,
                    last_seen_at: now,
                }, { onConflict: 'email,track_slug,concept_slug' });
        }
    }

    if (internalizedConcept) {
        const { error } = await supabase.rpc('increment_concept_internalization', {
            p_email: userId,
            p_track_slug: trackSlug,
            p_concept_slug: internalizedConcept,
        });

        if (error) {
            const { data: existing } = await supabase
                .from('UserConceptStats')
                .select('exposures, internalized_count')
                .or(buildIdentityOrFilter(identity))
                .eq('track_slug', trackSlug)
                .eq('concept_slug', internalizedConcept)
                .maybeSingle();

            await supabase
                .from('UserConceptStats')
                .upsert({
                    email: userId,
                    google_id: googleId ?? null,
                    track_slug: trackSlug,
                    concept_slug: internalizedConcept,
                    exposures: existing?.exposures ?? 0,
                    internalized_count: (existing?.internalized_count ?? 0) + 1,
                    last_seen_at: now,
                }, { onConflict: 'email,track_slug,concept_slug' });
        }
    }
}

async function fetchArticleConceptData(
    items: SessionItem[]
): Promise<ArticleConceptData[]> {
    const slugs = items
        .map(item => {
            const parts = item.href.split('/');
            return parts[parts.length - 1];
        })
        .filter(Boolean);

    if (slugs.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('LearningArticles')
        .select('slug, concept_tags, primary_concept')
        .in('slug', slugs);

    if (error || !data) {
        console.error('Failed to fetch article concept data:', error);
        return [];
    }

    return data.map(d => ({
        slug: d.slug,
        concept_tags: Array.isArray(d.concept_tags) ? d.concept_tags : [],
        primary_concept: d.primary_concept,
    }));
}

export async function fetchConceptDictionary(trackSlug: string): Promise<Concept[]> {
    const { data, error } = await supabase
        .from('Concepts')
        .select('id, slug, label, short_label, kind, track_slug, created_at')
        .eq('track_slug', trackSlug);

    if (error || !data) {
        console.error('Failed to fetch concept dictionary:', error);
        return [];
    }

    return data as Concept[];
}

async function fetchHardDependencies(trackSlug: string): Promise<ConceptDependency[]> {
    const { data, error } = await supabase
        .from('ConceptDependencies')
        .select('track_slug, concept_slug, depends_on_slug, weight, created_at')
        .eq('track_slug', trackSlug)
        .gte('weight', 2);

    if (error || !data) {
        console.error('Failed to fetch concept dependencies:', error);
        return [];
    }

    return data as ConceptDependency[];
}

async function fetchUserConceptStats(
    userId: string,
    trackSlug: string,
    googleId?: string
): Promise<UserConceptStats[]> {
    const identity: EffectiveIdentity = googleId ? { email: userId, googleId } : { email: userId };
    const { data, error } = await supabase
        .from('UserConceptStats')
        .select('email, track_slug, concept_slug, exposures, internalized_count, last_seen_at')
        .or(buildIdentityOrFilter(identity))
        .eq('track_slug', trackSlug);

    if (error || !data) {
        return [];
    }

    return data as UserConceptStats[];
}

function prioritizeForDisplay(
    slugs: string[],
    articleData: ArticleConceptData[],
    conceptDict: Concept[]
): string[] {
    const primaryConcepts = new Set(
        articleData.map(a => a.primary_concept).filter(Boolean)
    );
    const kindMap = new Map(conceptDict.map(c => [c.slug, c.kind]));

    return [...slugs].sort((a, b) => {
        const aIsPrimary = primaryConcepts.has(a) ? 0 : 1;
        const bIsPrimary = primaryConcepts.has(b) ? 0 : 1;
        if (aIsPrimary !== bIsPrimary) return aIsPrimary - bIsPrimary;

        const aKind = kindMap.get(a) ?? 'concept';
        const bKind = kindMap.get(b) ?? 'concept';
        const kindOrder = { concept: 0, skill: 1, intuition: 2, trap: 3 };
        const aKindScore = kindOrder[aKind as keyof typeof kindOrder] ?? 5;
        const bKindScore = kindOrder[bKind as keyof typeof kindOrder] ?? 5;
        if (aKindScore !== bKindScore) return aKindScore - bKindScore;

        return a.localeCompare(b);
    });
}
