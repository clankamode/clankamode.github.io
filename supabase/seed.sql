-- =============================================================================
-- Local dev seed data — pulled from production 2026-02-18.
-- Covers structural/reference data only. No user activity data.
-- Articles are NOT seeded here (too large). Use `supabase db dump`
-- with `--data-only -t LearningArticles` if you need article content.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Users (test accounts for local dev)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."Users" (email, role, username) values
  ('admin@test.local',            'ADMIN',   'admin_local'),
  ('editor@test.local',           'EDITOR',  'editor_local'),
  ('user@test.local',             'USER',    'user_local'),
  ('clankamode@gmail.com',        'ADMIN',   'clankamode'),
  ('jamesperalta35@gmail.com',    'ADMIN',   'jamesperalta35'),
  ('castleridge.labs@gmail.com',  'ADMIN',   'castleridge_labs'),
  ('jamesperalta.sw@gmail.com',   'ADMIN',   'jamesperalta_sw'),
  ('johnissack997@gmail.com',     'ADMIN',   'johnissack997'),
  ('test@example.com',            'ADMIN',   'test_admin'),
  ('plannerlesson34@gmail.com',   'INSIDER', 'plannerlesson34')
on conflict (email) do update set role = excluded.role;

-- ─────────────────────────────────────────────────────────────────────────────
-- LearningPillars
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."LearningPillars" (id, slug, name, description, icon_name, order_index, created_at) values
  ('92a681e6-6c08-4135-b69a-764ba109223a', 'dsa',           'DSA',          'Algorithmic foundations for interviews and real-world performance.',     'code',     1, '2026-01-21 17:56:21.436754+00'),
  ('efabf6fa-20df-49fc-a2da-ef07ed46e935', 'system-design', 'System Design','Architecture, scaling, reliability, and the decisions that compound.',  'blocks',   2, '2026-01-21 17:56:21.436754+00'),
  ('5551a69f-b3aa-452b-8902-ca8c0477a1d6', 'job-hunt',      'Job Hunt',     'Positioning, storytelling, and outcomes that land interviews.',          'document', 3, '2026-01-21 17:56:21.436754+00'),
  ('540c34d4-a8f7-421b-88f2-3d03330feecb', 'blog',          'Blog',         'Career notes, leadership takes, and behind-the-scenes breakdowns.',     'pen',      5, '2026-01-21 17:56:21.436754+00')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- LearningTopics
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."LearningTopics" (id, pillar_id, slug, name, description, order_index, created_at) values
  ('5e7e43b1-f337-4791-8889-a6e2de2f5ddb', '92a681e6-6c08-4135-b69a-764ba109223a', 'data-structures',          'Data Structures',          'The fundamental building blocks of DSA.',                                                                     1, '2026-01-21 17:56:21.506302+00'),
  ('8827bce7-63d5-40ef-9c7f-6a77f8a91087', '92a681e6-6c08-4135-b69a-764ba109223a', 'advanced-data-structures', 'Advanced Data Structures',  'Specialized data structures — tries, heaps, and trees for specific query patterns.',                         2, '2026-02-14 06:47:44.064769+00'),
  ('99b43a89-5c96-4713-8ccc-da85c099d75f', '92a681e6-6c08-4135-b69a-764ba109223a', 'patterns',                 'Patterns',                  'The base patterns you reuse everywhere.',                                                                     3, '2026-01-24 05:13:14+00'),
  ('027ff628-b1ce-4306-a49f-b0b8ca2fa5d6', '92a681e6-6c08-4135-b69a-764ba109223a', 'advanced-patterns',        'Advanced Patterns',         'Algorithmic patterns that build on the fundamentals.',                                                        4, '2026-02-14 06:51:48.557862+00'),
  ('6cb449a1-deaf-4635-b3cf-da3e1a378e90', 'efabf6fa-20df-49fc-a2da-ef07ed46e935', 'fundamentals',             'Fundamentals',              'Core concepts before diving into system design.',                                                             0, '2026-02-13 22:17:01.257074+00'),
  ('7f72b434-f1c6-44eb-b241-3b8d9fe5fdb2', 'efabf6fa-20df-49fc-a2da-ef07ed46e935', 'practice-problems',        'Practice Problems',         'End-to-end system design walkthroughs — from requirements to architecture to deep dives.',                   1, '2026-02-14 07:16:19.269935+00'),
  ('0b29fc5d-ee4d-445e-951a-b7b6d5164456', '5551a69f-b3aa-452b-8902-ca8c0477a1d6', 'positioning',              'Positioning',               'Make your story obvious at a glance.',                                                                        1, '2026-01-21 17:56:21.506302+00'),
  ('b7dc7660-6450-498a-a7f4-1c273a1fa209', '540c34d4-a8f7-421b-88f2-3d03330feecb', 'career',                   'Career Notes',              'What I wish I knew earlier.',                                                                                 1, '2026-01-21 17:56:21.506302+00'),
  ('26ba26b7-7547-4dd7-8a4a-b0b71b1036d2', '540c34d4-a8f7-421b-88f2-3d03330feecb', 'chasing-expert',           'Chasing Expert',            null,                                                                                                          0, '2026-02-13 23:11:05.094299+00')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- LearningArticles (minimal local content so /home session routes don't 404)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."LearningArticles" (
  id,
  topic_id,
  slug,
  title,
  excerpt,
  body,
  reading_time_minutes,
  is_premium,
  is_published,
  order_index,
  concept_tags,
  primary_concept
) values
  (
    '11111111-1111-4111-8111-111111111111',
    '5e7e43b1-f337-4791-8889-a6e2de2f5ddb',
    'arrays',
    'Arrays',
    'A compact primer for contiguous memory and O(1) index access.',
    E'## Why arrays matter\n\nArrays give direct indexed access, which is the bedrock for many interview problems.\n\n## Core invariant\n\nIndexing by position is O(1) because elements are laid out contiguously in memory.\n\n## Tradeoffs\n\nInsertions and deletions in the middle are O(n) because elements shift.\n\n## Interview reflex\n\nWhen you hear "fixed order" and "random access", start with array-first reasoning.',
    5,
    false,
    true,
    0,
    '["array.random-access-o1","array.contiguous-memory"]'::jsonb,
    'array.random-access-o1'
  )
on conflict (id) do update
set
  topic_id = excluded.topic_id,
  slug = excluded.slug,
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  reading_time_minutes = excluded.reading_time_minutes,
  is_premium = excluded.is_premium,
  is_published = excluded.is_published,
  order_index = excluded.order_index,
  concept_tags = excluded.concept_tags,
  primary_concept = excluded.primary_concept,
  updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- Concepts
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."Concepts" (id, slug, label, short_label, description, track_slug, kind, created_at) values
  -- DSA: Big-O
  ('12872e21-d4d1-4488-add9-2b93b6a5c23f', 'big-o.time-complexity',           'Time complexity analysis',                   'Time complexity',   null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('eb26b1f3-50fc-451c-8ae8-fb8082a6e798', 'big-o.space-complexity',          'Space complexity analysis',                  'Space complexity',  null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('1eb52c0d-b39a-4811-b8f8-4615e2542300', 'big-o.amortized-analysis',        'Amortized time analysis',                    'Amortized',         null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  -- DSA: Array
  ('449ab2dd-9c02-41bd-8a42-003dec8e26ee', 'array.contiguous-memory',         'Contiguous memory layout',                   'Contiguous memory', null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('862d8e9b-c8fe-4d3e-b39e-ad7cf39f8a0b', 'array.random-access-o1',          'O(1) random access',                         'O(1) access',       null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('90ac086a-9a77-41b2-b1dd-4050e2edc9fe', 'array.insertion-cost',            'Array insertion cost at arbitrary index',     'Insert cost',       null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('5357a90e-fe34-43af-aac9-cb517032a9dd', 'array.deletion-cost',             'Array deletion cost at arbitrary index',      'Delete cost',       null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('f0699869-4947-48f9-bc45-f1be55315e95', 'array.dynamic-resizing',          'Dynamic array resizing (amortized)',          'Dynamic resize',    null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  -- DSA: Linked List
  ('4178781c-3a40-4681-bacc-cfbd398ef2e5', 'list.pointer-invariants',         'Pointer invariants (head/tail/next)',         'Pointer invariants',null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('4c34fea6-ff5e-4c78-a0bf-d3f6fb30386e', 'list.insertion-o1-known',         'O(1) insertion when node is known',          'O(1) insert',       null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('de2bbbb6-f7dd-46b2-a8b9-de8848cadc72', 'list.traversal-cost',             'O(n) traversal cost',                        'Traversal cost',    null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('effb7bd7-794b-4f97-b1bb-03f9bd3b03d2', 'list.singly-vs-doubly',           'Singly vs doubly linked tradeoffs',          'Single/Double',     null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  -- DSA: Hash
  ('cb8eda35-3350-4809-8dcd-4f86c939cde3', 'hash.space-time-tradeoff',        'Space-time tradeoff in hashing',             'Space vs time',     null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('5cb29035-c52e-4b4e-a785-a2cd035566aa', 'hash.o1-average-lookup',          'O(1) average-case lookup',                   'O(1) lookup',       null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('174bddd1-5b38-44de-9a16-8f0993a18e19', 'hash.collision-handling',         'Hash collision handling strategies',         'Collisions',        null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  -- DSA: Stack
  ('c50356b1-039b-4658-9219-2d54f4d51577', 'stack.lifo-model',                'LIFO (Last In, First Out) model',            'LIFO',              null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('3a3b1909-d0ee-4443-aca1-5f8662253cd1', 'stack.call-stack-relationship',   'Relationship to call stack',                 'Call stack',        null, 'dsa', 'intuition', '2026-02-04 07:33:09.898087+00'),
  ('2ec3acfa-b109-42db-9b82-32d30e267357', 'stack.monotonic',                 'Monotonic Stack',                            null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  -- DSA: Queue
  ('3a51c0f8-e85e-4ee1-8d7a-c2f5574ea4aa', 'queue.fifo-model',                'FIFO (First In, First Out) model',           'FIFO',              null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('b6092ab7-ff09-4149-b7fd-89aa19bcc33e', 'queue.bfs-relationship',          'Relationship to BFS traversal',              'BFS queue',         null, 'dsa', 'intuition', '2026-02-04 07:33:09.898087+00'),
  -- DSA: Tree
  ('71d65a78-8d16-4534-b7de-c1c14cae0b5c', 'tree.parent-child-model',         'Parent-child hierarchical model',            'Hierarchy',         null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('dd7e99d4-20ff-4251-829b-cbbcda4b9d46', 'tree.recursive-structure',        'Recursive tree structure',                   'Recursive tree',    null, 'dsa', 'intuition', '2026-02-04 07:33:09.898087+00'),
  ('eadaa3d9-d8ef-4276-a0d9-4456216d342c', 'tree.traversal-orders',           'Inorder/Preorder/Postorder traversal',       'Traversal orders',  null, 'dsa', 'skill',     '2026-02-04 07:33:09.898087+00'),
  ('5a8a4622-7f3b-4248-8209-7f095fb089e8', 'tree.bst-invariant',              'Binary Search Tree ordering invariant',      'BST invariant',     null, 'dsa', 'concept',   '2026-02-04 07:33:09.898087+00'),
  ('5a5a6a72-c584-4124-958b-5c2b24f29fa6', 'tree.properties',                 'Tree Properties (Height, Depth, Balance)',   null,                null, 'dsa', 'concept',   '2026-02-17 02:52:59.357143+00'),
  -- DSA: Recursion
  ('84dcd8b4-b073-4aff-83a6-3d807d234df1', 'recursion.base-case',             'Identifying base cases',                     'Base case',         null, 'dsa', 'skill',     '2026-02-04 07:33:09.898087+00'),
  ('b9f121ec-306a-41ba-94dc-fbe5cb7155fe', 'recursion.stack-overflow-trap',   'Stack overflow from missing base case',      'Stack overflow',    null, 'dsa', 'trap',      '2026-02-04 07:33:09.898087+00'),
  -- DSA: Graph
  ('4399e156-370c-421b-91ff-b71f3f4eab12', 'graph.traversal-bfs',             'BFS Traversal',                              null,                null, 'dsa', 'technique', '2026-02-07 20:15:59.898183+00'),
  ('dea9e78c-a9d7-4424-bc4d-d377a5a61494', 'graph.traversal-dfs',             'DFS Traversal',                              'DFS',               null, 'dsa', 'technique', '2026-02-07 20:15:59.898183+00'),
  ('bacfb0e8-2665-4d02-8fb6-61cdbf8ad768', 'tree.traversal-inorder',          'Inorder Traversal',                          null,                null, 'dsa', 'technique', '2026-02-07 20:15:59.898183+00'),
  ('717655f6-a468-4dc3-8e09-8d6c72ee8a81', 'graph.representation',            'Graph Representations (Matrix vs List)',     null,                null, 'dsa', 'structure', '2026-02-17 02:52:59.357143+00'),
  ('52a0d491-8cde-44a4-89c9-8e28e0fd1dac', 'graph.terminology',               'Graph Terminology (Vertex, Edge, Weight)',   null,                null, 'dsa', 'concept',   '2026-02-17 02:52:59.357143+00'),
  ('00c7d8bc-cb31-446f-b802-890682ce742b', 'graph.shortest-path-dijkstra',    'Dijkstra''s Algorithm',                      null,                null, 'dsa', 'algorithm', '2026-02-17 02:49:22.180617+00'),
  -- DSA: Patterns
  ('d803ca34-b042-493f-ae7a-392f54b04fa5', 'two-pointers.technique',          'Two Pointers',                               null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('0b092e7c-9df3-4ab1-9b81-bcf0aacb6973', 'sliding-window.technique',        'Sliding Window',                             'Sliding Window',    null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('fe541615-e9e7-4421-8005-765b1f2550b8', 'fast-slow-pointers.cycle-detection','Fast & Slow Pointers',                     null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('4b953e41-49f1-4ecf-8bc0-c2418c326269', 'math.prefix-sum',                 'Prefix Sums',                                null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('81cf0afc-6e5b-4f26-a619-2775b7d0d61e', 'binary-search.technique',         'Binary Search',                              'Binary Search',     null, 'dsa', 'algorithm', '2026-02-17 02:49:22.180617+00'),
  ('46fc5be1-2591-40b3-896b-996104667857', 'backtracking.search',              'Backtracking',                               null,                null, 'dsa', 'technique', '2026-02-17 02:49:22.180617+00'),
  ('7d3636b7-47e1-4638-bce5-7bb414ad0c5d', 'dp.memoization',                  'Dynamic Programming (Memoization)',          'DP Memoization',    null, 'dsa', 'technique', '2026-02-17 02:49:22.180617+00'),
  -- DSA: Advanced Structures
  ('219d8045-5816-4dc6-90ca-a462f8e7c08b', 'heap.priority-queue',             'Heaps & Priority Queues',                    null,                null, 'dsa', 'structure', '2026-02-17 02:49:22.180617+00'),
  ('89e25ce5-4bf5-4823-8d28-fccb02049a2b', 'trie.prefix-tree',                'Tries (Prefix Trees)',                       null,                null, 'dsa', 'structure', '2026-02-17 02:49:22.180617+00'),
  ('d5192165-d561-4e8c-b7b6-fc9afbdb9901', 'union-find.disjoint-set',         'Union Find (Disjoint Set)',                  null,                null, 'dsa', 'structure', '2026-02-17 02:49:22.180617+00'),
  ('8cd01593-451a-42d6-954b-01eca78e940f', 'segment-tree.range-query',        'Segment Trees',                              null,                null, 'dsa', 'structure', '2026-02-17 02:49:22.180617+00'),
  ('f357678a-ccb9-4c09-9d87-039af0f85758', 'matrix.sparse',                   'Sparse Tables',                              null,                null, 'dsa', 'structure', '2026-02-17 02:49:22.180617+00'),
  -- DSA: Blog
  ('14537f79-07f1-44bf-b15a-3eee5868dc09', 'career.learning',                 'Learning & Growth',                          null,                null, 'blog', 'concept',  '2026-02-17 02:49:52.069198+00'),
  -- Job Hunt
  ('a32d6ae9-8278-465a-99cf-0e4dd776e690', 'career.behavioral',               'Behavioral Interviews',                      null,                null, 'job-hunt', 'skill',    '2026-02-17 02:49:52.069198+00'),
  ('bff78644-5314-4b9e-9d44-9a82e69e352d', 'career.resume',                   'Resume Writing',                             null,                null, 'job-hunt', 'skill',    '2026-02-17 02:49:52.069198+00'),
  ('a448be71-9d32-4f65-827a-552544a1d0f5', 'career.strategy',                 'Interview Strategy & Mindset',               null,                null, 'job-hunt', 'concept',  '2026-02-17 02:49:52.069198+00'),
  -- System Design
  ('deb47587-f9aa-451b-859f-8e58487fd6cc', 'system.scalability',              'Scalability (Vertical vs Horizontal)',       null,                null, 'system-design', 'concept',   '2026-02-17 02:49:22.532299+00'),
  ('a14a5667-0ebc-4832-8adf-82dc5d4af4d6', 'system.storage',                  'Storage & Databases',                        null,                null, 'system-design', 'component', '2026-02-17 02:49:22.532299+00'),
  ('ebefffc6-a7d4-457f-87cf-8413f63f39fd', 'system.communication',            'System Communication (API, Queues)',         null,                null, 'system-design', 'concept',   '2026-02-17 02:49:22.532299+00'),
  ('33d82d61-9093-49db-91fc-0280db7463d0', 'system.consistency',              'Consistency Models (ACID/BASE)',             null,                null, 'system-design', 'concept',   '2026-02-17 02:49:22.532299+00'),
  ('43942e32-540b-42d4-a599-e224293bb5c3', 'system.caching',                  'Caching Strategies',                         null,                null, 'system-design', 'component', '2026-02-17 02:49:22.532299+00'),
  ('04db7ef6-f9bc-4f4e-8505-b98cffdbccee', 'system.load-balancing',           'Load Balancers',                             null,                null, 'system-design', 'component', '2026-02-17 02:49:22.532299+00'),
  ('f8f2edea-b867-441d-90ff-dc013eb079d5', 'system.cap-theorem',              'CAP Theorem',                                null,                null, 'system-design', 'concept',   '2026-02-17 02:49:22.532299+00'),
  ('6add61d1-4a74-491d-8e87-6cad4eabac88', 'system.replication',              'Database Replication',                       null,                null, 'system-design', 'technique', '2026-02-17 02:49:22.532299+00'),
  ('8f456a8a-051b-4ba6-b96f-8422c5f9b4e3', 'system.partitioning',             'Data Partitioning & Sharding',               null,                null, 'system-design', 'technique', '2026-02-17 02:49:22.532299+00'),
  ('83037f8c-385e-4223-9c69-c8a3663bbb9f', 'system.observability',            'Observability & Monitoring',                 null,                null, 'system-design', 'practice',  '2026-02-17 02:49:22.532299+00'),
  ('f453930c-69c1-48dd-9ac3-183bd5173486', 'system.requirements',             'Requirements Gathering',                     null,                null, 'system-design', 'skill',     '2026-02-17 02:49:22.532299+00')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- ConceptDependencies (the concept graph)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."ConceptDependencies" (concept_slug, depends_on_slug, track_slug, weight) values
  -- DSA graph
  ('backtracking.search',              'recursion.base-case',              'dsa', 2),
  ('fast-slow-pointers.cycle-detection','list.pointer-invariants',         'dsa', 2),
  ('graph.representation',             'array.random-access-o1',           'dsa', 1),
  ('graph.representation',             'list.pointer-invariants',          'dsa', 1),
  ('graph.shortest-path-dijkstra',     'heap.priority-queue',              'dsa', 2),
  ('graph.shortest-path-dijkstra',     'graph.traversal-bfs',              'dsa', 2),
  ('graph.traversal-bfs',              'queue.fifo-model',                 'dsa', 2),
  ('hash.space-time-tradeoff',         'big-o.space-complexity',           'dsa', 2),
  ('hash.space-time-tradeoff',         'big-o.time-complexity',            'dsa', 2),
  ('heap.priority-queue',              'array.contiguous-memory',          'dsa', 1),
  ('heap.priority-queue',              'tree.parent-child-model',          'dsa', 1),
  ('list.insertion-o1-known',          'list.pointer-invariants',          'dsa', 2),
  ('list.pointer-invariants',          'array.contiguous-memory',          'dsa', 2),
  ('list.traversal-cost',              'big-o.time-complexity',            'dsa', 2),
  ('matrix.sparse',                    'array.random-access-o1',           'dsa', 1),
  ('queue.fifo-model',                 'list.pointer-invariants',          'dsa', 1),
  ('segment-tree.range-query',         'tree.recursive-structure',         'dsa', 2),
  ('tree.bst-invariant',               'tree.properties',                  'dsa', 1),
  ('tree.bst-invariant',               'tree.parent-child-model',          'dsa', 2),
  ('tree.parent-child-model',          'list.pointer-invariants',          'dsa', 1),
  ('tree.properties',                  'tree.parent-child-model',          'dsa', 1),
  ('tree.recursive-structure',         'recursion.base-case',              'dsa', 2),
  ('tree.traversal-orders',            'tree.recursive-structure',         'dsa', 1),
  ('trie.prefix-tree',                 'tree.parent-child-model',          'dsa', 1),
  ('two-pointers.technique',           'array.random-access-o1',           'dsa', 1),
  ('union-find.disjoint-set',          'tree.parent-child-model',          'dsa', 1),
  ('union-find.disjoint-set',          'array.random-access-o1',           'dsa', 1),
  -- System Design graph
  ('system.caching',                   'system.scalability',               'system-design', 2),
  ('system.cap-theorem',               'system.consistency',               'system-design', 2),
  ('system.communication',             'system.scalability',               'system-design', 1),
  ('system.consistency',               'system.storage',                   'system-design', 1),
  ('system.load-balancing',            'system.scalability',               'system-design', 2),
  ('system.observability',             'system.scalability',               'system-design', 1),
  ('system.partitioning',              'system.scalability',               'system-design', 2),
  ('system.replication',               'system.storage',                   'system-design', 2),
  ('system.requirements',              'system.scalability',               'system-design', 1)
on conflict (concept_slug, depends_on_slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fake users (additional test accounts for local dev / AMA seeding)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."Users" (email, role, username) values
  ('alice@test.local', 'USER', 'alice'),
  ('bob@test.local',   'USER', 'bob'),
  ('carol@test.local', 'USER', 'carol'),
  ('dave@test.local',  'USER', 'dave'),
  ('eve@test.local',   'USER', 'eve')
on conflict (email) do update set username = excluded.username;

-- ─────────────────────────────────────────────────────────────────────────────
-- AMA questions (fake Q&A for local dev)
-- user_id is a placeholder; in production this is the OAuth sub (e.g. Google ID).
-- Remove previous seed questions so re-running seed does not duplicate.
-- ─────────────────────────────────────────────────────────────────────────────
delete from public."AmaVotes" where question_id in (select id from public."AmaQuestions" where user_id like 'seed-user-%');
delete from public."AmaQuestions" where user_id like 'seed-user-%';

insert into public."AmaQuestions" (user_id, author_name, question, status, answer, answered_at, vote_count) values
  ('seed-user-1', 'Alice', 'What does a typical day look like for you as an engineer?', 'answered', 'I block morning for deep work and meetings in the afternoon. I also try to ship something small every day.', now() - interval '2 days', 12),
  ('seed-user-2', null, 'How do you prepare for system design interviews?', 'answered', 'I focus on one system at a time, draw the diagram, then practice explaining tradeoffs out loud. Repeating the same 5–10 systems beats skimming many.', now() - interval '1 day', 8),
  ('seed-user-3', 'Bob', 'What resources do you recommend for DSA?', 'answered', 'The Learn section on this site, plus LeetCode for practice. Consistency matters more than volume.', now() - interval '5 hours', 5),
  ('seed-user-1', 'Alice', 'How long did it take you to get comfortable with dynamic programming?', 'unanswered', null, null, 3),
  ('seed-user-4', 'Carol', 'Do you think FAANG is still worth targeting in 2025?', 'unanswered', null, null, 7),
  ('seed-user-2', null, 'Tips for staying motivated during a long job search?', 'unanswered', null, null, 2),
  ('seed-user-5', 'Dave', 'How do you balance learning new tech vs getting really good at one stack?', 'unanswered', null, null, 0),
  ('seed-user-3', 'Bob', 'What would you do differently when starting to code?', 'answered', 'I would practice explaining my code out loud earlier. It translates directly to interviews and reviews.', now() - interval '3 days', 4);

-- =============================================================================
-- Content seed — interview questions and articles
-- Representative set for local dev and testing.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- InterviewQuestions
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."InterviewQuestions" (id, name, leetcode_number, difficulty, prompt_full, starter_code, helper_code, test_cases, source, category, pattern, leetcode_url, order_index, concept_slug, concept_tags) values

-- Two Sum
('f6b901eb-b5de-5899-8b2d-20e88dacdd1d', 'Two Sum', 1, 'Easy',
'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
'function twoSum(nums: number[], target: number): number[] {

}',
'',
'[{"input":{"nums":[2,7,11,15],"target":9},"expected":[0,1]},{"input":{"nums":[3,2,4],"target":6},"expected":[1,2]},{"input":{"nums":[3,3],"target":6},"expected":[0,1]}]',
'{"leetcode"}', 'Arrays & Hashing', 'Hash Map', 'https://leetcode.com/problems/two-sum/', 1, 'hash.o1-average-lookup',
'[{"slug":"hash.o1-average-lookup","label":"O(1) average lookup"},{"slug":"array.random-access-o1","label":"O(1) random access"}]'),

-- Valid Anagram
('46214ecc-a201-59ad-a292-da6d9798959b', 'Valid Anagram', 242, 'Easy',
'Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.',
'function isAnagram(s: string, t: string): boolean {

}',
'',
'[{"input":{"s":"anagram","t":"nagaram"},"expected":true},{"input":{"s":"rat","t":"car"},"expected":false},{"input":{"s":"a","t":"a"},"expected":true}]',
'{"leetcode"}', 'Arrays & Hashing', 'Hash Map', 'https://leetcode.com/problems/valid-anagram/', 2, 'hash.o1-average-lookup',
'[{"slug":"hash.o1-average-lookup","label":"O(1) average lookup"}]'),

-- Contains Duplicate
('06133161-34cb-5b7e-ab76-dd9e9a2be5f5', 'Contains Duplicate', 217, 'Easy',
'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
'function containsDuplicate(nums: number[]): boolean {

}',
'',
'[{"input":{"nums":[1,2,3,1]},"expected":true},{"input":{"nums":[1,2,3,4]},"expected":false},{"input":{"nums":[1,1,1,3,3,4,3,2,4,2]},"expected":true}]',
'{"leetcode"}', 'Arrays & Hashing', 'Hash Set', 'https://leetcode.com/problems/contains-duplicate/', 3, 'hash.o1-average-lookup',
'[{"slug":"hash.o1-average-lookup","label":"O(1) average lookup"}]'),

-- Best Time to Buy and Sell Stock
('a5c3192f-49ca-5e70-bdf6-e5e36c04de4c', 'Best Time to Buy and Sell Stock', 121, 'Easy',
'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
'function maxProfit(prices: number[]): number {

}',
'',
'[{"input":{"prices":[7,1,5,3,6,4]},"expected":5},{"input":{"prices":[7,6,4,3,1]},"expected":0},{"input":{"prices":[1,2]},"expected":1}]',
'{"leetcode"}', 'Sliding Window', 'Sliding Window', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 4, 'sliding-window.technique',
'[{"slug":"sliding-window.technique","label":"Sliding Window"}]'),

-- Valid Parentheses
('64822c8c-b866-5494-9424-081dd1a29659', 'Valid Parentheses', 20, 'Easy',
'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
'function isValid(s: string): boolean {

}',
'',
'[{"input":{"s":"()"},"expected":true},{"input":{"s":"()[]{}"},"expected":true},{"input":{"s":"(]"},"expected":false},{"input":{"s":"([)]"},"expected":false},{"input":{"s":"{[]}"},"expected":true}]',
'{"leetcode"}', 'Stack', 'Stack', 'https://leetcode.com/problems/valid-parentheses/', 5, 'stack.lifo-model',
'[{"slug":"stack.lifo-model","label":"Stack LIFO model"}]'),

-- Binary Search
('09fc40df-4b89-5e7b-95a1-e6ebb696bfdf', 'Binary Search', 704, 'Easy',
'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
'function search(nums: number[], target: number): number {

}',
'',
'[{"input":{"nums":[-1,0,3,5,9,12],"target":9},"expected":4},{"input":{"nums":[-1,0,3,5,9,12],"target":2},"expected":-1},{"input":{"nums":[5],"target":5},"expected":0}]',
'{"leetcode"}', 'Binary Search', 'Binary Search', 'https://leetcode.com/problems/binary-search/', 6, 'binary-search.technique',
'[{"slug":"binary-search.technique","label":"Binary Search"}]'),

-- Reverse Linked List
('6819b7b2-2c8c-5dae-91c2-381c809431e2', 'Reverse Linked List', 206, 'Easy',
'Given the head of a singly linked list, reverse the list, and return the reversed list.',
'class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }
}

function reverseList(head: ListNode | null): ListNode | null {

}',
'function arrayToList(arr: number[]): ListNode | null {
  if (!arr.length) return null;
  const head = new ListNode(arr[0]);
  let cur = head;
  for (let i = 1; i < arr.length; i++) { cur.next = new ListNode(arr[i]); cur = cur.next; }
  return head;
}
function listToArray(head: ListNode | null): number[] {
  const res: number[] = [];
  while (head) { res.push(head.val); head = head.next; }
  return res;
}',
'[{"input":{"head":[1,2,3,4,5]},"expected":[5,4,3,2,1]},{"input":{"head":[1,2]},"expected":[2,1]},{"input":{"head":[]},"expected":[]}]',
'{"leetcode"}', 'Linked List', 'Two Pointers', 'https://leetcode.com/problems/reverse-linked-list/', 7, null,
'[{"slug":"two-pointer.opposite-ends","label":"Two pointers"}]'),

-- Maximum Subarray (Kadane''s)
('e7ea5536-07ea-5c47-9261-a2d9a0936aa5', 'Maximum Subarray', 53, 'Medium',
'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
'function maxSubArray(nums: number[]): number {

}',
'',
'[{"input":{"nums":[-2,1,-3,4,-1,2,1,-5,4]},"expected":6},{"input":{"nums":[1]},"expected":1},{"input":{"nums":[5,4,-1,7,8]},"expected":23}]',
'{"leetcode"}', 'Dynamic Programming', 'Kadane''s Algorithm', 'https://leetcode.com/problems/maximum-subarray/', 8, 'dp.memoization',
'[{"slug":"dp.memoization","label":"Dynamic Programming"}]'),

-- Climbing Stairs
('4f2d2679-48da-5bbb-8ea2-19fe5da3d5c1', 'Climbing Stairs', 70, 'Easy',
'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
'function climbStairs(n: number): number {

}',
'',
'[{"input":{"n":2},"expected":2},{"input":{"n":3},"expected":3},{"input":{"n":5},"expected":8},{"input":{"n":10},"expected":89}]',
'{"leetcode"}', 'Dynamic Programming', '1D DP', 'https://leetcode.com/problems/climbing-stairs/', 9, 'dp.memoization',
'[{"slug":"dp.memoization","label":"Dynamic Programming (Memoization)"}]'),

-- Number of Islands
('d5e04cbe-1a27-5aed-b1a2-6dc3cab6d2c4', 'Number of Islands', 200, 'Medium',
'Given an m x n 2D binary grid grid which represents a map of ''1''s (land) and ''0''s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
'function numIslands(grid: string[][]): number {

}',
'',
'[{"input":{"grid":[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]},"expected":1},{"input":{"grid":[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]},"expected":3}]',
'{"leetcode"}', 'Graphs', 'BFS/DFS', 'https://leetcode.com/problems/number-of-islands/', 10, 'graph.traversal-dfs',
'[{"slug":"graph.traversal-dfs","label":"DFS Traversal"},{"slug":"graph.traversal-bfs","label":"BFS Traversal"}]')

on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- LearningArticles
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."LearningArticles" (id, topic_id, slug, title, excerpt, body, reading_time_minutes, is_premium, is_published, order_index, concept_tags, primary_concept, practice_question_id) values

-- Arrays article -> data-structures topic
('cccbc9bf-657d-5781-b30e-18f0f7deabd4',
 '5e7e43b1-f337-4791-8889-a6e2de2f5ddb',
 'arrays',
 'Arrays',
 'The building block of every algorithm. Learn how arrays work under the hood and why their trade-offs show up everywhere.',
 E'# Arrays\n\nAn array is a contiguous block of memory where each element is the same size. That contiguous layout is what gives arrays their superpower: **O(1) random access**.\n\n## Memory Layout\n\nWhen you write `const arr = [1, 2, 3]` in JavaScript, the runtime allocates a block of memory and places each integer next to the last. To find element at index `i`, the CPU computes:\n\n```\naddress = base_address + (i * element_size)\n```\n\nOne arithmetic operation, regardless of array length. That''s why indexing is O(1).\n\n## The Trade-offs\n\n| Operation | Time Complexity | Why |\n|---|---|---|\n| Read by index | O(1) | Direct address calculation |\n| Insert at end | O(1) amortized | Dynamic resizing doubles capacity |\n| Insert at middle | O(n) | Must shift all elements right |\n| Delete at middle | O(n) | Must shift all elements left |\n| Search (unsorted) | O(n) | Must check every element |\n| Search (sorted) | O(log n) | Binary search possible |\n\n## Dynamic Resizing\n\nJavaScript arrays (and Python lists) are **dynamic** — they grow automatically. Under the hood, when capacity is exceeded, the runtime allocates a new block (typically 2x the old size) and copies all elements. This copy is O(n), but because it happens exponentially less often, the **amortized** cost of each push is O(1).\n\n## Common Patterns\n\n### Two Pointers\nUse two indices that move toward each other or in the same direction:\n```typescript\nfunction twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n```\n\n### Sliding Window\nMaintain a window of elements and slide it across the array:\n```typescript\nfunction maxProfit(prices: number[]): number {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    minPrice = Math.min(minPrice, price);\n    maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}\n```\n\n## Key Insight\n\nArrays are the right default data structure when you need **fast reads by index** and your data size is known or bounded. Reach for a different structure when you need fast insertions/deletions in the middle.',
 8, false, true, 1,
 '[{"slug":"array.random-access-o1","label":"O(1) random access"},{"slug":"array.insertion-cost","label":"Array insertion cost"},{"slug":"array.deletion-cost","label":"Array deletion cost"},{"slug":"array.dynamic-resizing","label":"Dynamic array resizing"}]',
 'array.random-access-o1',
 'f6b901eb-b5de-5899-8b2d-20e88dacdd1d'),

-- Hash Maps article -> data-structures topic
('ea62f78e-8b46-582b-99f1-4ac64cdfb0ae',
 '5e7e43b1-f337-4791-8889-a6e2de2f5ddb',
 'hash-maps',
 'Hash Maps',
 'The most useful data structure in interview prep. Understand how hashing works and when to reach for it.',
 E'# Hash Maps\n\nA hash map (also called a hash table or dictionary) maps keys to values in O(1) average time. It''s the single most useful data structure in interview prep.\n\n## How It Works\n\nA hash map internally uses an array. When you insert a key-value pair:\n1. Run the key through a **hash function** to get an integer\n2. Take that integer mod the array length to get an **index**\n3. Store the value at that index\n\n```\nindex = hash(key) % array.length\n```\n\nLookup follows the same path — hash the key, compute the index, read the value. One operation. O(1).\n\n## Collision Handling\n\nTwo different keys can hash to the same index — this is a **collision**. Common strategies:\n\n- **Chaining**: each slot holds a linked list of all key-value pairs that hash there\n- **Open addressing**: on collision, probe adjacent slots until an empty one is found\n\nChaining is what most language runtimes use (including V8 for JavaScript Maps).\n\n## Time Complexity\n\n| Operation | Average | Worst Case |\n|---|---|---|\n| Insert | O(1) | O(n) |\n| Lookup | O(1) | O(n) |\n| Delete | O(1) | O(n) |\n\nWorst case is a degenerate hash function that puts everything in one bucket. In practice with a good hash function and a load factor < 0.75, you get O(1) reliably.\n\n## The Space-Time Trade-off\n\nHash maps trade **space for time**. You''re using O(n) extra memory to get O(1) lookups instead of O(n) scans. This trade-off is almost always worth it in interviews.\n\n## Pattern: Frequency Count\n\n```typescript\nfunction isAnagram(s: string, t: string): boolean {\n  if (s.length !== t.length) return false;\n  const count = new Map<string, number>();\n  for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);\n  for (const c of t) {\n    if (!count.has(c)) return false;\n    count.set(c, count.get(c)! - 1);\n    if (count.get(c)! < 0) return false;\n  }\n  return true;\n}\n```\n\n## When to Reach for a Hash Map\n\n- You need to look something up by a key that isn''t an array index\n- You''re counting frequencies\n- You want to avoid an O(n²) nested loop — store results from the first pass, query them in the second\n- You need to detect duplicates in O(n)',
 7, false, true, 2,
 '[{"slug":"hash.o1-average-lookup","label":"O(1) average lookup"},{"slug":"hash.collision-handling","label":"Collision handling"},{"slug":"hash.space-time-tradeoff","label":"Space-time trade-off"}]',
 null,
 '46214ecc-a201-59ad-a292-da6d9798959b'),

-- Binary Search article -> patterns topic
('47a7ddbf-eeb6-5090-9ef6-44246e4b9e24',
 '99b43a89-5c96-4713-8ccc-da85c099d75f',
 'binary-search',
 'Binary Search',
 'Cut your search space in half on every step. The pattern behind O(log n) and how to apply it without bugs.',
 E'# Binary Search\n\nBinary search finds a target in a **sorted** array in O(log n) time by eliminating half the search space on each step.\n\n## The Core Idea\n\nStart with the full array. Check the middle element:\n- If it equals the target → done\n- If it''s too big → target must be in the left half\n- If it''s too small → target must be in the right half\n\nRepeat on the remaining half. With 1 million elements, you need at most 20 comparisons (log₂ 1,000,000 ≈ 20).\n\n## Bug-Free Template\n\nThe classic off-by-one error in binary search comes from the loop condition and how you update `left`/`right`. This template is correct:\n\n```typescript\nfunction search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2); // avoids overflow\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n\n  return -1;\n}\n```\n\nNote `mid + 1` and `mid - 1` — you must move past the mid element you already checked.\n\n## Beyond Simple Search\n\nBinary search applies to any problem with a **monotonic decision function** — a yes/no question where all the "yes"es come before all the "no"s (or vice versa).\n\n### Find Insert Position\n```typescript\nfunction searchInsert(nums: number[], target: number): number {\n  let left = 0, right = nums.length;\n  while (left < right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid;\n  }\n  return left;\n}\n```\n\n## Complexity\n\n| | Time | Space |\n|---|---|---|\n| Iterative | O(log n) | O(1) |\n| Recursive | O(log n) | O(log n) call stack |\n\nAlways prefer the iterative version in interviews.\n\n## Key Insight\n\nIf you''re writing an O(n) scan over sorted data, ask: "can I binary search this?" The sorted property is a free log n speedup waiting to be used.',
 6, false, true, 1,
 '[{"slug":"binary-search.technique","label":"Binary Search"},{"slug":"big-o.time-complexity","label":"Time complexity"}]',
 null,
 '09fc40df-4b89-5e7b-95a1-e6ebb696bfdf'),

-- Stacks article -> data-structures topic
('b587b84c-eb93-5e82-8757-33507a76478f',
 '5e7e43b1-f337-4791-8889-a6e2de2f5ddb',
 'stacks',
 'Stacks',
 'Last in, first out. Learn the stack model, its relationship to recursion, and the patterns it unlocks.',
 E'# Stacks\n\nA stack is a data structure that follows **Last In, First Out (LIFO)** order. The last item pushed is the first item popped.\n\n## Operations\n\n| Operation | Time | Description |\n|---|---|---|\n| push(x) | O(1) | Add to top |\n| pop() | O(1) | Remove from top |\n| peek() | O(1) | Read top without removing |\n| isEmpty() | O(1) | Check if empty |\n\nIn JavaScript, arrays work as stacks out of the box:\n```typescript\nconst stack: number[] = [];\nstack.push(1);          // [1]\nstack.push(2);          // [1, 2]\nconst top = stack.pop(); // top = 2, stack = [1]\n```\n\n## The Matching Pattern\n\nStacks shine whenever you need to match or validate **nested structure**:\n\n```typescript\nfunction isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs: Record<string, string> = { '')'': ''('', ''}'': ''{'', '']'': ''['' };\n  for (const c of s) {\n    if (''([{''.includes(c)) stack.push(c);\n    else if (stack.pop() !== pairs[c]) return false;\n  }\n  return stack.length === 0;\n}\n```\n\n## Stacks and Recursion\n\nEvery recursive call uses the **call stack** — the OS''s implicit stack of function frames. Understanding this makes recursion easier to reason about and helps you spot stack overflow risks (deep recursion on O(n) depth).\n\nIterative DFS uses an explicit stack to simulate this:\n```typescript\nfunction dfs(root: TreeNode | null): void {\n  if (!root) return;\n  const stack = [root];\n  while (stack.length) {\n    const node = stack.pop()!;\n    // process node\n    if (node.right) stack.push(node.right);\n    if (node.left) stack.push(node.left);\n  }\n}\n```\n\n## Monotonic Stack\n\nA monotonic stack maintains elements in sorted order. Use it for "next greater element" problems:\n```typescript\n// Next greater element for each position\nfunction nextGreater(nums: number[]): number[] {\n  const result = new Array(nums.length).fill(-1);\n  const stack: number[] = []; // stores indices\n  for (let i = 0; i < nums.length; i++) {\n    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n      result[stack.pop()!] = nums[i];\n    }\n    stack.push(i);\n  }\n  return result;\n}\n```',
 7, false, true, 3,
 '[{"slug":"stack.lifo-model","label":"Stack LIFO model"},{"slug":"stack.call-stack-relationship","label":"Call stack relationship"},{"slug":"stack.monotonic","label":"Monotonic stack"}]',
 null,
 '64822c8c-b866-5494-9424-081dd1a29659'),

-- Sliding Window article -> patterns topic
('40a38b1e-54c9-5901-b77b-bf0d042daa17',
 '99b43a89-5c96-4713-8ccc-da85c099d75f',
 'sliding-window',
 'Sliding Window',
 'Turn O(n²) brute force into O(n). The sliding window pattern and when to use it.',
 E'# Sliding Window\n\nThe sliding window pattern solves problems involving **contiguous subarrays or substrings** in O(n) time by maintaining a window of elements and sliding it across the input.\n\n## The Problem It Solves\n\nBrute force over all subarrays is O(n²). Sliding window reduces that to O(n) by:\n1. Expanding the window from the right\n2. Shrinking from the left when a constraint is violated\n3. Tracking the best result as you go\n\n## Fixed Window Size\n\nWhen the window size is fixed, it''s straightforward — add one from the right, remove one from the left:\n\n```typescript\n// Maximum sum of subarray of size k\nfunction maxSumSubarray(nums: number[], k: number): number {\n  let windowSum = nums.slice(0, k).reduce((a, b) => a + b, 0);\n  let maxSum = windowSum;\n  for (let i = k; i < nums.length; i++) {\n    windowSum += nums[i] - nums[i - k];\n    maxSum = Math.max(maxSum, windowSum);\n  }\n  return maxSum;\n}\n```\n\n## Variable Window Size\n\nWhen the window can grow and shrink based on a condition:\n\n```typescript\n// Longest subarray with sum ≤ target\nfunction longestSubarray(nums: number[], target: number): number {\n  let left = 0, sum = 0, maxLen = 0;\n  for (let right = 0; right < nums.length; right++) {\n    sum += nums[right];\n    while (sum > target) sum -= nums[left++];\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}\n```\n\n## Classic Example: Best Time to Buy and Sell Stock\n\n```typescript\nfunction maxProfit(prices: number[]): number {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    minPrice = Math.min(minPrice, price);\n    maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}\n```\n\nThis is a sliding window where `minPrice` tracks the left edge (best buy day seen so far).\n\n## When to Reach for Sliding Window\n\n- Problem involves a contiguous subarray or substring\n- You''re asked for max/min/count satisfying some condition\n- Brute force would be O(n²) with nested loops over a range\n- The condition is monotonic (adding elements makes it worse, not better)',
 6, false, true, 2,
 '[{"slug":"sliding-window.technique","label":"Sliding Window"},{"slug":"array.random-access-o1","label":"O(1) random access"}]',
 null,
 'a5c3192f-49ca-5e70-bdf6-e5e36c04de4c')

on conflict (id) do nothing;
