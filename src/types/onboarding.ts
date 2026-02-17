export type OnboardingGoal = 'interview' | 'work' | 'fundamentals';

export interface UserOnboardingProfilePayload {
  goal: OnboardingGoal;
  firstLaunchPath: string;
  firstLaunchTrackSlug?: string | null;
}
