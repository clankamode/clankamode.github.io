import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('N-Queens (51) test case invariants', () => {
  const runDbInvariantTest = process.env.RUN_DB_INVARIANT_TESTS === '1';

  it.runIf(runDbInvariantTest)('has test cases with sortResult or sorted() in fnCall for order-independence', async () => {
    const { data, error } = await supabase
      .from('InterviewQuestions')
      .select('name, test_cases')
      .eq('leetcode_number', 51)
      .single();

    if (error) throw error;
    expect(data.name).toBe('N-Queens');

    const testCases = data.test_cases as { id: number; fnCall: string; expected: unknown; sortResult?: boolean }[];
    expect(testCases).toBeDefined();
    expect(Array.isArray(testCases)).toBe(true);
    expect(testCases.length).toBeGreaterThanOrEqual(2);

    // The multi-solution test case must use sorted() in fnCall or sortResult:true
    // so that valid solutions in any order pass.
    const multiSolutionCase = testCases.find(tc =>
      typeof tc.fnCall === 'string' && tc.fnCall.includes('solve_n_queens(4)')
    );
    expect(multiSolutionCase).toBeDefined();
    if (!multiSolutionCase) return;

    const isOrderIndependent =
      multiSolutionCase.sortResult === true ||
      multiSolutionCase.fnCall.startsWith('sorted(');
    expect(isOrderIndependent).toBe(true);
  });

  it('correctly sorts N-Queens n=4 solutions for order-independent comparison', () => {
    // Verifies the expected values in the migration are correct.
    // A valid backtracking implementation returns these two boards (in any order).
    const boardA = ['.Q..', '...Q', 'Q...', '..Q.'];
    const boardB = ['..Q.', 'Q...', '...Q', '.Q..'];

    const sorted = [boardA, boardB].sort((a, b) => {
      for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
      }
      return 0;
    });

    // boardB should come first: "..Q." < ".Q.." (second char '.' < 'Q')
    expect(sorted[0]).toEqual(['..Q.', 'Q...', '...Q', '.Q..']);
    expect(sorted[1]).toEqual(['.Q..', '...Q', 'Q...', '..Q.']);
  });
});
