import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPlannerPrompt } from '../../src/lib/session-llm-planner';

describe('Session Planner Prompt Invariants', () => {
    const baseInput = {
        trackName: 'Test Track',
        trackSlug: 'test-track',
        maxItems: 3,
        requirePracticeItem: false,
        hasPracticeCandidate: false,
        recentActivityTitles: [],
        userState: {
            stubbornConcepts: [],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        },
        practiceTargetDifficulty: null,
        compactCandidates: []
    };

    it('Invariant: Should contain Decision Rubric instructions', () => {
        const prompt = buildPlannerPrompt(baseInput as any);
        expect(prompt).toContain('Decision rubric (must follow):');
        expect(prompt).toContain('leverage (0-3)');
        expect(prompt).toContain('fit_to_failure_modes (0-3)');
    });

    it('Invariant: Should contain Diversity & Selection rules', () => {
        const prompt = buildPlannerPrompt(baseInput as any);
        expect(prompt).toContain('Diversity & Selection rules:');
        expect(prompt).toContain('ensure at least 2 distinct targetConcepts');
        expect(prompt).toContain('Avoid selecting 2 items from the same article');
    });

    it('Invariant: Should contain Selection Hygiene (Internal Scoring)', () => {
        const prompt = buildPlannerPrompt(baseInput as any);
        expect(prompt).toContain('Selection hygiene:');
        expect(prompt).toContain('internally compute scores for ALL candidates');
    });

    it('Invariant: Should contain specific redundancy penalties', () => {
        const prompt = buildPlannerPrompt(baseInput as any);
        expect(prompt).toContain('Redundancy is HIGH (-3)');
        expect(prompt).toContain('Redundancy is MED (-2)');
    });
});
