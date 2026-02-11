import type { SessionIntent, SessionItem, LearningDelta } from '@/lib/progress';


export function validateSessionIntent(i: SessionIntent): string[] {
    const errs: string[] = [];
    const text = i.text?.trim() ?? '';
    if (text.length < 24) errs.push('intent.text too short (min 24 chars)');

    const mustHave = /(because|so\s+that|breaks|reveals|connects|assumption|tradeoff)/i;
    if (!mustHave.test(text)) errs.push('intent.text lacks causal lexicon');

    const banned = /(master|crush|level\s*up|grind|hustle|unlock\s+your\s+potential|transform\s+your\s+life)/i;
    if (banned.test(text)) errs.push('intent.text contains motivational language');

    const checkArr = (label: string, arr?: string[]) => {
        if (!arr) return;
        if (arr.some(s => s.trim().length < 2 || s.trim().length > 48)) {
            errs.push(`${label} entries length invalid (must be 2-48 chars)`);
        }
    };

    if (i.type === 'bridge') {
        if (!i.from?.length) errs.push('bridge intent requires from[]');
        if (!i.to?.length) errs.push('bridge intent requires to[]');
    }
    checkArr('from', i.from);
    checkArr('to', i.to);

    return errs;
}

export function normalizeDelta(delta: LearningDelta): LearningDelta {
    const clean = (xs: string[]) =>
        xs.map(s => s.trim())
            .filter(Boolean)
            .filter(s => s.length >= 6 && s.length <= 60)
            .filter(s => !/[.]\s*$/.test(s))
            .filter(s => !/[\u{1F300}-\u{1FAFF}]/u.test(s)); // emoji range

    const a = clean(delta.introduced);
    const b = clean(delta.reinforced);
    const c = clean(delta.unlocked);

    const seen = new Set<string>();
    const dedupe = (xs: string[]) => xs.filter(x => (seen.has(x.toLowerCase()) ? false : (seen.add(x.toLowerCase()), true)));

    const i = dedupe(a).slice(0, 3);
    const r = dedupe(b).slice(0, 3);
    const u = dedupe(c).slice(0, 3);

    return { introduced: i, reinforced: r, unlocked: u };
}


export type MicroSessionProposal = {
    id: string;
    label: string;              // “Next: Pointer invariants (3 min)”
    estimatedMinutes: number;   // 3–5
    intent: SessionIntent;
    items: Array<{ title: string; href: string; type: 'article' | 'exercise' }>;
};

export interface MicroSessionProvider {
    propose(input: {
        trackSlug: string;
        lastItem?: SessionItem | null;
        delta: LearningDelta;
    }): MicroSessionProposal | null;
}

const DSA_MICRO_MAP: Record<string, { title: string; href: string; intent: SessionIntent; minutes: number }> = {
    'Pointer-based structures': {
        title: 'Pointer invariants (mini)',
        href: '/learn/dsa/pointer-invariants',
        minutes: 3,
        intent: {
            type: 'foundation',
            text: "This makes the pointer mental model concrete so linked structures don’t feel like magic."
        }
    },
    'Contiguous memory tradeoffs': {
        title: 'Contiguous vs linked (mini)',
        href: '/learn/dsa/contiguous-vs-linked',
        minutes: 4,
        intent: {
            type: 'tradeoff',
            text: "This reveals what arrays buy you—and what they force you to pay—before you move to linked structures."
        }
    },
    'O(1) access invariant': {
        title: 'When O(1) lies (mini)',
        href: '/learn/dsa/o1-access-boundary',
        minutes: 3,
        intent: {
            type: 'tradeoff',
            text: "This breaks the ‘O(1) means always fast’ assumption by pinning down the hidden costs."
        }
    }
};

function pickKey(delta: LearningDelta): string | null {
    if (delta.introduced.length) return delta.introduced[0];
    if (delta.unlocked.length) return delta.unlocked[0];
    if (delta.reinforced.length) return delta.reinforced[0];
    return null;
}

export const microSessionProviderV0: MicroSessionProvider = {
    propose({ trackSlug, delta }) {
        const d = normalizeDelta(delta);
        const key = pickKey(d);
        if (!key) return null;

        if (trackSlug === 'dsa') {
            const spec = DSA_MICRO_MAP[key];
            if (!spec) return null;

            const errors = validateSessionIntent(spec.intent);
            if (errors.length > 0) {
                console.warn('MicroSession intent invalid:', errors);
                return null;
            }

            return {
                id: `micro:${trackSlug}:${key}`,
                label: `Next: ${spec.title} (${spec.minutes} min)`,
                estimatedMinutes: spec.minutes,
                intent: spec.intent,
                items: [{ title: spec.title, href: spec.href, type: 'article' }]
            };
        }

        return null;
    }
};
