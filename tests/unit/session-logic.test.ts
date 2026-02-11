import { describe, it, expect } from 'vitest';
import { resolveDeltaLabels } from '@/lib/delta-derivation';
import type { Concept } from '@/types/concepts';

describe('resolveDeltaLabels', () => {
    const mockDictionary: Concept[] = [
        { id: '1', slug: 'concept-a', label: 'Concept A Label', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
        { id: '2', slug: 'concept-b', label: 'Concept B Label', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
    ];

    it('should replace slugs with labels in the returned delta', () => {
        const rawDelta = {
            introduced: ['concept-a'],
            reinforced: ['concept-b'],
            unlocked: []
        };

        const labeled = resolveDeltaLabels(rawDelta, mockDictionary);

        expect(labeled.introduced).toContain('Concept A Label');
        expect(labeled.reinforced).toContain('Concept B Label');
    });

    it('should keep slugs if no label is found', () => {
        const rawDelta = {
            introduced: ['unknown-concept'],
            reinforced: [],
            unlocked: []
        };

        const labeled = resolveDeltaLabels(rawDelta, mockDictionary);

        expect(labeled.introduced).toContain('unknown-concept');
    });

    it('should return a new object (immutability)', () => {
        const rawDelta = {
            introduced: ['concept-a'],
            reinforced: [],
            unlocked: []
        };

        const labeled = resolveDeltaLabels(rawDelta, mockDictionary);

        expect(labeled).not.toBe(rawDelta);
        expect(rawDelta.introduced).toContain('concept-a'); // Original should be untouched
    });
});
