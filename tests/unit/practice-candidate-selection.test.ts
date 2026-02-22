import { describe, expect, it } from 'vitest';
import { buildPracticePriorityConcepts, selectPracticeRowsForSession } from '@/lib/progress';

function buildRow(input: {
  id: string;
  leetcode: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  conceptTags?: string[];
  conceptSlug?: string | null;
}) {
  return {
    id: input.id,
    name: `Question ${input.id}`,
    leetcode_number: input.leetcode,
    leetcode_url: `https://leetcode.com/problems/${input.id}`,
    difficulty: input.difficulty,
    prompt_full: 'Prompt',
    source: ['PERALTA_75'],
    concept_slug: input.conceptSlug ?? null,
    concept_tags: input.conceptTags ?? [],
  };
}

describe('practice candidate selection', () => {
  it('prioritizes Peralta rows before fallback rows', () => {
    const peraltaRows = [
      buildRow({ id: 'peralta-easy-1', leetcode: 1, difficulty: 'Easy', conceptTags: ['hash.o1-average-lookup'] }),
      buildRow({ id: 'peralta-medium-1', leetcode: 2, difficulty: 'Medium', conceptTags: ['heap.priority-queue'] }),
    ];

    const fallbackRows = [
      buildRow({ id: 'mock-easy-1', leetcode: 3, difficulty: 'Easy' }),
      buildRow({ id: 'mock-easy-2', leetcode: 4, difficulty: 'Easy' }),
      buildRow({ id: 'mock-medium-1', leetcode: 5, difficulty: 'Medium' }),
    ];

    const selected = selectPracticeRowsForSession({
      peraltaRows,
      fallbackRows,
      targetDifficulty: 'Easy',
      seed: 'seed-a',
      priorityConcepts: [],
    });

    expect(selected[0]?.row.id.startsWith('peralta')).toBe(true);
    expect(selected.some((entry) => entry.row.id === 'peralta-easy-1')).toBe(true);
  });

  it('ranks Peralta rows by concept overlap priority', () => {
    const peraltaRows = [
      buildRow({ id: 'peralta-no-match', leetcode: 11, difficulty: 'Easy', conceptTags: ['hash.o1-average-lookup'] }),
      buildRow({ id: 'peralta-match', leetcode: 12, difficulty: 'Easy', conceptTags: ['graph.traversal-bfs'] }),
    ];

    const selected = selectPracticeRowsForSession({
      peraltaRows,
      fallbackRows: [],
      targetDifficulty: 'Easy',
      seed: 'seed-b',
      priorityConcepts: ['graph.traversal-bfs'],
    });

    expect(selected[0]?.row.id).toBe('peralta-match');
    expect(selected[0]?.matchedConceptSlug).toBe('graph.traversal-bfs');
  });

  it('falls back to mock pool when Peralta pool is insufficient', () => {
    const fallbackRows = [
      buildRow({ id: 'mock-easy-1', leetcode: 21, difficulty: 'Easy' }),
      buildRow({ id: 'mock-medium-1', leetcode: 22, difficulty: 'Medium' }),
    ];

    const selected = selectPracticeRowsForSession({
      peraltaRows: [],
      fallbackRows,
      targetDifficulty: 'Easy',
      seed: 'seed-c',
      priorityConcepts: [],
    });

    expect(selected.length).toBeGreaterThan(0);
    expect(selected.every((entry) => entry.row.id.startsWith('mock'))).toBe(true);
  });

  it('builds stable priority concept ordering from user state', () => {
    const priorities = buildPracticePriorityConcepts({
      stubbornConcepts: ['graph.traversal-bfs', 'graph.traversal-bfs'],
      recentConcepts: ['heap.priority-queue', 'graph.traversal-bfs'],
      failureModes: [],
      aggregateHistory: [],
    });

    expect(priorities).toEqual(['graph.traversal-bfs', 'heap.priority-queue']);
  });
});
