import { supabase } from '@/lib/supabase';
import type { UserLearningState } from '@/types/micro';

export interface UserLearningStateResult {
    userState: UserLearningState;
    debugInfo: {
        stubbornCount: number;
        recentCount: number;
        hasLastInternalization: boolean;
    };
}

const STUBBORN_THRESHOLD = 3;
const RECENT_DAYS = 7;

export async function getUserLearningState(
    userId: string,
    trackSlug: string,
    googleId?: string
): Promise<UserLearningStateResult> {
    const [conceptStats, lastInternalization] = await Promise.all([
        fetchUserConceptStats(userId, trackSlug, googleId),
        fetchLastInternalization(userId, trackSlug, googleId),
    ]);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const stubbornConcepts: string[] = [];
    const recentConcepts: string[] = [];

    for (const stat of conceptStats) {
        if (stat.exposures >= STUBBORN_THRESHOLD && stat.internalized_count === 0) {
            stubbornConcepts.push(stat.concept_slug);
        }
        if (stat.last_seen_at) {
            const lastSeen = new Date(stat.last_seen_at);
            if (lastSeen >= sevenDaysAgo) {
                recentConcepts.push(stat.concept_slug);
            }
        }
    }

    const userState: UserLearningState = {
        stubbornConcepts,
        recentConcepts,
        lastInternalization: lastInternalization ?? undefined,
    };

    return {
        userState,
        debugInfo: {
            stubbornCount: stubbornConcepts.length,
            recentCount: recentConcepts.length,
            hasLastInternalization: !!lastInternalization,
        },
    };
}

interface ConceptStat {
    concept_slug: string;
    exposures: number;
    internalized_count: number;
    last_seen_at: string | null;
}

async function fetchUserConceptStats(
    userId: string,
    trackSlug: string,
    googleId?: string
): Promise<ConceptStat[]> {
    const { data, error } = await supabase
        .from('UserConceptStats')
        .select('concept_slug, exposures, internalized_count, last_seen_at')
        .or(`email.eq.${userId}${googleId ? `,google_id.eq.${googleId}` : ''}`)
        .eq('track_slug', trackSlug);

    if (error || !data) {
        console.error('Failed to fetch user concept stats:', error);
        return [];
    }

    return data as ConceptStat[];
}

interface InternalizationRecord {
    conceptSlug: string;
    picked: 'learned' | 'clarified';
    createdAt: string;
}

async function fetchLastInternalization(
    userId: string,
    trackSlug: string,
    googleId?: string
): Promise<InternalizationRecord | null> {
    const { data, error } = await supabase
        .from('UserInternalizations')
        .select('concept_slug, picked, created_at')
        .or(`email.eq.${userId}${googleId ? `,google_id.eq.${googleId}` : ''}`)
        .eq('track_slug', trackSlug)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return null;

    return {
        conceptSlug: data.concept_slug,
        picked: data.picked as 'learned' | 'clarified',
        createdAt: data.created_at,
    };
}
