import type { LearningDelta, SessionIntent } from './progress';
import type { ConceptIndex, ConceptIndexItem, MicroProposal, IntentType, UserLearningState } from '../types/micro';

export interface ProposerInput {
    trackSlug: string;
    delta: LearningDelta;
    conceptIndex: ConceptIndex;
    userState?: UserLearningState;
}

export function proposeMicroSession(input: ProposerInput): MicroProposal | null {
    const { delta, conceptIndex, userState } = input;

    if (userState && userState.stubbornConcepts.length > 0) {
        for (const slug of userState.stubbornConcepts) {
            const candidates = conceptIndex[slug] || [];
            const practiceItems = candidates.filter(item => item.type === 'practice' && item.estMinutes <= 5);

            if (practiceItems.length > 0) {
                const bestItem = selectBestCandidate(practiceItems, true);
                const intent = generateIntent(slug, bestItem, delta, userState);
                return {
                    targetConcept: slug,
                    item: bestItem,
                    intent: {
                        type: intent.type as IntentType,
                        text: intent.text
                    }
                };
            }
        }
        return null;
    }

    let targetConcept: string | null = null;
    targetConcept =
        findFirstIndexed(delta.introduced, conceptIndex) ||
        findFirstIndexed(delta.unlocked, conceptIndex) ||
        findFirstIndexed(delta.reinforced, conceptIndex);

    if (!targetConcept) return null;

    const candidates = conceptIndex[targetConcept];
    if (!candidates || candidates.length === 0) return null;

    const bestItem = selectBestCandidate(candidates, false);
    if (bestItem.estMinutes > 5) return null;

    const intent = generateIntent(targetConcept, bestItem, delta, userState);

    return {
        targetConcept,
        item: bestItem,
        intent: {
            type: intent.type as IntentType,
            text: intent.text
        }
    };
}

function findFirstIndexed(slugs: string[], index: ConceptIndex): string | null {
    for (const slug of slugs) {
        if (index[slug]?.length > 0) {
            return slug;
        }
    }
    return null;
}

function selectBestCandidate(items: ConceptIndexItem[], forcePractice: boolean): ConceptIndexItem {
    return [...items].sort((a, b) => {
        const scoreA = calculateScore(a, forcePractice);
        const scoreB = calculateScore(b, forcePractice);

        if (scoreA !== scoreB) return scoreB - scoreA;
        if (a.estMinutes !== b.estMinutes) return a.estMinutes - b.estMinutes;
        return a.href.localeCompare(b.href);
    })[0];
}

function calculateScore(item: ConceptIndexItem, forcePractice: boolean): number {
    let score = 0;
    if (item.isPrimary) score += 50;
    if (item.estMinutes <= 5) score += 20;
    if (item.type === 'practice') {
        score += 10;
        if (forcePractice) score += 100;
    }
    return score;
}

function generateIntent(
    conceptSlug: string,
    item: ConceptIndexItem,
    delta: LearningDelta,
    state?: UserLearningState
): SessionIntent {
    const label = formatSlug(conceptSlug);

    if (state?.stubbornConcepts.includes(conceptSlug)) {
        return {
            type: 'practice',
            text: `This reinforces ${label} because you’ve seen it before but haven’t internalized it yet.`
        };
    }

    if (delta.unlocked.includes(conceptSlug)) {
        return {
            type: 'bridge',
            from: ['Prerequisites'],
            to: [label],
            text: `This connects your prerequisites to ${label} because your foundation is now satisfied.`
        };
    }

    if (conceptSlug.includes('tradeoff') || conceptSlug.includes('vs')) {
        return {
            type: 'tradeoff',
            text: `This reveals the tradeoff in ${label} because the ‘default’ intuition breaks here.`
        };
    }

    if (delta.introduced.includes(conceptSlug)) {
        return {
            type: 'foundation',
            text: `This builds ${label} because it’s the prerequisite your recent sessions keep bumping into.`
        };
    }

    const type: 'foundation' | 'bridge' | 'practice' =
        delta.introduced.includes(conceptSlug) ? 'foundation' :
            delta.unlocked.includes(conceptSlug) ? 'bridge' : 'practice';

    if (type === 'foundation') {
        return {
            type,
            text: `This makes ${label} concrete because it’s the first load-bearing piece for what’s next.`
        };
    }

    if (type === 'bridge') {
        return {
            type,
            from: ['Prerequisites'],
            to: [label],
            text: `This connects your prerequisites to ${label} because your foundation is now satisfied.`
        };
    }

    return {
        type,
        text: `This reinforces ${label} because repetition turns recognition into recall.`
    };
}

function formatSlug(slug: string): string {
    const parts = slug.split('.');
    const name = parts[parts.length - 1];
    return name.replace(/-/g, ' ');
}

