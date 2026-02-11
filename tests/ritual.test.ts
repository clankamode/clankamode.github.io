import { describe, it, expect } from 'vitest';
import { proposeRitualChoices } from '../src/lib/ritual_prompts';

describe('Ritual Prompts', () => {
    it('returns deterministic choices for known concepts (Array Contiguous Memory)', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'array.contiguous-memory',
            intentType: 'foundation'
        });

        expect(result).not.toBeNull();
        expect(result!.a).toContain('fixed');
        expect(result!.b).toContain('locality');
    });

    it('returns null for unknown concepts (Fail Closed)', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'unknown.entabulator',
            intentType: 'foundation'
        });

        expect(result).toBeNull();
    });

    it('handles tradeoff intent for Linked Lists', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'linked-list.nodes',
            intentType: 'tradeoff'
        });

        expect(result).not.toBeNull();
        // Tradeoff should mention cost/benefit
        const combined = (result!.a + result!.b).toLowerCase();
        expect(combined).toMatch(/memory|scan|pointer/);
    });

    it('handles bridge intent (Array -> List)', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'linked-list.memory',
            intentType: 'bridge'
        });

        expect(result).not.toBeNull();
        expect(result!.a).toContain('contiguity'); // The "from" side
        expect(result!.b).toContain('flexibility'); // The "to" side
    });

    it('ensures copy is less than 72 chars per option', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'array.contiguous-memory',
            intentType: 'foundation'
        });

        if (result) {
            expect(result.a.length).toBeLessThanOrEqual(75); // buffer for tweaks
            expect(result.b.length).toBeLessThanOrEqual(75);
        }
    });

    it('supports Big O foundation', () => {
        const result = proposeRitualChoices({
            primaryConcept: 'big-o.time-complexity',
            intentType: 'foundation'
        });
        expect(result).not.toBeNull();
        expect(result!.a.toLowerCase()).toContain('worst-case');
    });
});
