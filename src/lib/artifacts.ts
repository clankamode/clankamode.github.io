import type { LearningDelta } from '@/lib/progress';

export interface Internalization {
    sessionId: string;
    picked: string;
    concept: string;
    note?: string;
    createdAt: string;
    delta?: LearningDelta;
}
