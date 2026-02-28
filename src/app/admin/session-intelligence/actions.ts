import { generateFrictionTriageBriefAction, recommendAndApplyFrictionTriageAction, upsertFrictionTriageAction } from '@/app/actions/friction-triage';
import { reviewAIDecisionAction } from '@/app/actions/ai-decision-review';
import { parseLookbackDays, parseTriageStatus } from './params';

export async function saveFrictionTriage(formData: FormData) {
  'use server';

  const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
  const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
  const stepIndex = Number(stepIndexRaw);
  if (!trackSlug || !Number.isInteger(stepIndex)) {
    return;
  }

  await upsertFrictionTriageAction({
    trackSlug,
    stepIndex,
    status: parseTriageStatus(formData.get('status')),
    owner: typeof formData.get('owner') === 'string' ? String(formData.get('owner')) : null,
    notes: typeof formData.get('notes') === 'string' ? String(formData.get('notes')) : null,
  });
}

export async function generateAIBrief(formData: FormData) {
  'use server';

  const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
  const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
  const stepIndex = Number(stepIndexRaw);
  if (!trackSlug || !Number.isInteger(stepIndex)) {
    return;
  }

  await generateFrictionTriageBriefAction({
    trackSlug,
    stepIndex,
    lookbackDays: parseLookbackDays(formData.get('lookbackDays')),
  });
}

export async function recommendAndApplyAITriage(formData: FormData) {
  'use server';

  const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
  const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
  const stepIndex = Number(stepIndexRaw);
  if (!trackSlug || !Number.isInteger(stepIndex)) {
    return;
  }

  await recommendAndApplyFrictionTriageAction({
    trackSlug,
    stepIndex,
    lookbackDays: parseLookbackDays(formData.get('lookbackDays')),
    source: 'ai_recommendation',
  });
}

export async function autoTriageTopQueue(formData: FormData) {
  'use server';

  const lookbackDays = parseLookbackDays(formData.get('lookbackDays'));
  const targetsRaw = typeof formData.get('targets') === 'string' ? String(formData.get('targets')) : '[]';
  let parsed: unknown;
  try {
    parsed = JSON.parse(targetsRaw);
  } catch {
    parsed = [];
  }

  const targets = Array.isArray(parsed)
    ? parsed
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const trackSlug = 'trackSlug' in row && typeof row.trackSlug === 'string' ? row.trackSlug : null;
        const stepIndex = 'stepIndex' in row && Number.isInteger(row.stepIndex) ? row.stepIndex : null;
        if (!trackSlug || stepIndex === null) return null;
        return { trackSlug, stepIndex };
      })
      .filter((row): row is { trackSlug: string; stepIndex: number } => !!row)
      .slice(0, 5)
    : [];

  for (const target of targets) {
    await recommendAndApplyFrictionTriageAction({
      trackSlug: target.trackSlug,
      stepIndex: target.stepIndex,
      lookbackDays,
      source: 'ai_auto_batch',
    });
  }
}

export async function adjudicateAIDecision(formData: FormData) {
  'use server';

  const decisionId = formData.get('decisionId');
  const label = formData.get('label');
  const notes = formData.get('notes');
  if (typeof decisionId !== 'string' || typeof label !== 'string') return;

  await reviewAIDecisionAction({
    decisionId,
    label,
    notes: typeof notes === 'string' ? notes : null,
  });
}
