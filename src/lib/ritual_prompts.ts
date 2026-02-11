
export interface RitualChoices {
    a: string;
    b: string;
}

export type IntentType = 'bridge' | 'tradeoff' | 'foundation' | 'practice';

export function proposeRitualChoices(args: {
    primaryConcept: string;
    intentType: IntentType;
}): RitualChoices | null {
    const { primaryConcept, intentType } = args;

    if (primaryConcept.includes('array.contiguous') || primaryConcept.includes('contiguous-memory')) {
        return {
            a: "Direct access (O1) is worth the fixed size.",
            b: "Contiguity improves cache locality."
        };
    }

    if (primaryConcept.includes('linked-list') || primaryConcept.includes('list.nodes')) {
        if (intentType === 'tradeoff') {
            return {
                a: "Flexible sizing matches unknown data volume.",
                b: "Pointer overhead is the cost of flexibility."
            };
        }
        if (intentType === 'bridge') {
            return {
                a: "Break the assumption of contiguity.",
                b: "Gain the flexibility of dynamic sizing."
            };
        }
        return {
            a: "Nodes live anywhere in memory.",
            b: "No resizing required, unlike arrays."
        };
    }

    if (primaryConcept.includes('hash') || primaryConcept.includes('map.collision')) {
        return {
            a: "Collisions are the price of O(1) average lookup.",
            b: "Space complexity pays for time complexity."
        };
    }

    if (primaryConcept.includes('recursion') || primaryConcept.includes('tree')) {
        return {
            a: "Base case prevents infinite loops.",
            b: "Self-similarity simplifies the code."
        };
    }

    if (primaryConcept.includes('big-o')) {
        return {
            a: "Worst-case analysis protects against instability.",
            b: "Scale matters more than constants."
        };
    }

    return null;
}
