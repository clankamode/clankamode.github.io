export type MicroItemType = 'learn' | 'practice';

export interface ConceptIndexItem {
    href: string;
    title: string;
    type: MicroItemType;
    estMinutes: number;
    isPrimary: boolean;
}

export interface ConceptIndex {
    [slug: string]: ConceptIndexItem[];
}

export type IntentType = 'foundation' | 'bridge' | 'tradeoff' | 'practice';

export interface MicroProposal {
    targetConcept: string;
    item: ConceptIndexItem;
    intent: {
        type: IntentType;
        text: string;
    };
}

export interface FailureMode {
    conceptSlug: string;
    errorType: 'timeout' | 'logic_error' | 'syntax_error' | 'other';
    count: number;
    lastMessage?: string;
}

export interface UserLearningState {
    lastInternalization?: {
        conceptSlug: string;
        picked: 'learned' | 'clarified';
        createdAt: string;
    };
    stubbornConcepts: string[];
    recentConcepts: string[];
    nextConceptSlug?: string;
    failureModes: FailureMode[];
    aggregateHistory: string[];
}
