import { logTelemetryAction } from '@/app/actions/telemetry';
import { FeatureFlags, isFeatureEnabled } from './flags';

const seenTelemetryKeys = new Set<string>();

/** Logs a telemetry event to Supabase. Gated by GENERATIVE_SESSIONS; errors are swallowed. */
export async function logTelemetryEvent(params: {
    userId: string | undefined;
    userRole?: string;
    trackSlug: string;
    sessionId: string;
    eventType:
      | 'gate_shown'
      | 'session_committed'
      | 'session_started'
      | 'item_completed'
      | 'step_completed'
      | 'micro_shown'
      | 'micro_clicked'
      | 'ritual_completed'
      | 'session_finalized'
      | 'home_card_rendered'
      | 'coding_workspace_opened'
      | 'practice_tests_ran'
      | 'practice_completion_confirmed'
      | 'practice_completion_blocked'
      | 'friction_state_changed'
      | 'first_win_run_shown'
      | 'first_win_goal_selected'
      | 'first_win_plan_generated'
      | 'first_win_launched'
      | 'personalization_profile_scored';
    mode: 'gate' | 'execute' | 'exit';
    payload?: Record<string, unknown>;
    dedupeKey?: string;
    userRole?: string;
}) {
    const { userId, userRole, trackSlug, sessionId, eventType, mode, payload = {}, dedupeKey } = params;

    const cacheKey = dedupeKey || `${sessionId}_${eventType}`;
    if (seenTelemetryKeys.has(cacheKey)) return;
    if (dedupeKey) {
        seenTelemetryKeys.add(dedupeKey);
    } else if (sessionId !== 'gate_browse') {
        seenTelemetryKeys.add(cacheKey);
    }

    if (!userId) return;

    if (!isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, userRole ? { role: userRole } : null)) return;

    logTelemetryAction({
        trackSlug,
        sessionId,
        eventType,
        mode,
        payload,
        dedupeKey
    }).catch(err => console.warn(`[telemetry] crash for ${eventType}:`, err));
}
