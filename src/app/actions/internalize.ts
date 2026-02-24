'use server';

import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

import { type Internalization } from '@/lib/artifacts';

let _db: ReturnType<typeof getSupabaseAdminClient> | null = null;
function getDB() { return (_db ??= getSupabaseAdminClient()); }


export async function saveInternalization(artifact: Internalization, userId?: string, trackSlug?: string, googleId?: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return { success: false, error: 'No DB' };
    }
    if (!userId) {
        return { success: false, error: 'Missing user identity' };
    }

    const { error } = await getDB()
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

        const { error: rpcError } = await getDB().rpc('increment_concept_internalization', {
            p_email: userId,
            p_track_slug: trackSlug,
            p_concept_slug: artifact.concept,
        });

        if (rpcError) {
            await getDB()
                .from('UserConceptStats')
                .upsert(upsertRow, { onConflict: 'email,track_slug,concept_slug' });
        }
    }

    return { success: true };
}
