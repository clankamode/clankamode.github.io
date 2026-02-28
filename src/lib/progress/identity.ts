import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';
import type { OnboardingGoal } from '@/types/onboarding';

export function toIdentity(userId: string, googleId?: string): EffectiveIdentity {
  return googleId ? { email: userId, googleId } : { email: userId };
}

export function buildIdentityFilter(userId: string, googleId?: string): string {
  return buildIdentityOrFilter(toIdentity(userId, googleId));
}

export function isPracticeTrack(trackSlug: string): boolean {
  return trackSlug === 'dsa' || trackSlug === 'job-hunt' || trackSlug === 'interviews';
}

export function normalizeTrackSlug(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  const aliases: Record<string, string> = {
    interviews: 'job-hunt',
    'interview-prep': 'job-hunt',
    interviewprep: 'job-hunt',
    jobhunt: 'job-hunt',
    systemdesign: 'system-design',
    system_design: 'system-design',
  };
  return aliases[normalized] || normalized;
}

export function mapOnboardingGoalToTrackSlug(goal: OnboardingGoal): string {
  if (goal === 'work') return 'system-design';
  return 'dsa';
}
