import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Goat Latin Database Invariants', () => {
    const GOAT_LATIN_ID = 'eb5d92f9-eb51-45c8-a05d-4ba22b61ea30';

    it('identifies corruption in Goat Latin test cases', async () => {
        const { data, error } = await supabase
            .from('InterviewQuestions')
            .select('name, test_cases')
            .eq('id', GOAT_LATIN_ID)
            .single();

        if (error) throw error;
        expect(data.name).toBe('Goat Latin');

        const testCases = data.test_cases as { id: number, expected: string, expectedOutput: string }[];
        const tc1 = testCases.find(tc => tc.id === 1);

        expect(tc1).toBeDefined();
        if (!tc1) return;

        expect(tc1.expectedOutput).not.toContain('tele');
        expect(tc1.expected).not.toContain('way');
        expect(tc1.expected).not.toContain('fay');
    });
});
