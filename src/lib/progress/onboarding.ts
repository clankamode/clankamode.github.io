import { supabase } from '@/lib/supabase';
import { buildIdentityFilter } from '@/lib/progress/identity';
import type { OnboardingProfileRow } from '@/lib/progress/types';

export async function getOnboardingProfile(userId: string, googleId?: string): Promise<OnboardingProfileRow | null> {
  const { data, error } = await supabase
    .from('UserOnboardingProfiles')
    .select('goal, first_launch_track_slug, first_launch_path')
    .or(buildIdentityFilter(userId, googleId))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const goal = data.goal;
  if (goal !== 'interview' && goal !== 'work' && goal !== 'fundamentals') {
    return null;
  }

  return {
    goal,
    first_launch_track_slug: data.first_launch_track_slug ?? null,
    first_launch_path: data.first_launch_path,
  };
}

export async function getCommittedSessionCount(userId: string, googleId?: string): Promise<number> {
  const { count, error } = await supabase
    .from('TelemetryEvents')
    .select('*', { count: 'exact', head: true })
    .or(buildIdentityFilter(userId, googleId))
    .eq('event_type', 'session_committed');

  if (error || typeof count !== 'number') {
    return 0;
  }

  return count;
}
