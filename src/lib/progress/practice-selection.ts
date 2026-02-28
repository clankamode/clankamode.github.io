import type { UserLearningState } from '@/types/micro';
import type {
  PracticeDifficulty,
  PracticeQuestionRow,
  RankedPracticeQuestion,
} from '@/lib/progress/types';

function normalizePracticeDifficulty(value: string): PracticeDifficulty | null {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }
  return null;
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizeConceptSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function extractPracticeConceptTags(row: PracticeQuestionRow): string[] {
  const tags: string[] = [];
  if (Array.isArray(row.concept_tags)) {
    for (const value of row.concept_tags) {
      if (typeof value !== 'string') continue;
      const normalized = normalizeConceptSlug(value);
      if (!normalized || tags.includes(normalized)) continue;
      tags.push(normalized);
    }
  }

  if (typeof row.concept_slug === 'string') {
    const normalized = normalizeConceptSlug(row.concept_slug);
    if (normalized && !tags.includes(normalized)) {
      tags.push(normalized);
    }
  }

  return tags;
}

export function buildPracticePriorityConcepts(userState?: UserLearningState | null): string[] {
  if (!userState) return [];

  const deduped = new Set<string>();
  const ordered: string[] = [];
  for (const slug of [...userState.stubbornConcepts, ...userState.recentConcepts]) {
    if (typeof slug !== 'string') continue;
    const normalized = normalizeConceptSlug(slug);
    if (!normalized || deduped.has(normalized)) continue;
    deduped.add(normalized);
    ordered.push(normalized);
  }

  return ordered;
}

function rankPracticeRowsForSelection(
  rows: PracticeQuestionRow[],
  seed: string,
  priorityConcepts: string[],
  sourceRank: number
): RankedPracticeQuestion[] {
  const priorityIndex = new Map<string, number>(
    priorityConcepts.map((slug, index) => [slug, index])
  );

  const scored = rows
    .map((row) => ({ row, difficulty: normalizePracticeDifficulty(row.difficulty) }))
    .filter((entry): entry is { row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string }; difficulty: PracticeDifficulty } => (
      !!entry.difficulty &&
      entry.row.leetcode_number !== null &&
      entry.row.leetcode_url !== null
    ))
    .map((entry) => {
      const conceptTags = extractPracticeConceptTags(entry.row);
      let bestRank = Number.MAX_SAFE_INTEGER;
      let matchedConceptSlug: string | null = null;

      for (const slug of conceptTags) {
        const rank = priorityIndex.get(slug);
        if (rank === undefined) continue;
        if (rank < bestRank) {
          bestRank = rank;
          matchedConceptSlug = slug;
        }
      }

      return {
        row: entry.row,
        difficulty: entry.difficulty,
        matchedConceptSlug,
        conceptRank: bestRank,
        sourceRank,
      };
    });

  return scored.sort((a, b) => {
    if (a.conceptRank !== b.conceptRank) {
      return a.conceptRank - b.conceptRank;
    }

    if (a.sourceRank !== b.sourceRank) {
      return a.sourceRank - b.sourceRank;
    }

    const scoreA = simpleHash(`${seed}:${a.row.id}`);
    const scoreB = simpleHash(`${seed}:${b.row.id}`);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    return a.row.id.localeCompare(b.row.id);
  }).map(({ row, difficulty, matchedConceptSlug }) => ({
    row,
    difficulty,
    matchedConceptSlug,
  }));
}

export function selectPracticeRowsForSession(input: {
  peraltaRows: PracticeQuestionRow[];
  fallbackRows: PracticeQuestionRow[];
  targetDifficulty: PracticeDifficulty;
  seed: string;
  priorityConcepts: string[];
}): RankedPracticeQuestion[] {
  const rankedPeralta = rankPracticeRowsForSelection(input.peraltaRows, `${input.seed}:peralta`, input.priorityConcepts, 0);
  const rankedFallback = rankPracticeRowsForSelection(input.fallbackRows, `${input.seed}:fallback`, input.priorityConcepts, 1);

  const byDifficulty = {
    Easy: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Easy'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Easy'),
    },
    Medium: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Medium'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Medium'),
    },
    Hard: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Hard'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Hard'),
    },
  } as const;

  const mixByTarget: Record<PracticeDifficulty, { Easy: number; Medium: number; Hard: number }> = {
    Easy: { Easy: 4, Medium: 2, Hard: 0 },
    Medium: { Easy: 2, Medium: 4, Hard: 1 },
    Hard: { Easy: 1, Medium: 3, Hard: 3 },
  };

  const selected: RankedPracticeQuestion[] = [];
  const selectedIds = new Set<string>();
  const mix = mixByTarget[input.targetDifficulty];

  for (const difficulty of ['Easy', 'Medium', 'Hard'] as const) {
    const queue = [...byDifficulty[difficulty].peralta, ...byDifficulty[difficulty].fallback];
    for (const entry of queue) {
      if (selected.length >= 7) break;
      if (selectedIds.has(entry.row.id)) continue;
      selected.push(entry);
      selectedIds.add(entry.row.id);
      if (selected.filter((item) => item.difficulty === difficulty).length >= mix[difficulty]) {
        break;
      }
    }
  }

  const fallbackPool = [...rankedPeralta, ...rankedFallback];
  for (const entry of fallbackPool) {
    if (selected.length >= 7) break;
    if (selectedIds.has(entry.row.id)) continue;
    selected.push(entry);
    selectedIds.add(entry.row.id);
  }

  return selected.slice(0, 7);
}
