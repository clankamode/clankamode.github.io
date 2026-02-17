import type {
  FrictionTriageDecisionOutput,
  OnboardingPathDecisionOutput,
  ScopePolicyDecisionOutput,
  SessionPlanDecisionOutput,
} from '@/lib/ai-policy/types';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function cleanSummary(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 220);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseJsonOutput(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return asObject(JSON.parse(normalized));
  } catch {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return asObject(JSON.parse(normalized.slice(start, end + 1)));
    } catch {
      return null;
    }
  }
}

export function validateSessionPlanDecision(
  parsed: Record<string, unknown>
): { output: SessionPlanDecisionOutput; confidence: number } | null {
  const selectedRaw = parsed.selectedIds;
  if (!Array.isArray(selectedRaw)) return null;
  const selectedIds = selectedRaw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, 4);
  if (selectedIds.length === 0) return null;

  const confidenceRaw = Number(parsed.confidence);
  return {
    output: {
      selectedIds,
      reasonSummary: cleanSummary(parsed.reasonSummary, 'Policy-selected plan for near-term momentum.'),
    },
    confidence: clamp01(confidenceRaw),
  };
}

export function validateScopePolicyDecision(
  parsed: Record<string, unknown>
): { output: ScopePolicyDecisionOutput; confidence: number } | null {
  const maxItems = Math.max(1, Math.min(3, Math.round(Number(parsed.maxItems))));
  const maxMinutes = Math.max(8, Math.min(30, Math.round(Number(parsed.maxMinutes))));
  if (!Number.isFinite(maxItems) || !Number.isFinite(maxMinutes)) return null;

  return {
    output: {
      maxItems,
      maxMinutes,
      reasonSummary: cleanSummary(parsed.reasonSummary, 'Policy reduced scope to improve completion quality.'),
    },
    confidence: clamp01(Number(parsed.confidence)),
  };
}

export function validateOnboardingPathDecision(
  parsed: Record<string, unknown>,
  allowedPaths: string[],
  fallbackPath: string
): { output: OnboardingPathDecisionOutput; confidence: number } | null {
  const targetPathRaw = typeof parsed.targetPath === 'string' ? parsed.targetPath.trim() : '';
  const targetPath = allowedPaths.includes(targetPathRaw) ? targetPathRaw : fallbackPath;
  if (!targetPath.startsWith('/')) return null;

  const trackRaw = parsed.trackSlug;
  const trackSlug = trackRaw === 'dsa' || trackRaw === 'system-design' || trackRaw === 'job-hunt'
    ? trackRaw
    : null;

  return {
    output: {
      targetPath,
      trackSlug,
      reasonSummary: cleanSummary(parsed.reasonSummary, 'Policy selected fastest path to first result.'),
    },
    confidence: clamp01(Number(parsed.confidence)),
  };
}

export function validateFrictionTriageDecision(
  parsed: Record<string, unknown>,
  ownerCandidates: string[]
): { output: FrictionTriageDecisionOutput; confidence: number } | null {
  const status = parsed.status === 'new' || parsed.status === 'investigating' || parsed.status === 'resolved'
    ? parsed.status
    : null;
  if (!status) return null;

  const owner = typeof parsed.owner === 'string' ? parsed.owner.trim().toLowerCase() : null;
  const normalizedOwner = owner && ownerCandidates.includes(owner) ? owner : null;

  const rationaleRaw = typeof parsed.rationale === 'string' ? parsed.rationale.trim() : '';
  if (!rationaleRaw) return null;

  return {
    output: {
      status,
      owner: normalizedOwner,
      rationale: rationaleRaw.slice(0, 240),
    },
    confidence: clamp01(Number(parsed.confidence)),
  };
}
