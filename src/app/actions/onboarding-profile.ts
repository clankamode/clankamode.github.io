'use server';

import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getEffectiveIdentityFromSession } from '@/lib/auth-identity';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type { UserOnboardingProfilePayload } from '@/types/onboarding';

const SAFE_PATH = /^\/[a-z0-9/_-]*$/i;

function normalizePath(path: string): string {
  return path.split('?')[0].split('#')[0];
}

function isSafePath(path: string): boolean {
  return !path.startsWith('//') && SAFE_PATH.test(path) && !path.startsWith('/api/');
}

export async function upsertOnboardingProfileAction(payload: UserOnboardingProfilePayload) {
  const headerList = await headers();
  if (headerList.get('x-e2e-test') === '1') {
    return { success: true, skipped: true };
  }

  const session = await getServerSession(authOptions);
  const identity = getEffectiveIdentityFromSession(session);
  if (!identity) {
    return { success: false, error: 'Unauthorized' };
  }

  const normalizedLaunchPath = normalizePath(payload.firstLaunchPath);
  if (!isSafePath(normalizedLaunchPath)) {
    return { success: false, error: 'Invalid launch path' };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: existing, error: selectError } = await supabase
      .from('UserOnboardingProfiles')
      .select('id, launch_count')
      .eq('email', identity.email)
      .eq('google_id', identity.googleId ?? null)
      .maybeSingle();

    if (selectError) {
      console.warn('[onboarding-profile] select failed:', selectError.message);
      return { success: false };
    }

    const launchCount = Math.max(1, Number(existing?.launch_count ?? 0) + 1);

    const writePayload = {
      email: identity.email,
      google_id: identity.googleId ?? null,
      goal: payload.goal,
      first_launch_path: normalizedLaunchPath,
      first_launch_track_slug: payload.firstLaunchTrackSlug ?? null,
      first_completed_at: new Date().toISOString(),
      launch_count: launchCount,
    };

    const { error } = existing
      ? await supabase
          .from('UserOnboardingProfiles')
          .update(writePayload)
          .eq('id', existing.id)
      : await supabase
          .from('UserOnboardingProfiles')
          .insert(writePayload);

    if (error) {
      console.warn('[onboarding-profile] upsert failed:', error.message);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.warn('[onboarding-profile] action crash:', error);
    return { success: false };
  }
}
