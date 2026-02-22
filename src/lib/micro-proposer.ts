import type { LearningDelta, SessionIntent } from './progress';
import type { ConceptIndex, ConceptIndexItem, MicroProposal, IntentType, UserLearningState } from '../types/micro';

const LEARN_MAX_MINUTES = 5;
const PRACTICE_MAX_MINUTES = 20;

export interface ProposerInput {
    trackSlug: string;
    delta: LearningDelta;
    conceptIndex: ConceptIndex;
    userState?: UserLearningState;
    avoidConcepts?: string[];
}

export function proposeMicroSession(input: ProposerInput): MicroProposal | null {
    const { delta, conceptIndex, userState, avoidConcepts = [] } = input;
    const blockedConcepts = new Set(
        avoidConcepts
            .map((value) => normalizeConceptSlug(value))
            .filter((value): value is string => !!value)
    );

    if (userState && userState.stubbornConcepts.length > 0) {
        for (const slug of userState.stubbornConcepts) {
            if (isBlockedConcept(slug, blockedConcepts)) {
                continue;
            }
            const candidates = conceptIndex[slug] || [];
            const practiceItems = candidates.filter(item => item.type === 'practice' && item.estMinutes <= PRACTICE_MAX_MINUTES);

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

    const targetConcept =
        findFirstIndexed(delta.introduced, conceptIndex, blockedConcepts) ||
        findFirstIndexed(delta.unlocked, conceptIndex, blockedConcepts) ||
        findFirstIndexed(delta.reinforced, conceptIndex, blockedConcepts);

    if (!targetConcept) return null;

    const candidates = conceptIndex[targetConcept];
    if (!candidates || candidates.length === 0) return null;

    const forcePractice = delta.reinforced.includes(targetConcept);
    const bestItem = selectBestCandidate(candidates, forcePractice);
    if (bestItem.type === 'learn' && bestItem.estMinutes > LEARN_MAX_MINUTES) return null;
    if (bestItem.type === 'practice' && bestItem.estMinutes > PRACTICE_MAX_MINUTES) return null;

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

function findFirstIndexed(slugs: string[], index: ConceptIndex, blockedConcepts: Set<string>): string | null {
    for (const slug of slugs) {
        if (isBlockedConcept(slug, blockedConcepts)) {
            continue;
        }
        if (index[slug]?.length > 0) {
            return slug;
        }
    }
    return null;
}

function normalizeConceptSlug(value: string | null | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    return normalized || null;
}

function isBlockedConcept(value: string, blockedConcepts: Set<string>): boolean {
    const normalized = normalizeConceptSlug(value);
    if (!normalized) return false;
    return blockedConcepts.has(normalized);
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
    if (item.type === 'practice' && item.estMinutes <= PRACTICE_MAX_MINUTES) score += 20;
    if (item.type === 'learn' && item.estMinutes <= LEARN_MAX_MINUTES) score += 20;
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

    const type: 'foundation' | 'bridge' | 'practice' =
        delta.introduced.includes(conceptSlug) ? 'foundation' :
            delta.unlocked.includes(conceptSlug) ? 'bridge' : 'practice';

    if (type === 'foundation') {
        return {
            type,
            text: state
                ? `This builds ${label} because it’s the prerequisite your recent sessions keep bumping into.`
                : `This makes ${label} concrete because it’s the first load-bearing piece for what’s next.`
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
