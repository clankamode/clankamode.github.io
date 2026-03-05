import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

import type { UserLearningState, FailureMode } from '@/types/micro';
import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';

let _db: ReturnType<typeof getSupabaseAdminClient> | null = null;
function getDB() { return (_db ??= getSupabaseAdminClient()); }


export interface UserLearningStateResult {
    userState: UserLearningState;
    debugInfo: {
        stubbornCount: number;
        recentCount: number;
        failureModeCount: number;
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
    const [conceptStats, lastInternalization, telemetryEvents] = await Promise.all([
        fetchUserConceptStats(userId, trackSlug, googleId),
        fetchLastInternalization(userId, trackSlug, googleId),
        fetchRecentFailureTelemetry(userId, trackSlug, googleId),
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

    const failureModes = aggregateFailureModes(telemetryEvents);
    const aggregateHistory = failureModes.length > 0
        ? [`Struggling with: ${failureModes.map(f => f.conceptSlug).join(', ')}`]
        : [];

    const userState: UserLearningState = {
        stubbornConcepts,
        recentConcepts,
        lastInternalization: lastInternalization ?? undefined,
        failureModes,
        aggregateHistory,
    };

    return {
        userState,
        debugInfo: {
            stubbornCount: stubbornConcepts.length,
            recentCount: recentConcepts.length,
            failureModeCount: failureModes.length,
            hasLastInternalization: !!lastInternalization,
        },
    };
}

interface TelemetryEventRow {
    payload: Record<string, unknown> | null;
    created_at: string;
}

async function fetchRecentFailureTelemetry(
    userId: string,
    trackSlug: string,
    googleId?: string
): Promise<TelemetryEventRow[]> {
    const identity: EffectiveIdentity = googleId ? { email: userId, googleId } : { email: userId };
    const { data, error } = await getDB()
        .from('TelemetryEvents')
        .select('payload, created_at')
        .or(buildIdentityOrFilter(identity))
        .eq('track_slug', trackSlug)
        .eq('event_type', 'practice_completion_blocked')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error || !data) return [];
    return data;
}

function aggregateFailureModes(events: TelemetryEventRow[]): FailureMode[] {
    const modes: Record<string, FailureMode> = {};

    for (const event of events) {
        const payload = event.payload as { questionId?: string; failedDetails?: Array<{ error?: string }> } | null;
        if (!payload || !payload.questionId) continue;

        const concept = payload.questionId;
        const failedDetails = payload.failedDetails || [];

        for (const detail of failedDetails) {
            const errorType = detail.error?.toLowerCase().includes('timeout') ? 'timeout' : 'logic_error';
            const key = `${concept}:${errorType}`;

            if (!modes[key]) {
                modes[key] = {
                    conceptSlug: concept,
                    errorType,
                    count: 0,
                    lastMessage: detail.error,
                };
            }
            modes[key].count += 1;
        }
    }

    return Object.values(modes);
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
    const identity: EffectiveIdentity = googleId ? { email: userId, googleId } : { email: userId };
    const { data, error } = await getDB()
        .from('UserConceptStats')
        .select('concept_slug, exposures, internalized_count, last_seen_at')
        .or(buildIdentityOrFilter(identity))
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
    const identity: EffectiveIdentity = googleId ? { email: userId, googleId } : { email: userId };
  const { data, error } = await getDB()
    .from('UserInternalizations')
    .select('concept_slug, picked, created_at')
    .or(buildIdentityOrFilter(identity))
    .eq('track_slug', trackSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

    if (error || !data) return null;

    return {
        conceptSlug: data.concept_slug,
        picked: data.picked as 'learned' | 'clarified',
        createdAt: data.created_at,
    };
}
