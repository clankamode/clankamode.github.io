import type { SessionIntent } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';

export interface GateIntentInput {
    primaryConceptSlug: string | null;
    userState: UserLearningState | null;
    articleSlug: string;
    pillarSlug: string;
}

/** Derives state-aware intent for the Gate. Pure function; priority: stubborn → bridge → tradeoff → foundation. */
export function deriveStateAwareIntent(input: GateIntentInput): SessionIntent {
    const { primaryConceptSlug, userState, articleSlug, pillarSlug } = input;

    const label = primaryConceptSlug
        ? formatSlug(primaryConceptSlug)
        : formatSlug(articleSlug);

    if (!userState || !primaryConceptSlug) {
        return deriveStaticIntent(articleSlug, pillarSlug);
    }

    if (userState.stubbornConcepts.includes(primaryConceptSlug)) {
        return {
            type: 'practice',
            text: `Build: This reinforces ${label} because you've encountered it before but haven't internalized it yet.`
        };
    }

    if (userState.lastInternalization && userState.recentConcepts.includes(primaryConceptSlug)) {
        const lastLabel = formatSlug(userState.lastInternalization.conceptSlug);
        return {
            type: 'bridge',
            from: [lastLabel],
            to: [label],
            text: `Master: This connects ${lastLabel} to ${label} because your recent work unlocked this path.`
        };
    }

    if (primaryConceptSlug.includes('tradeoff') || primaryConceptSlug.includes('vs')) {
        return {
            type: 'tradeoff',
            text: `Trade: This reveals the tradeoff in ${label} because the default intuition breaks here.`
        };
    }

    return {
        type: 'foundation',
        text: `This builds ${label} because it's the foundation for what comes next.`
    };
}

/**
 * Static fallbacks for when no user state is available.
 */
export function deriveStaticIntent(articleSlug: string, pillarSlug: string): SessionIntent {
    if (pillarSlug === 'dsa') {
        if (articleSlug.includes('array')) {
            return {
                type: 'foundation',
                text: 'Master the O(1) access pattern that underlies all contiguous memory structures.'
            };
        }
        if (articleSlug.includes('list')) {
            return {
                type: 'bridge',
                from: ['Arrays'],
                to: ['Linked Lists'],
                text: "Build on your knowledge of Arrays. This session breaks the contiguous-memory assumption."
            };
        }
        if (articleSlug.includes('hash')) {
            return {
                type: 'tradeoff',
                text: 'Trade space complexity for O(1) time complexity. The most important tradeoff in engineering.'
            };
        }
    }

    return {
        type: 'foundation',
        text: 'Build the core mental models required for advanced problem solving.'
    };
}

function formatSlug(slug: string): string {
    const parts = slug.split('.');
    const name = parts[parts.length - 1];
    return name.replace(/-/g, ' ').replace(/_/g, ' ');
}
