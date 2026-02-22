-- Peralta 75 session + intent integration

alter table public."InterviewQuestions"
  add column if not exists concept_tags jsonb not null default '[]'::jsonb;

create table if not exists public."UserPracticeProgress" (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  google_id text,
  problem_id uuid not null references public."InterviewQuestions"(id) on delete cascade,
  leetcode_number integer,
  status text not null check (status = any (array['attempted','solved'])),
  attempted_at timestamptz,
  solved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, problem_id)
);

create unique index if not exists idx_user_practice_progress_google_problem
  on public."UserPracticeProgress"(google_id, problem_id)
  where google_id is not null;

create index if not exists idx_user_practice_progress_email_status
  on public."UserPracticeProgress"(email, status);

create index if not exists idx_user_practice_progress_leetcode_number
  on public."UserPracticeProgress"(leetcode_number);

alter table public."UserPracticeProgress" enable row level security;

with peralta_tags(leetcode_number, tags) as (
values
  (1, ARRAY['hash.o1-average-lookup','hash.space-time-tradeoff','array.random-access-o1']::text[]),
  (283, ARRAY['two-pointers.technique','big-o.time-complexity','array.random-access-o1']::text[]),
  (415, ARRAY['array.contiguous-memory','array.dynamic-resizing','array.random-access-o1']::text[]),
  (680, ARRAY['two-pointers.technique','big-o.time-complexity','array.random-access-o1']::text[]),
  (408, ARRAY['array.contiguous-memory','array.dynamic-resizing','array.random-access-o1']::text[]),
  (49, ARRAY['hash.o1-average-lookup','hash.space-time-tradeoff','array.random-access-o1']::text[]),
  (921, ARRAY['stack.lifo-model','stack.call-stack-relationship','array.random-access-o1']::text[]),
  (151, ARRAY['array.contiguous-memory','array.dynamic-resizing','array.random-access-o1']::text[]),
  (167, ARRAY['two-pointers.technique','big-o.time-complexity','array.random-access-o1']::text[]),
  (16, ARRAY['two-pointers.technique','big-o.time-complexity','array.random-access-o1']::text[]),
  (75, ARRAY['two-pointers.technique','big-o.time-complexity','array.random-access-o1']::text[]),
  (1010, ARRAY['hash.o1-average-lookup','hash.space-time-tradeoff','array.random-access-o1']::text[]),
  (2260, ARRAY['hash.o1-average-lookup','hash.space-time-tradeoff','array.random-access-o1']::text[]),
  (739, ARRAY['stack.monotonic','stack.lifo-model','array.random-access-o1']::text[]),
  (1944, ARRAY['stack.monotonic','stack.lifo-model','array.random-access-o1']::text[]),
  (74, ARRAY['binary-search.technique','array.random-access-o1']::text[]),
  (1424, ARRAY['array.contiguous-memory','big-o.space-complexity','array.random-access-o1']::text[]),
  (54, ARRAY['array.contiguous-memory','big-o.space-complexity','array.random-access-o1']::text[]),
  (134, ARRAY['big-o.time-complexity','big-o.space-complexity','array.random-access-o1']::text[]),
  (904, ARRAY['sliding-window.technique','two-pointers.technique','array.random-access-o1']::text[]),
  (325, ARRAY['math.prefix-sum','array.contiguous-memory','array.random-access-o1']::text[]),
  (528, ARRAY['binary-search.technique','array.random-access-o1']::text[]),
  (31, ARRAY['array.insertion-cost','array.deletion-cost','array.random-access-o1']::text[]),
  (253, ARRAY['heap.priority-queue','big-o.time-complexity','array.random-access-o1']::text[]),
  (347, ARRAY['heap.priority-queue','big-o.time-complexity','array.random-access-o1']::text[]),
  (973, ARRAY['heap.priority-queue','big-o.time-complexity','array.random-access-o1']::text[]),
  (227, ARRAY['stack.lifo-model','stack.call-stack-relationship','array.random-access-o1']::text[]),
  (735, ARRAY['stack.lifo-model','stack.call-stack-relationship','array.random-access-o1']::text[]),
  (84, ARRAY['stack.monotonic','stack.lifo-model','array.random-access-o1']::text[]),
  (746, ARRAY['dp.memoization','recursion.base-case']::text[]),
  (46, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (77, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (216, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (17, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (37, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (51, ARRAY['backtracking.search','recursion.base-case']::text[]),
  (1155, ARRAY['dp.memoization','recursion.base-case']::text[]),
  (876, ARRAY['fast-slow-pointers.cycle-detection','two-pointers.technique','list.pointer-invariants']::text[]),
  (142, ARRAY['fast-slow-pointers.cycle-detection','two-pointers.technique','list.pointer-invariants']::text[]),
  (160, ARRAY['two-pointers.technique','big-o.time-complexity','list.pointer-invariants']::text[]),
  (2, ARRAY['list.pointer-invariants','list.insertion-o1-known']::text[]),
  (21, ARRAY['list.pointer-invariants','list.insertion-o1-known']::text[]),
  (143, ARRAY['list.pointer-invariants','list.insertion-o1-known']::text[]),
  (23, ARRAY['heap.priority-queue','big-o.time-complexity','list.pointer-invariants']::text[]),
  (543, ARRAY['graph.traversal-dfs','recursion.base-case','tree.recursive-structure']::text[]),
  (993, ARRAY['graph.traversal-bfs','queue.bfs-relationship','tree.recursive-structure']::text[]),
  (515, ARRAY['graph.traversal-bfs','queue.bfs-relationship','tree.recursive-structure']::text[]),
  (129, ARRAY['graph.traversal-dfs','recursion.base-case','tree.recursive-structure']::text[]),
  (236, ARRAY['graph.traversal-dfs','recursion.base-case','tree.recursive-structure']::text[]),
  (98, ARRAY['graph.traversal-dfs','recursion.base-case','tree.recursive-structure']::text[]),
  (1361, ARRAY['graph.representation','graph.terminology','tree.recursive-structure']::text[]),
  (96, ARRAY['dp.memoization','recursion.base-case','tree.recursive-structure']::text[]),
  (1268, ARRAY['trie.prefix-tree','tree.parent-child-model','tree.recursive-structure']::text[]),
  (297, ARRAY['tree.traversal-orders','tree.recursive-structure']::text[]),
  (428, ARRAY['tree.traversal-orders','tree.recursive-structure']::text[]),
  (200, ARRAY['graph.traversal-dfs','recursion.base-case','graph.representation']::text[]),
  (286, ARRAY['graph.traversal-bfs','queue.bfs-relationship','graph.representation']::text[]),
  (721, ARRAY['union-find.disjoint-set','big-o.amortized-analysis','graph.representation']::text[]),
  (547, ARRAY['union-find.disjoint-set','big-o.amortized-analysis','graph.representation']::text[]),
  (743, ARRAY['graph.shortest-path-dijkstra','heap.priority-queue','graph.representation']::text[]),
  (787, ARRAY['graph.representation','big-o.time-complexity']::text[]),
  (505, ARRAY['graph.shortest-path-dijkstra','heap.priority-queue','graph.representation']::text[]),
  (2385, ARRAY['graph.traversal-bfs','queue.bfs-relationship','graph.representation']::text[]),
  (1101, ARRAY['union-find.disjoint-set','big-o.amortized-analysis','graph.representation']::text[]),
  (269, ARRAY['graph.representation','graph.traversal-bfs']::text[]),
  (317, ARRAY['graph.traversal-bfs','queue.bfs-relationship','graph.representation']::text[]),
  (827, ARRAY['graph.traversal-dfs','recursion.base-case','graph.representation']::text[]),
  (815, ARRAY['graph.traversal-bfs','queue.bfs-relationship','graph.representation']::text[]),
  (155, ARRAY['stack.lifo-model','stack.call-stack-relationship','big-o.space-complexity']::text[]),
  (146, ARRAY['hash.o1-average-lookup','list.singly-vs-doubly','big-o.space-complexity']::text[]),
  (380, ARRAY['hash.o1-average-lookup','array.random-access-o1','big-o.space-complexity']::text[]),
  (981, ARRAY['hash.o1-average-lookup','binary-search.technique','big-o.space-complexity']::text[]),
  (588, ARRAY['trie.prefix-tree','tree.parent-child-model','big-o.space-complexity']::text[]),
  (432, ARRAY['hash.o1-average-lookup','list.singly-vs-doubly','big-o.space-complexity']::text[]),
  (631, ARRAY['graph.representation','graph.traversal-bfs','big-o.space-complexity']::text[])
), resolved as (
  select
    q.id,
    q.leetcode_number,
    t.tags
  from public."InterviewQuestions" q
  join peralta_tags t on t.leetcode_number = q.leetcode_number
  where q.source @> array['PERALTA_75']::text[]
)
update public."InterviewQuestions" q
set
  concept_tags = to_jsonb(r.tags),
  -- concept_slug and concept_slugs_backup were added in a prior migration;
  -- we backfill them here alongside concept_tags for consistency.
  concept_slug = r.tags[1],
  concept_slugs_backup = r.tags
from resolved r
where q.id = r.id;

do $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from public."InterviewQuestions" q
  where q.source @> array['PERALTA_75']::text[]
    and (
      q.concept_tags is null
      or jsonb_typeof(q.concept_tags) <> 'array'
      or jsonb_array_length(q.concept_tags) = 0
    );

  if invalid_count > 0 then
    raise exception 'Peralta concept_tags backfill failed: % rows missing tags', invalid_count;
  end if;
end $$;
