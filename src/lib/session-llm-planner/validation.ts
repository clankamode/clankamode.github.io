import type { SessionIntent, SessionItem } from '@/lib/progress';
import { enforcePlanDiversity } from '@/lib/session-llm-planner/heuristic-plan';
import {
  capTotalMinutes,
  enforceAtLeastOneLearn,
  enforceAtLeastOnePractice,
} from '@/lib/session-llm-planner/selection-guards';
import {
  normalizeIntentText,
  normalizeIntentType,
  normalizeTargetConcept,
} from '@/lib/session-llm-planner/selection-normalization';
import type {
  RankerResponse,
  SessionPlannerCandidate,
  SessionPlannerResponse,
} from '@/lib/session-llm-planner/types';
import { VALID_INTENT_TYPES } from '@/lib/session-llm-planner/types';

export function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    return fenced[1];
  }
  return raw;
}

export function parsePlannerJSON(raw: string): SessionPlannerResponse | null {
  const trimmed = stripCodeFences(raw).trim();

  try {
    return JSON.parse(trimmed) as SessionPlannerResponse;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as SessionPlannerResponse;
    } catch {
      return null;
    }
  }
}

export function parseRankerJSON(raw: string): RankerResponse | null {
  const trimmed = stripCodeFences(raw).trim();
  try {
    return JSON.parse(trimmed) as RankerResponse;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as RankerResponse;
    } catch {
      return null;
    }
  }
}

export function validatePlannerResponse(
  parsed: unknown,
  candidates: Map<string, SessionItem>,
  maxItems: number,
  requiresLearn: boolean,
  requiresPractice: boolean
): { valid: boolean; parsed: SessionPlannerResponse | null; errors: string[] } {
  const errors: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, parsed: null, errors: ['Payload is not a JSON object.'] };
  }

  const selected = (parsed as { selected?: unknown }).selected;
  if (!Array.isArray(selected)) {
    return { valid: false, parsed: null, errors: ['`selected` must be an array.'] };
  }

  if (selected.length === 0) {
    errors.push('`selected` cannot be empty.');
  }
  if (selected.length > maxItems) {
    errors.push('`selected` has too many items.');
  }

  const seen = new Set<string>();
  let selectedLearnCount = 0;
  let selectedPracticeCount = 0;

  for (const row of selected) {
    if (!row || typeof row !== 'object') {
      errors.push('Each selection must be an object.');
      continue;
    }

    const id = (row as { id?: unknown }).id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      errors.push('Each selection requires a non-empty string id.');
      continue;
    }

    if (!candidates.has(id)) {
      errors.push(`Selection id "${id}" is not in candidates.`);
      continue;
    }

    if (seen.has(id)) {
      errors.push(`Selection id "${id}" is duplicated.`);
    }
    seen.add(id);

    const candidate = candidates.get(id);
    if (candidate?.type === 'learn') {
      selectedLearnCount += 1;
    }
    if (candidate?.type === 'practice') {
      selectedPracticeCount += 1;
    }

    const intentType = (row as { intentType?: unknown }).intentType;
    if (intentType !== undefined && (typeof intentType !== 'string' || !VALID_INTENT_TYPES.has(intentType as SessionIntent['type']))) {
      errors.push(`Selection id "${id}" has invalid intentType.`);
    }

    const intentText = (row as { intentText?: unknown }).intentText;
    if (intentText !== undefined && (typeof intentText !== 'string' || intentText.trim().length < 24 || intentText.trim().length > 180)) {
      errors.push(`Selection id "${id}" has invalid intentText length.`);
    }
    if (typeof intentText === 'string' && !/because/i.test(intentText)) {
      errors.push(`Selection id "${id}" intentText must include a causal reason.`);
    }

    const targetConcept = (row as { targetConcept?: unknown }).targetConcept;
    if (targetConcept !== undefined && (typeof targetConcept !== 'string' || targetConcept.trim().length < 3 || targetConcept.trim().length > 60)) {
      errors.push(`Selection id "${id}" has invalid targetConcept.`);
    }
  }

  if (requiresLearn && selectedLearnCount === 0) {
    errors.push('Plan must include at least one learn item.');
  }
  if (requiresPractice && selectedPracticeCount === 0) {
    errors.push('Plan must include at least one practice item.');
  }

  return {
    valid: errors.length === 0,
    parsed: errors.length === 0 ? (parsed as SessionPlannerResponse) : null,
    errors,
  };
}

export function applySessionPlanPolicySelection(input: {
  selectedIds: string[];
  candidates: SessionPlannerCandidate[];
  maxItems: number;
  requirePracticeItem: boolean;
}): SessionItem[] {
  const boundedMaxItems = Math.min(Math.max(input.maxItems, 1), 4);
  const parsed: SessionPlannerResponse = {
    selected: input.selectedIds.map((id) => ({ id })),
  };
  const candidateById = new Map(input.candidates.map((candidate) => [candidate.id, candidate.item]));
  return finalizeSelectedItems(
    parsed,
    candidateById,
    input.candidates,
    boundedMaxItems,
    input.requirePracticeItem
  );
}

export function finalizeSelectedItems(
  parsed: SessionPlannerResponse,
  candidateById: Map<string, SessionItem>,
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  requirePracticeItem: boolean
): SessionItem[] {
  const uniqueIds = new Set<string>();
  const selectedItems: SessionItem[] = [];

  for (const selection of parsed.selected.slice(0, maxItems)) {
    if (!selection?.id || uniqueIds.has(selection.id)) continue;
    const candidate = candidateById.get(selection.id);
    if (!candidate) continue;
    uniqueIds.add(selection.id);

    const nextIntentType = normalizeIntentType(selection.intentType, candidate.intent.type);
    const nextIntentText = normalizeIntentText(selection.intentText, candidate.intent.text, candidate.title);
    const nextTargetConcept = normalizeTargetConcept(selection.targetConcept, candidate.targetConcept);

    selectedItems.push({
      ...candidate,
      targetConcept: nextTargetConcept,
      intent: {
        ...candidate.intent,
        type: nextIntentType,
        text: nextIntentText,
      },
    });
  }

  const withLearnGuard = enforceAtLeastOneLearn(selectedItems, candidates, maxItems);
  const diversified = enforcePlanDiversity(withLearnGuard, candidates, maxItems, 22);
  const capped = capTotalMinutes(diversified, 22);
  const guarded = requirePracticeItem
    ? enforceAtLeastOnePractice(capped, candidates, maxItems, 22)
    : capped;
  return enforcePlanDiversity(guarded, candidates, maxItems, 22);
}
