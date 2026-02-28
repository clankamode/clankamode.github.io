import type { SessionItem } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';
import type { SessionPlannerCandidate } from '@/lib/session-llm-planner/types';

const CONCEPT_PREREQUISITES: Record<string, string[]> = {
  arrays: [],
  strings: [],
  hash_maps: ['arrays'],
  stack: ['arrays'],
  queues: ['arrays'],
  linked_lists: ['arrays'],
  trees: ['arrays'],
  heaps: ['trees'],
  tries: ['trees', 'strings'],
  binary_search_trees: ['trees'],
  segment_trees: ['trees'],
  sparse_tables: ['arrays'],
  graphs: ['trees'],
};

const CONCEPT_ALIASES: Record<string, string> = {
  hash_map: 'hash_maps',
  hash_maps_and_sets: 'hash_maps',
  stack: 'stack',
  stacks: 'stack',
  queue: 'queues',
  linked_list: 'linked_lists',
  linked_lists: 'linked_lists',
  tree: 'trees',
  trees: 'trees',
  trie: 'tries',
  tries: 'tries',
  segment_tree: 'segment_trees',
  segment_trees: 'segment_trees',
  sparse_table: 'sparse_tables',
  graph: 'graphs',
  arrays: 'arrays',
  strings: 'strings',
  heap: 'heaps',
  heaps: 'heaps',
};

export function normalizeConceptKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const trailing = value.split('.').pop() || value;
  const normalized = trailing
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!normalized) return null;
  return CONCEPT_ALIASES[normalized] || normalized;
}

export function candidateConceptKey(item: SessionItem): string | null {
  return normalizeConceptKey(item.primaryConceptSlug || item.targetConcept || item.title);
}

function normalizeTitleTokens(value: string): Set<string> {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!normalized) return new Set();
  return new Set(normalized.split(/\s+/).filter((part) => part.length > 1));
}

function titleSimilarity(a: string, b: string): number {
  const aTokens = normalizeTitleTokens(a);
  const bTokens = normalizeTitleTokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  const denominator = Math.max(aTokens.size, bTokens.size);
  return denominator > 0 ? overlap / denominator : 0;
}

export function highestTitleSimilarity(title: string, recentTitles: string[]): number {
  if (recentTitles.length === 0) return 0;
  let best = 0;
  for (const recent of recentTitles) {
    best = Math.max(best, titleSimilarity(title, recent));
  }
  return best;
}

export function applySkillFrontierGating(
  candidates: SessionPlannerCandidate[],
  userState: UserLearningState | null,
  trackSlug: string
): SessionPlannerCandidate[] {
  if (trackSlug !== 'dsa') return candidates;

  const learned = new Set<string>();
  for (const concept of userState?.recentConcepts || []) {
    const normalized = normalizeConceptKey(concept);
    if (normalized) learned.add(normalized);
  }
  const lastConcept = normalizeConceptKey(userState?.lastInternalization?.conceptSlug);
  if (lastConcept) learned.add(lastConcept);

  const baseline = new Set(['arrays', 'strings']);
  if (learned.size === 0) {
    for (const key of baseline) learned.add(key);
  }

  const eligible: SessionPlannerCandidate[] = [];
  for (const candidate of candidates) {
    if (candidate.item.type !== 'learn') {
      eligible.push(candidate);
      continue;
    }

    const concept = candidateConceptKey(candidate.item);
    if (!concept) {
      eligible.push(candidate);
      continue;
    }

    const prereqs = CONCEPT_PREREQUISITES[concept];
    if (!prereqs || prereqs.length === 0) {
      eligible.push(candidate);
      continue;
    }

    const hasPrereq = prereqs.some((req) => learned.has(req));
    if (hasPrereq || learned.has(concept)) {
      eligible.push(candidate);
    }
  }

  const learnCount = eligible.filter((candidate) => candidate.item.type === 'learn').length;
  return learnCount >= 2 ? eligible : candidates;
}
