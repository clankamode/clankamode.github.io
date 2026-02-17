import type { FrictionState } from '@/types/friction';

function toCompactJson(value: unknown): string {
  return JSON.stringify(value);
}

export function buildSessionPlanPolicyPrompt(input: {
  trackSlug: string;
  trackName: string;
  maxItems: number;
  requirePracticeItem: boolean;
  recentActivityTitles: string[];
  candidates: Array<{
    id: string;
    type: 'learn' | 'practice';
    title: string;
    estMinutes: number;
    targetConcept: string | null;
  }>;
}): string {
  return [
    'You are selecting a short learning session plan.',
    `Select up to ${input.maxItems} candidate ids.`,
    'Favor immediate transfer, manageable scope, and concept diversity.',
    `Track: ${input.trackName} (${input.trackSlug}).`,
    `Practice required: ${input.requirePracticeItem ? 'yes' : 'no'}.`,
    `Recent activity: ${input.recentActivityTitles.slice(0, 6).join(' | ') || 'none'}.`,
    'Return JSON only with schema:',
    '{"selectedIds":["id1","id2"],"confidence":0.0-1.0,"reasonSummary":"<=200 chars"}',
    'Do not include any keys beyond selectedIds, confidence, reasonSummary.',
    `Candidates: ${toCompactJson(input.candidates)}`,
  ].join('\n');
}

export function buildScopePolicyPrompt(input: {
  trackSlug: string;
  goal: string | null;
  profileSegment: string | null;
  baselineItemCount: number;
  baselineMinutes: number;
  candidateMinutes: number[];
}): string {
  return [
    'You are setting session scope limits for one short session.',
    'Return conservative caps that increase completion quality.',
    'Return JSON only with schema:',
    '{"maxItems":1-3,"maxMinutes":8-30,"confidence":0.0-1.0,"reasonSummary":"<=180 chars"}',
    `Track: ${input.trackSlug}`,
    `Goal: ${input.goal ?? 'unknown'}`,
    `Profile segment: ${input.profileSegment ?? 'unknown'}`,
    `Baseline item count: ${input.baselineItemCount}, baseline minutes: ${input.baselineMinutes}`,
    `Candidate minutes: ${toCompactJson(input.candidateMinutes.slice(0, 6))}`,
    'Do not include extra keys.',
  ].join('\n');
}

export function buildOnboardingPathPolicyPrompt(input: {
  goal: 'interview' | 'work' | 'fundamentals';
  returnTo: string | null;
  sessionStartPath: string;
  allowedPaths: string[];
}): string {
  return [
    'You are routing a user to the best first destination.',
    'Prefer continuity when returnTo is provided.',
    `Goal: ${input.goal}`,
    `ReturnTo: ${input.returnTo ?? 'none'}`,
    `Default session start path: ${input.sessionStartPath}`,
    `Allowed paths: ${input.allowedPaths.join(', ')}`,
    'Return JSON only with schema:',
    '{"targetPath":"/path","trackSlug":"dsa|system-design|job-hunt|null","confidence":0.0-1.0,"reasonSummary":"<=180 chars"}',
    'targetPath must be one of the allowed paths or returnTo when present.',
    'Do not include extra keys.',
  ].join('\n');
}

export function buildFrictionTriagePolicyPrompt(input: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  sampleSize: number;
  stuckRate: number;
  avgConfidence: number;
  avgElapsedRatio: number;
  ownerCandidates: string[];
  existingStatus: 'new' | 'investigating' | 'resolved';
  existingOwner: string | null;
  dominantState: FrictionState | 'none';
}): string {
  return [
    'You are recommending triage assignment for a friction hotspot.',
    'Return JSON only with schema:',
    '{"status":"new|investigating|resolved","owner":"string|null","rationale":"<=220 chars","confidence":0.0-1.0}',
    'Owner must be null or one of ownerCandidates.',
    `Track: ${input.trackSlug}, Step: ${input.stepIndex}, Lookback days: ${input.lookbackDays}`,
    `Sample size: ${input.sampleSize}, stuckRate: ${input.stuckRate.toFixed(3)}, avgConfidence: ${input.avgConfidence.toFixed(3)}, avgElapsedRatio: ${input.avgElapsedRatio.toFixed(3)}`,
    `Dominant state: ${input.dominantState}`,
    `Existing triage: status=${input.existingStatus}, owner=${input.existingOwner ?? 'unassigned'}`,
    `Owner candidates: ${toCompactJson(input.ownerCandidates)}`,
    'Do not include extra keys.',
  ].join('\n');
}
