'use server';

import { supabase } from '@/lib/supabase';
import { type Internalization } from '@/lib/artifacts';

export async function saveInternalization(artifact: Internalization, userId?: string, trackSlug?: string, googleId?: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return { success: false, error: 'No DB' };
    }
    if (!userId) {
        return { success: false, error: 'Missing user identity' };
    }

    const { error } = await supabase
        .from('UserInternalizations')
        .insert({
            session_id: artifact.sessionId,
            email: userId,
            google_id: googleId ?? null,
            picked: artifact.picked,
            concept_slug: artifact.concept,
            track_slug: trackSlug || 'dsa',
            note: artifact.note,
            delta_snapshot: JSON.stringify(artifact.delta || {}),
            created_at: artifact.createdAt
        });

    if (error) {
        return { success: false, error: error.message };
    }

    if (artifact.concept && trackSlug) {
        const upsertRow = {
            email: userId,
            google_id: googleId ?? null,
            track_slug: trackSlug,
            concept_slug: artifact.concept,
            exposures: 0,
            internalized_count: 1,
            last_seen_at: new Date().toISOString()
        };

        const { error: rpcError } = await supabase.rpc('increment_concept_internalization', {
            p_email: userId,
            p_track_slug: trackSlug,
            p_concept_slug: artifact.concept,
        });

        if (rpcError) {
            await supabase
                .from('UserConceptStats')
                .upsert(upsertRow, { onConflict: 'email,track_slug,concept_slug' });
        }
    }

    return { success: true };
}
