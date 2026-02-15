import { supabase } from '@/lib/supabase';

/**
 * Maps LearningArticle slugs (DSA) to the corresponding InterviewQuestion name.
 * Data structures: "Implement X From Scratch". Patterns: "Patterns: ...".
 * Used to link from an article to its practice problem in the code editor.
 */
const ARTICLE_SLUG_TO_PRACTICE_QUESTION_NAME: Record<string, string> = {
  // Data structures
  'stacks': 'Implement Stack From Scratch',
  'queues': 'Implement Queue From Scratch',
  'hash-maps-and-sets': 'Implement Hash Map From Scratch',
  'linked-lists': 'Implement Singly Linked List From Scratch',
  'trees': 'Implement Binary Tree From Scratch',
  'graphs': 'Implement Graph (Adjacency List) From Scratch',
  'tries': 'Implement Trie From Scratch',
  'heaps': 'Implement Min-Heap From Scratch',
  'binary-indexed-trees': 'Implement Binary Indexed Tree (Fenwick) From Scratch',
  'segment-trees': 'Implement Segment Tree From Scratch',
  'sparse-tables': 'Implement Sparse Table (RMQ) From Scratch',
  // Patterns
  'templates': 'Patterns: Pair with Target Sum',
  'two-pointers': 'Patterns: Valid Palindrome',
  'sliding-window': 'Patterns: Maximum Average Subarray',
  'prefix-sum': 'Patterns: Subarray Sum Equals K',
  'efficient-string-building': 'Patterns: Join Strings',
  'fast-and-slow-pointer': 'Patterns: Linked List Has Cycle',
  'monotonic-stack': 'Patterns: Next Greater Element I',
  'dfs': 'Patterns: Count Islands (DFS)',
  'bfs': 'Patterns: Level Order Traversal',
  'binary-search': 'Patterns: Binary Search',
  'backtracking': 'Patterns: Subsets',
  // Advanced patterns
  'dynamic-programming-top-down': 'Patterns: Climbing Stairs (Memo)',
  'top-k-heap': 'Patterns: K Most Frequent Elements',
  'subarrays-with-exact-k': 'Patterns: Subarrays with K Distinct',
  'dijkstra': 'Patterns: Network Delay (Dijkstra)',
  'union-find': 'Patterns: Count Components (Union Find)',
};

export interface PracticeQuestionLink {
  id: string;
  name: string;
}

/**
 * Returns the Articles-sourced practice question for the given article slug, if any.
 * Used on the learn article page to show a "Practice" link into the code editor.
 */
export async function getPracticeQuestionForArticleSlug(
  articleSlug: string
): Promise<PracticeQuestionLink | null> {
  const questionName = ARTICLE_SLUG_TO_PRACTICE_QUESTION_NAME[articleSlug];
  if (!questionName) {
    return null;
  }

  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name')
    .eq('name', questionName)
    .contains('source', ['Articles'])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id, name: data.name };
}
