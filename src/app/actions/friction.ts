'use server';

import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { getEffectiveIdentityFromSession } from '@/lib/auth-identity';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { FrictionSnapshotPayload } from '@/types/friction';

const MAX_SIGNALS_SIZE = 4096;

export async function logFrictionSnapshotAction(payload: FrictionSnapshotPayload) {
  const headerList = await headers();
  if (headerList.get('x-e2e-test') === '1') {
    return { success: true, skipped: true };
  }

  const session = await getServerSession(authOptions);
  const identity = getEffectiveIdentityFromSession(session);

  if (!identity) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!isFeatureEnabled(FeatureFlags.FRICTION_INTELLIGENCE, session?.user ?? null)) {
    return { success: false, error: 'Feature disabled' };
  }

  if (JSON.stringify(payload.signals).length > MAX_SIGNALS_SIZE) {
    return { success: false, error: 'Signals payload too large' };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('SessionFrictionSnapshots')
      .insert({
        email: identity.email,
        google_id: identity.googleId ?? null,
        session_id: payload.sessionId,
        track_slug: payload.trackSlug,
        step_index: payload.stepIndex,
        phase: payload.phase,
        friction_state: payload.frictionState,
        confidence: payload.confidence,
        signals: payload.signals,
        trigger: payload.trigger,
        dedupe_key: payload.dedupeKey,
      });

    if (error) {
      console.warn('[friction] insert failed:', error.message);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.warn('[friction] action crash:', error);
    return { success: false };
  }
}
