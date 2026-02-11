'use server';

import { supabase } from '@/lib/supabase';
import { type Internalization } from '@/lib/artifacts';
import { buildUserIdentityOrFilter } from '@/lib/auth-identity';

export async function saveInternalization(artifact: Internalization, userId?: string, trackSlug?: string, googleId?: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return { success: false, error: 'No DB' };
    }
    if (!userId) {
        return { success: false, error: 'Missing user identity' };
    }

    const identity = googleId ? { email: userId, googleId } : { email: userId };

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
        const { data: existingStats } = await supabase
            .from('UserConceptStats')
            .select('internalized_count')
            .or(buildUserIdentityOrFilter(identity))
            .eq('track_slug', trackSlug)
            .eq('concept_slug', artifact.concept)
            .maybeSingle();

        if (existingStats) {
            await supabase
                .from('UserConceptStats')
                .update({
                    internalized_count: (existingStats.internalized_count || 0) + 1,
                    last_seen_at: new Date().toISOString()
                })
                .or(buildUserIdentityOrFilter(identity))
                .eq('track_slug', trackSlug)
                .eq('concept_slug', artifact.concept);
        } else {
            await supabase
                .from('UserConceptStats')
                .insert({
                    email: userId,
                    google_id: googleId,
                    track_slug: trackSlug,
                    concept_slug: artifact.concept,
                    exposures: 0,
                    internalized_count: 1,
                    last_seen_at: new Date().toISOString()
                });
        }
    }

    return { success: true };
}
