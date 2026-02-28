import { supabase } from '@/lib/supabase';
import { PRACTICE_QUESTIONS_TABLE } from '@/lib/progress/constants';
import { buildIdentityFilter, isPracticeTrack } from '@/lib/progress/identity';
import { formatConceptLabel } from '@/lib/progress/helpers';
import {
  buildPracticePriorityConcepts,
  extractPracticeConceptTags,
  selectPracticeRowsForSession,
} from '@/lib/progress/practice-selection';
import type { UserLearningState } from '@/types/micro';
import type {
  PracticeDifficulty,
  PracticePerformance,
  PracticeQuestionRow,
  PracticeRowSources,
  SessionItem,
} from '@/lib/progress/types';

function estimatePracticeMinutes(difficulty: PracticeDifficulty): number {
  switch (difficulty) {
    case 'Easy':
      return 10;
    case 'Medium':
      return 15;
    case 'Hard':
      return 20;
    default:
      return 12;
  }
}

export async function derivePracticePerformance(userId: string, googleId?: string): Promise<PracticePerformance> {
  const { data, error } = await supabase
    .from('TestSession')
    .select('score_percentage, completed_at')
    .or(buildIdentityFilter(userId, googleId))
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    return {
      recentScores: [],
      targetDifficulty: 'Easy',
      rationale: 'Starting at Easy because there is no recent assessment history yet.',
    };
  }

  const recentScores = data
    .map((row) => Number(row.score_percentage))
    .filter((score) => Number.isFinite(score));

  if (recentScores.length === 0) {
    return {
      recentScores: [],
      targetDifficulty: 'Easy',
      rationale: 'Starting at Easy because recent assessment scores were unavailable.',
    };
  }

  const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const lastTwo = recentScores.slice(0, 2);
  const hasConsistentHighRecent = lastTwo.length === 2 && lastTwo.every((score) => score >= 85);
  const hasConsistentLowRecent = lastTwo.length === 2 && lastTwo.every((score) => score < 60);

  if (hasConsistentHighRecent && avgScore >= 80) {
    return {
      recentScores,
      targetDifficulty: 'Hard',
      rationale: `Ramping to Hard because recent scores are strong (${Math.round(avgScore)}% avg).`,
    };
  }

  if (hasConsistentLowRecent || avgScore < 65) {
    return {
      recentScores,
      targetDifficulty: 'Easy',
      rationale: `Staying at Easy to rebuild fundamentals (${Math.round(avgScore)}% avg).`,
    };
  }

  return {
    recentScores,
    targetDifficulty: 'Medium',
    rationale: `Ramping to Medium based on steady recent performance (${Math.round(avgScore)}% avg).`,
  };
}

async function fetchPracticeRowsBySource(source: 'PERALTA_75' | 'MOCK_ASSESSMENTS'): Promise<PracticeQuestionRow[]> {
  const [easyResult, mediumResult, hardResult] = await Promise.all([
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Easy')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(24),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Medium')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(24),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Hard')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(16),
  ]);

  if (easyResult.error || mediumResult.error || hardResult.error) {
    return [];
  }

  return [
    ...((easyResult.data || []) as PracticeQuestionRow[]),
    ...((mediumResult.data || []) as PracticeQuestionRow[]),
    ...((hardResult.data || []) as PracticeQuestionRow[]),
  ];
}

export async function fetchPracticeRowSources(): Promise<PracticeRowSources> {
  const [peraltaRows, fallbackRows] = await Promise.all([
    fetchPracticeRowsBySource('PERALTA_75'),
    fetchPracticeRowsBySource('MOCK_ASSESSMENTS'),
  ]);

  return { peraltaRows, fallbackRows };
}

async function fetchConceptLabelMap(trackSlug: string, conceptSlugs: string[]): Promise<Map<string, string>> {
  if (conceptSlugs.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from('Concepts')
    .select('slug, label')
    .eq('track_slug', trackSlug)
    .in('slug', conceptSlugs);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map<string, string>(data.map((row) => [row.slug, row.label]));
}

export async function buildPracticeSessionCandidatesFromRows(
  trackSlug: string,
  targetDifficulty: PracticeDifficulty,
  rationale: string,
  seed: string,
  rowSources: PracticeRowSources,
  userState?: UserLearningState | null
): Promise<SessionItem[]> {
  if (!isPracticeTrack(trackSlug)) {
    return [];
  }

  const priorityConcepts = buildPracticePriorityConcepts(userState);
  const selectedRows = selectPracticeRowsForSession({
    peraltaRows: rowSources.peraltaRows,
    fallbackRows: rowSources.fallbackRows,
    targetDifficulty,
    seed,
    priorityConcepts,
  });

  if (selectedRows.length === 0) {
    return [];
  }

  const conceptSlugs = Array.from(new Set(
    selectedRows.flatMap((entry) => extractPracticeConceptTags(entry.row))
  ));
  const conceptLabelMap = await fetchConceptLabelMap(trackSlug, conceptSlugs);

  return selectedRows.map(({ row, difficulty, matchedConceptSlug }) => {
    const fallbackConceptSlug = extractPracticeConceptTags(row)[0] || null;
    const resolvedConceptSlug = matchedConceptSlug || fallbackConceptSlug;
    const resolvedConceptLabel = resolvedConceptSlug
      ? (conceptLabelMap.get(resolvedConceptSlug) || formatConceptLabel(resolvedConceptSlug))
      : null;

    return {
      type: 'practice',
      title: row.name,
      subtitle: `${difficulty} coding assessment`,
      pillarSlug: trackSlug,
      href: `/session/practice/${row.leetcode_number}`,
      estMinutes: estimatePracticeMinutes(difficulty),
      intent: {
        type: 'practice',
        text: `${rationale} Solve ${row.name} because live reps convert recognition into retrieval speed.`,
      },
      confidence: 0.86,
      targetConcept: resolvedConceptLabel || `${difficulty} interview problem solving`,
      practiceQuestionId: String(row.leetcode_number),
      practiceQuestionUrl: row.leetcode_url,
      practiceDifficulty: difficulty,
      practiceQuestionDescription: row.prompt_full,
      primaryConceptSlug: resolvedConceptSlug,
    };
  });
}
