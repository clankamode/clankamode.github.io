import { test, expect } from '@playwright/test';
import type { Concept, ConceptDependency, UserConceptStats } from '../src/types/concepts';
import { proposeMicroSession } from '../src/lib/micro-proposer';
import type { ConceptIndex, ConceptIndexItem, MicroProposal, UserLearningState } from '../src/types/micro';
import type { LearningDelta, SessionItem } from '../src/lib/progress';
import { planSessionItemsWithLLM } from '../src/lib/session-llm-planner';

function computeIntroducedReinforced(
    seenTags: string[],
    priorStats: UserConceptStats[]
): { introduced: string[]; reinforced: string[] } {
    const statsMap = new Map<string, number>();
    for (const stat of priorStats) {
        statsMap.set(stat.concept_slug, stat.exposures);
    }
    const introduced: string[] = [];
    const reinforced: string[] = [];
    for (const tag of seenTags) {
        const prevExposures = statsMap.get(tag) ?? 0;
        if (prevExposures === 0) introduced.push(tag);
        else reinforced.push(tag);
    }
    return { introduced, reinforced };
}

function computeUnlocked(
    seenTags: string[],
    priorStats: UserConceptStats[],
    dependencies: ConceptDependency[],
    knownConcepts: Set<string>
): string[] {
    const prevSatisfied = new Set<string>();
    for (const stat of priorStats) {
        if (stat.exposures >= 2 || stat.internalized_count >= 1) {
            prevSatisfied.add(stat.concept_slug);
        }
    }
    const statsMap = new Map<string, { exposures: number, internalized: number }>();
    for (const stat of priorStats) {
        statsMap.set(stat.concept_slug, { exposures: stat.exposures, internalized: stat.internalized_count });
    }

    const postSatisfied = new Set(prevSatisfied);
    for (const tag of seenTags) {
        const stat = statsMap.get(tag);
        const priorExposures = stat?.exposures ?? 0;
        const internalizedCount = stat?.internalized ?? 0;
        if (priorExposures >= 1 || internalizedCount >= 1) {
            postSatisfied.add(tag);
        }
    }

    const depsMap = new Map<string, string[]>();
    for (const dep of dependencies) {
        if (!knownConcepts.has(dep.concept_slug) || !knownConcepts.has(dep.depends_on_slug)) continue;
        if (!depsMap.has(dep.concept_slug)) depsMap.set(dep.concept_slug, []);
        depsMap.get(dep.concept_slug)!.push(dep.depends_on_slug);
    }

    const unlocked: string[] = [];
    for (const [concept, hardDeps] of Array.from(depsMap.entries())) {
        if (hardDeps.length === 0) continue;
        const prevOk = hardDeps.every(dep => prevSatisfied.has(dep));
        const postOk = hardDeps.every(dep => postSatisfied.has(dep));
        if (!prevOk && postOk) unlocked.push(concept);
    }
    return unlocked;
}

test.describe('Delta Derivation Algorithm', () => {
    const mockConcepts: Concept[] = [
        { id: '1', slug: 'array.contiguous-memory', label: 'Contiguous memory layout', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
        { id: '2', slug: 'array.random-access-o1', label: 'O(1) random access', short_label: 'O(1) access', description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
        { id: '3', slug: 'list.pointer-invariants', label: 'Pointer invariants', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
        { id: '4', slug: 'list.traversal-cost', label: 'O(n) traversal cost', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
        { id: '5', slug: 'big-o.time-complexity', label: 'Time complexity', short_label: null, description: null, track_slug: 'dsa', kind: 'concept', created_at: '' },
    ];

    const mockDependencies: ConceptDependency[] = [
        { track_slug: 'dsa', concept_slug: 'list.pointer-invariants', depends_on_slug: 'array.contiguous-memory', weight: 2, created_at: '' },
        { track_slug: 'dsa', concept_slug: 'list.traversal-cost', depends_on_slug: 'big-o.time-complexity', weight: 2, created_at: '' },
    ];

    test.describe('computeIntroducedReinforced', () => {
        test('should mark tag as introduced when exposures == 0', () => {
            const seenTags = ['array.contiguous-memory', 'array.random-access-o1'];
            const priorStats: UserConceptStats[] = [];
            const { introduced, reinforced } = computeIntroducedReinforced(seenTags, priorStats);
            expect(introduced).toContain('array.contiguous-memory');
            expect(introduced).toContain('array.random-access-o1');
            expect(reinforced).toHaveLength(0);
        });

        test('should mark tag as reinforced when exposures >= 1', () => {
            const seenTags = ['array.contiguous-memory', 'array.random-access-o1'];
            const priorStats: UserConceptStats[] = [
                { email: 'u1', track_slug: 'dsa', concept_slug: 'array.contiguous-memory', exposures: 2, internalized_count: 0, last_seen_at: null }
            ];
            const { introduced, reinforced } = computeIntroducedReinforced(seenTags, priorStats);
            expect(introduced).toContain('array.random-access-o1');
            expect(reinforced).toContain('array.contiguous-memory');
        });

        test('should produce stable, deterministic output', () => {
            const seenTags = ['array.random-access-o1', 'array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [];
            const result1 = computeIntroducedReinforced(seenTags, priorStats);
            const result2 = computeIntroducedReinforced(seenTags, priorStats);
            expect(result1).toEqual(result2);
        });
    });

    test.describe('computeUnlocked', () => {
        test('should NOT unlock concepts with zero hard deps', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [];
            const deps = mockDependencies;
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            const unlocked = computeUnlocked(seenTags, priorStats, deps, knownConcepts);
            expect(unlocked).not.toContain('array.contiguous-memory');
        });

        test('should NOT unlock if prereq gets its first exposure in this session', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [];
            const deps = mockDependencies;
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            const unlocked = computeUnlocked(seenTags, priorStats, deps, knownConcepts);
            expect(unlocked).not.toContain('list.pointer-invariants');
        });

        test('should unlock if prereq gets its second exposure in this session', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [
                { email: 'u1', track_slug: 'dsa', concept_slug: 'array.contiguous-memory', exposures: 1, internalized_count: 0, last_seen_at: null }
            ];
            const deps = mockDependencies;
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            const unlocked = computeUnlocked(seenTags, priorStats, deps, knownConcepts);
            expect(unlocked).toContain('list.pointer-invariants');
        });

        test('should NOT unlock if prereqs were already fully satisfied (2+ exposures)', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [
                { email: 'u1', track_slug: 'dsa', concept_slug: 'array.contiguous-memory', exposures: 2, internalized_count: 0, last_seen_at: null }
            ];
            const deps = mockDependencies;
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            const unlocked = computeUnlocked(seenTags, priorStats, deps, knownConcepts);
            expect(unlocked).not.toContain('list.pointer-invariants');
        });

        test('should unlock immediately if prereq is internalized', () => {
            const seenTags = ['array.contiguous-memory']; // user sees it again
            const priorStats: UserConceptStats[] = [
                { email: 'u1', track_slug: 'dsa', concept_slug: 'array.contiguous-memory', exposures: 0, internalized_count: 1, last_seen_at: null }
            ];
            const deps = mockDependencies;
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            // In this case, it was already satisfied in prev. So it shouldn't be in 'unlocked' (which is the transition).
            const unlocked = computeUnlocked(seenTags, priorStats, deps, knownConcepts);
            expect(unlocked).not.toContain('list.pointer-invariants');
        });

        test('should handle missing dependency references gracefully', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [];
            const badDeps: ConceptDependency[] = [
                { track_slug: 'dsa', concept_slug: 'unknown.concept', depends_on_slug: 'array.contiguous-memory', weight: 2, created_at: '' }
            ];
            const knownConcepts = new Set(mockConcepts.map(c => c.slug));
            const unlocked = computeUnlocked(seenTags, priorStats, badDeps, knownConcepts);
            expect(unlocked).not.toContain('unknown.concept');
        });
    });

    test.describe('edge cases', () => {
        test('should return empty delta when seenTags is empty', () => {
            const seenTags: string[] = [];
            const priorStats: UserConceptStats[] = [];
            const { introduced, reinforced } = computeIntroducedReinforced(seenTags, priorStats);
            expect(introduced).toHaveLength(0);
            expect(reinforced).toHaveLength(0);
        });

        test('should treat tag as reinforced if appears in both buckets due to bad stats', () => {
            const seenTags = ['array.contiguous-memory'];
            const priorStats: UserConceptStats[] = [
                { email: 'u1', track_slug: 'dsa', concept_slug: 'array.contiguous-memory', exposures: 1, internalized_count: 0, last_seen_at: null }
            ];
            const { introduced, reinforced } = computeIntroducedReinforced(seenTags, priorStats);
            expect(reinforced).toContain('array.contiguous-memory');
            expect(introduced).not.toContain('array.contiguous-memory');
        });
    });
});

test.describe('MicroSession Proposal (V1)', () => {
    const mockIndex: ConceptIndex = {
        'intro.concept': [
            { href: '/learn/intro', title: 'Intro Item', type: 'learn', estMinutes: 3, isPrimary: true }
        ],
        'unlocked.concept': [
            { href: '/learn/unlocked', title: 'Unlocked Item', type: 'learn', estMinutes: 4, isPrimary: false }
        ],
        'reinforced.concept': [
            { href: '/learn/reinforced', title: 'Reinforced Item', type: 'learn', estMinutes: 2, isPrimary: false }
        ],
        'long.concept': [
            { href: '/learn/long', title: 'Long Item', type: 'learn', estMinutes: 10, isPrimary: true }
        ],
        'long.practice': [
            { href: '/practice/long', title: 'Long Practice', type: 'practice', estMinutes: 15, isPrimary: true }
        ],
        'reinforced.preference': [
            { href: '/learn/reinforced-primary', title: 'Reinforced Learn', type: 'learn', estMinutes: 3, isPrimary: true },
            { href: '/practice/reinforced', title: 'Reinforced Practice', type: 'practice', estMinutes: 12, isPrimary: false }
        ],
        'multi.candidate': [
            { href: '/learn/slow', title: 'Slow', type: 'learn', estMinutes: 5, isPrimary: false },
            { href: '/learn/fast-primary', title: 'Fast Primary', type: 'learn', estMinutes: 3, isPrimary: true },
            { href: '/practice/quiz', title: 'Quiz', type: 'practice', estMinutes: 3, isPrimary: false }
        ]
    };

    const emptyDelta: LearningDelta = { introduced: [], reinforced: [], unlocked: [] };

    test('returns null when delta is empty', () => {
        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta: emptyDelta,
            conceptIndex: mockIndex
        });
        expect(result).toBeNull();
    });

    test('chooses introduced over unlocked/reinforced (Priority 1)', () => {
        const delta: LearningDelta = {
            introduced: ['intro.concept'],
            unlocked: ['unlocked.concept'],
            reinforced: ['reinforced.concept']
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.targetConcept).toBe('intro.concept');
        expect(result?.intent.text).toContain('first load-bearing piece');
    });

    test('chooses unlocked over reinforced (Priority 2)', () => {
        const delta: LearningDelta = {
            introduced: [],
            unlocked: ['unlocked.concept'],
            reinforced: ['reinforced.concept']
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.targetConcept).toBe('unlocked.concept');
        expect(result?.intent.text).toContain('connects your prerequisites');
    });

    test('skips concepts with no indexed items', () => {
        const delta: LearningDelta = {
            introduced: ['missing.concept'],
            unlocked: ['unlocked.concept'],
            reinforced: []
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.targetConcept).toBe('unlocked.concept');
    });

    test('returns null if best candidate > 5 minutes (Honesty)', () => {
        const delta: LearningDelta = {
            introduced: ['long.concept'],
            unlocked: [],
            reinforced: []
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result).toBeNull();
    });

    test('allows longer practice candidates within practice cap', () => {
        const delta: LearningDelta = {
            introduced: ['long.practice'],
            unlocked: [],
            reinforced: []
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.item.type).toBe('practice');
        expect(result?.item.estMinutes).toBe(15);
    });

    test('prefers primary_concept + short time (Heuristics)', () => {
        const delta: LearningDelta = {
            introduced: ['multi.candidate'],
            unlocked: [],
            reinforced: []
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.item.href).toBe('/learn/fast-primary');
        expect(result?.item.isPrimary).toBe(true);
    });

    test('prefers practice candidates for reinforced concepts', () => {
        const delta: LearningDelta = {
            introduced: [],
            unlocked: [],
            reinforced: ['reinforced.preference']
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(result?.item.href).toBe('/practice/reinforced');
        expect(result?.item.type).toBe('practice');
    });

    test('generates deterministic output for same input', () => {
        const delta: LearningDelta = {
            introduced: ['multi.candidate'],
            unlocked: [],
            reinforced: []
        };

        const r1 = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });
        const r2 = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex });

        expect(r1).toEqual(r2);
    });
});

test.describe('MicroSession Proposal V2 (State-Aware)', () => {
    const mockIndex: ConceptIndex = {
        'stubborn.concept': [{ href: '/stubborn', title: 'Stubborn', type: 'practice', estMinutes: 2, isPrimary: true }],
        'unlocked.concept': [{ href: '/unlocked', title: 'Unlocked', type: 'learn', estMinutes: 4, isPrimary: true }],
        'tradeoff.vs.concept': [{ href: '/tradeoff', title: 'Tradeoff', type: 'learn', estMinutes: 5, isPrimary: true }],
        'foundation.concept': [{ href: '/foundation', title: 'Foundation', type: 'learn', estMinutes: 3, isPrimary: true }],
    };

    const emptyState: UserLearningState = {
        stubbornConcepts: [],
        recentConcepts: [],
        nextConceptSlug: undefined,
        failureModes: [],
        aggregateHistory: []
    };

    test('should prioritize Stubborn concepts and force Practice intent', () => {
        const delta: LearningDelta = { introduced: [], reinforced: [], unlocked: [] };
        const state: UserLearningState = {
            ...emptyState,
            stubbornConcepts: ['stubborn.concept']
        };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex, userState: state });

        expect(result?.targetConcept).toBe('stubborn.concept');
        expect(result?.intent.type).toBe('practice');
        expect(result?.intent.text).toContain('haven’t internalized it yet');
    });

    test('should trigger Bridge intent for Unlocked concepts', () => {
        const delta: LearningDelta = { introduced: [], reinforced: [], unlocked: ['unlocked.concept'] };
        const state: UserLearningState = { ...emptyState };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex, userState: state });

        expect(result?.targetConcept).toBe('unlocked.concept');
        expect(result?.intent.type).toBe('bridge');
        expect(result?.intent.text).toContain('connects your prerequisites');
    });

    test('should trigger Tradeoff intent for concepts with "tradeoff" or "vs" in slug', () => {
        const delta: LearningDelta = { introduced: ['tradeoff.vs.concept'], reinforced: [], unlocked: [] };
        const state: UserLearningState = { ...emptyState };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex, userState: state });

        expect(result?.targetConcept).toBe('tradeoff.vs.concept');
        expect(result?.intent.type).toBe('tradeoff');
        expect(result?.intent.text).toContain('the ‘default’ intuition breaks here');
    });

    test('should fall back to Foundation intent by default for introduced concepts', () => {
        const delta: LearningDelta = { introduced: ['foundation.concept'], reinforced: [], unlocked: [] };
        const state: UserLearningState = { ...emptyState };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex, userState: state });

        expect(result?.targetConcept).toBe('foundation.concept');
        expect(result?.intent.type).toBe('foundation');
        expect(result?.intent.text).toContain('prerequisite your recent sessions keep bumping into');
    });

    test('should maintain V1 priority sequence if no stubborn concepts exist', () => {
        const delta: LearningDelta = {
            introduced: ['foundation.concept'],
            reinforced: [],
            unlocked: ['unlocked.concept']
        };
        const state: UserLearningState = { ...emptyState };

        const result = proposeMicroSession({ trackSlug: 'dsa', delta, conceptIndex: mockIndex, userState: state });

        expect(result?.targetConcept).toBe('foundation.concept');
    });
});

test.describe('Wiring-Level Integration', () => {
    const mockIndex: ConceptIndex = {
        'stubborn.concept': [{ href: '/stubborn', title: 'Stubborn', type: 'practice', estMinutes: 2, isPrimary: true }],
        'unlocked.concept': [{ href: '/unlocked', title: 'Unlocked', type: 'learn', estMinutes: 4, isPrimary: true }],
        'long.concept': [{ href: '/long', title: 'Long', type: 'learn', estMinutes: 10, isPrimary: true }],
        'short.unlocked': [{ href: '/short-unlocked', title: 'Short Unlocked', type: 'learn', estMinutes: 3, isPrimary: true }],
    };

    test('stubborn concept in userState produces practice intent', () => {
        const userState: UserLearningState = {
            stubbornConcepts: ['stubborn.concept'],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };
        const delta: LearningDelta = { introduced: [], reinforced: [], unlocked: [] };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta,
            conceptIndex: mockIndex,
            userState
        });

        expect(result).not.toBeNull();
        expect(result?.targetConcept).toBe('stubborn.concept');
        expect(result?.intent.type).toBe('practice');
        expect(result?.intent.text).toContain('internalized it yet');
    });

    test('unlocked deps transition produces bridge intent', () => {
        const userState: UserLearningState = {
            stubbornConcepts: [],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };
        const delta: LearningDelta = { introduced: [], reinforced: [], unlocked: ['short.unlocked'] };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta,
            conceptIndex: mockIndex,
            userState
        });

        expect(result).not.toBeNull();
        expect(result?.targetConcept).toBe('short.unlocked');
        expect(result?.intent.type).toBe('bridge');
        expect(result?.intent.text).toContain('connects your prerequisites');
    });

    test('stubborn concept with only learn items returns null (honest fallback)', () => {
        const learnOnlyIndex: ConceptIndex = {
            'stubborn.concept': [{ href: '/learn', title: 'Learn', type: 'learn', estMinutes: 3, isPrimary: true }]
        };
        const userState: UserLearningState = {
            stubbornConcepts: ['stubborn.concept'],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };
        const delta: LearningDelta = { introduced: ['other.concept'], reinforced: [], unlocked: [] };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta,
            conceptIndex: learnOnlyIndex,
            userState
        });

        expect(result).toBeNull();
    });

    test('proposal is null when only candidate exceeds 5min cap', () => {
        const longOnlyIndex: ConceptIndex = {
            'long.concept': [{ href: '/long', title: 'Long', type: 'learn', estMinutes: 10, isPrimary: true }]
        };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta: { introduced: ['long.concept'], reinforced: [], unlocked: [] },
            conceptIndex: longOnlyIndex
        });

        expect(result).toBeNull();
    });

    test('proposal is null when delta is empty and no stubborn concepts', () => {
        const userState: UserLearningState = {
            stubbornConcepts: [],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };
        const delta: LearningDelta = { introduced: [], reinforced: [], unlocked: [] };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta,
            conceptIndex: mockIndex,
            userState
        });

        expect(result).toBeNull();
    });

    test('stubborn takes priority over delta concepts', () => {
        const userState: UserLearningState = {
            stubbornConcepts: ['stubborn.concept'],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };
        const delta: LearningDelta = { introduced: ['unlocked.concept'], reinforced: [], unlocked: [] };

        const result = proposeMicroSession({
            trackSlug: 'dsa',
            delta,
            conceptIndex: mockIndex,
            userState
        });

        // Stubborn should take priority over introduced
        expect(result?.targetConcept).toBe('stubborn.concept');
        expect(result?.intent.type).toBe('practice');
    });
});

test.describe('Gate Intent Wiring (O2 Strategy A)', () => {
    // Import the pure function directly for testing
    // Gate intent = deriveStateAwareIntent(userState, primaryConceptSlug, deps, concepts)

    test('gate_intent_stubborn_practice: stubborn concept produces practice intent', async () => {
        // Dynamic import to get the Gate intent function
        const { deriveStateAwareIntent } = await import('../src/lib/gate-intent');

        const userState: UserLearningState = {
            stubbornConcepts: ['arrays.basics'],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };

        const intent = deriveStateAwareIntent({
            primaryConceptSlug: 'arrays.basics',
            userState,
            articleSlug: 'intro-to-arrays',
            pillarSlug: 'dsa'
        });

        expect(intent.type).toBe('practice');
        expect(intent.text).toContain('reinforces');
        expect(intent.text).toContain('internalized');
    });

    test('gate_intent_recent_bridge: recent continuation produces bridge intent', async () => {
        const { deriveStateAwareIntent } = await import('../src/lib/gate-intent');

        const userState: UserLearningState = {
            stubbornConcepts: [],
            recentConcepts: ['linked-lists.intro'],
            lastInternalization: {
                conceptSlug: 'arrays.basics',
                picked: 'learned',
                createdAt: new Date().toISOString()
            },
            failureModes: [],
            aggregateHistory: []
        };

        const intent = deriveStateAwareIntent({
            primaryConceptSlug: 'linked-lists.intro',
            userState,
            articleSlug: 'intro-to-linked-lists',
            pillarSlug: 'dsa'
        });

        expect(intent.type).toBe('bridge');
        expect(intent.from).toContain('basics');
        expect(intent.text).toContain('connects');
    });

    test('gate_intent_static_fallback: no userState uses static template', async () => {
        const { deriveStateAwareIntent } = await import('../src/lib/gate-intent');

        const intent = deriveStateAwareIntent({
            primaryConceptSlug: null,
            userState: null,
            articleSlug: 'intro-to-arrays',
            pillarSlug: 'dsa'
        });

        expect(intent.type).toBe('foundation');
        expect(intent.text).toContain('O(1) access pattern');
    });

    test('gate_intent_tradeoff: tradeoff concept produces tradeoff intent', async () => {
        const { deriveStateAwareIntent } = await import('../src/lib/gate-intent');

        const userState: UserLearningState = {
            stubbornConcepts: [],
            recentConcepts: [],
            failureModes: [],
            aggregateHistory: []
        };

        const intent = deriveStateAwareIntent({
            primaryConceptSlug: 'time-vs-space-tradeoff',
            userState,
            articleSlug: 'time-space-tradeoffs',
            pillarSlug: 'dsa'
        });

        expect(intent.type).toBe('tradeoff');
        expect(intent.text).toContain('reveals the tradeoff');
    });
});
