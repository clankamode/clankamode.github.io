'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getEffectiveIdentityFromSession } from '@/lib/auth-identity';
import { headers } from 'next/headers';

const ALLOWED_EVENTS = new Set([
    'gate_shown',
    'session_committed',
    'item_completed',
    'micro_shown',
    'micro_clicked',
    'ritual_completed'
]);

const MAX_PAYLOAD_SIZE = 4096; // 4KB limit

export async function logTelemetryAction(params: {
    trackSlug: string;
    sessionId: string;
    eventType: string;
    mode: string;
    payload?: Record<string, unknown>;
    dedupeKey?: string;
}) {
    // fast-exit for E2E tests to avoid polluting telemetry
    const headerList = await headers();
    if (headerList.get('x-e2e-test') === '1') {
        return { success: true, skipped: true };
    }

    const session = await getServerSession(authOptions);
    const identity = getEffectiveIdentityFromSession(session);

    if (!identity) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!ALLOWED_EVENTS.has(params.eventType)) {
        return { success: false, error: 'Invalid event type' };
    }

    if (params.payload && JSON.stringify(params.payload).length > MAX_PAYLOAD_SIZE) {
        return { success: false, error: 'Payload too large' };
    }

    try {
        const supabase = getSupabaseAdminClient();

        const { error } = await supabase
            .from('TelemetryEvents')
            .insert({
                email: identity.email,
                google_id: identity.googleId ?? null,
                track_slug: params.trackSlug,
                session_id: params.sessionId,
                event_type: params.eventType,
                mode: params.mode,
                payload: params.payload,
                dedupe_key: params.dedupeKey
            });

        if (error) {
            console.error('[telemetry] insert failed:', error.message);
            return { success: false };
        }

        return { success: true };
    } catch (err) {
        console.error('[telemetry] crash:', err);
        return { success: false };
    }
}
