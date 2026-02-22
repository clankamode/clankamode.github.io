-- =============================================================================
-- Local dev seed data — pulled from production 2026-02-18.
-- Covers structural/reference data only. No user activity data.
-- Articles are NOT seeded here (too large). Use `supabase db dump`
-- with `--data-only -t LearningArticles` if you need article content.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Users (test accounts for local dev)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public."Users" (email, role) values
  ('admin@test.local',  'ADMIN'),
  ('editor@test.local', 'EDITOR'),
  ('user@test.local',   'USER')
on conflict (email) do nothing;

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
  ('dea9e78c-a9d7-4424-bc4d-d377a5a61494', 'graph.traversal-dfs',             'DFS Traversal',                              null,                null, 'dsa', 'technique', '2026-02-07 20:15:59.898183+00'),
  ('bacfb0e8-2665-4d02-8fb6-61cdbf8ad768', 'tree.traversal-inorder',          'Inorder Traversal',                          null,                null, 'dsa', 'technique', '2026-02-07 20:15:59.898183+00'),
  ('717655f6-a468-4dc3-8e09-8d6c72ee8a81', 'graph.representation',            'Graph Representations (Matrix vs List)',     null,                null, 'dsa', 'structure', '2026-02-17 02:52:59.357143+00'),
  ('52a0d491-8cde-44a4-89c9-8e28e0fd1dac', 'graph.terminology',               'Graph Terminology (Vertex, Edge, Weight)',   null,                null, 'dsa', 'concept',   '2026-02-17 02:52:59.357143+00'),
  ('00c7d8bc-cb31-446f-b802-890682ce742b', 'graph.shortest-path-dijkstra',    'Dijkstra''s Algorithm',                      null,                null, 'dsa', 'algorithm', '2026-02-17 02:49:22.180617+00'),
  -- DSA: Patterns
  ('d803ca34-b042-493f-ae7a-392f54b04fa5', 'two-pointers.technique',          'Two Pointers',                               null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('0b092e7c-9df3-4ab1-9b81-bcf0aacb6973', 'sliding-window.technique',        'Sliding Window',                             null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('fe541615-e9e7-4421-8005-765b1f2550b8', 'fast-slow-pointers.cycle-detection','Fast & Slow Pointers',                     null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('4b953e41-49f1-4ecf-8bc0-c2418c326269', 'math.prefix-sum',                 'Prefix Sums',                                null,                null, 'dsa', 'pattern',   '2026-02-17 02:49:22.180617+00'),
  ('81cf0afc-6e5b-4f26-a619-2775b7d0d61e', 'binary-search.technique',         'Binary Search',                              null,                null, 'dsa', 'algorithm', '2026-02-17 02:49:22.180617+00'),
  ('46fc5be1-2591-40b3-896b-996104667857', 'backtracking.search',              'Backtracking',                               null,                null, 'dsa', 'technique', '2026-02-17 02:49:22.180617+00'),
  ('7d3636b7-47e1-4638-bce5-7bb414ad0c5d', 'dp.memoization',                  'Dynamic Programming (Memoization)',          null,                null, 'dsa', 'technique', '2026-02-17 02:49:22.180617+00'),
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
  ('binary-search.technique',          'array.random-access-o1',           'dsa', 2),
  ('dp.memoization',                   'hash.o1-average-lookup',           'dsa', 1),
  ('dp.memoization',                   'recursion.base-case',              'dsa', 3),
  ('fast-slow-pointers.cycle-detection','list.pointer-invariants',         'dsa', 2),
  ('graph.representation',             'array.random-access-o1',           'dsa', 1),
  ('graph.representation',             'list.pointer-invariants',          'dsa', 1),
  ('graph.shortest-path-dijkstra',     'heap.priority-queue',              'dsa', 2),
  ('graph.shortest-path-dijkstra',     'graph.traversal-bfs',              'dsa', 2),
  ('graph.traversal-bfs',              'queue.fifo-model',                 'dsa', 2),
  ('graph.traversal-dfs',              'stack.lifo-model',                 'dsa', 1),
  ('graph.traversal-dfs',              'recursion.base-case',              'dsa', 2),
  ('hash.o1-average-lookup',           'hash.space-time-tradeoff',         'dsa', 2),
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
  ('sliding-window.technique',         'two-pointers.technique',           'dsa', 1),
  ('stack.lifo-model',                 'list.pointer-invariants',          'dsa', 1),
  ('stack.monotonic',                  'stack.lifo-model',                 'dsa', 2),
  ('tree.bst-invariant',               'tree.properties',                  'dsa', 1),
  ('tree.bst-invariant',               'tree.parent-child-model',          'dsa', 2),
  ('tree.parent-child-model',          'list.pointer-invariants',          'dsa', 1),
  ('tree.properties',                  'tree.parent-child-model',          'dsa', 1),
  ('tree.recursive-structure',         'recursion.base-case',              'dsa', 2),
  ('tree.traversal-orders',            'tree.recursive-structure',         'dsa', 1),
  ('trie.prefix-tree',                 'hash.o1-average-lookup',           'dsa', 1),
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
