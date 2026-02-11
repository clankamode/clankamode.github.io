export type ConceptKind = 'concept' | 'skill' | 'trap' | 'intuition';

export interface Concept {
    id: string;
    slug: string;
    label: string;
    short_label: string | null;
    description: string | null;
    track_slug: string;
    kind: ConceptKind;
    created_at: string;
}

export interface ConceptDependency {
    track_slug: string;
    concept_slug: string;
    depends_on_slug: string;
    weight: 1 | 2;
    created_at: string;
}

export interface UserConceptStats {
    email: string;
    track_slug: string;
    concept_slug: string;
    exposures: number;
    internalized_count: number;
    last_seen_at: string | null;
}

export interface DeltaDerivationInput {
    sessionTags: string[];
    priorStats: UserConceptStats[];
    dependencies: ConceptDependency[];
}

export interface DerivedDelta {
    introduced: string[];
    reinforced: string[];
    unlocked: string[];
}
