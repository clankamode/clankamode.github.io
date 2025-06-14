export enum QuestionCategory {
  ARRAYS_STRINGS = "Arrays/Strings",
  BACKTRACKING_DP = "Backtracking & Dynamic Programming",
  LINKED_LISTS = "Linked Lists",
  TREES = "Trees",
  GRAPHS = "Graphs",
  DESIGN = "Design Questions"
}

export enum Pattern {
  ARRAY_MANIPULATION = "Array Manipulation",
  BACKTRACKING = "Backtracking",
  BELLMAN_FORD = "Bellman-Ford",
  BFS = "BFS",
  BINARY_SEARCH = "Binary Search",
  DFS = "DFS",
  DIJKSTRAS = "Dijkstra's",
  DOUBLY_LINKED_LIST_HASH_MAP = "Doubly Linked List + Hash Map",
  DYNAMIC_PROGRAMMING = "Dynamic Programming",
  FAST_SLOW_POINTERS = "Fast & Slow Pointers",
  GRAPH = "Graph",
  GREEDY = "Greedy",
  HASH_MAP = "Hash Map",
  HASH_MAP_ARRAY = "Hash Map + Array",
  HASH_MAP_BINARY_SEARCH = "Hash Map + Binary Search",
  HASH_MAP_DOUBLY_LINKED_LIST = "Hash Map + Doubly Linked List",
  HEAP = "Heap",
  LINKED_LIST_MANIPULATION = "Linked List Manipulation",
  MATRIX = "Matrix",
  MONOTONIC_STACK = "Monotonic Stack",
  PREFIX_SUM = "Prefix Sum",
  SLIDING_WINDOW = "Sliding Window",
  STACK = "Stack",
  STRING_MANIPULATION = "String Manipulation",
  TOPOLOGICAL_SORT = "Topological Sort",
  TREE_SERIALIZATION = "Tree Serialization",
  TRIE = "Trie",
  TWO_POINTERS = "Two Pointers",
  UNION_FIND = "Union Find"
}

export interface LeetCodeQuestion {
    id: number
    title: string
    difficulty: "Easy" | "Medium" | "Hard"
    category: QuestionCategory
    leetcodeUrl: string
    pattern: Pattern
  }
  
export const PERALTA_75_LIST: LeetCodeQuestion[] = [
  {
    "id": 1,
    "title": "1. Two Sum",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "pattern": Pattern.HASH_MAP
  },
  {
    "id": 283,
    "title": "283. Move Zeroes",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/move-zeroes/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 415,
    "title": "415. Add Strings",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/add-strings/",
    "pattern": Pattern.STRING_MANIPULATION
  },
  {
    "id": 680,
    "title": "680. Valid Palindrome II",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/valid-palindrome-ii/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 408,
    "title": "408. Valid Word Abbreviation",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/valid-word-abbreviation/",
    "pattern": Pattern.STRING_MANIPULATION
  },
  {
    "id": 49,
    "title": "49. Group Anagrams",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/group-anagrams/",
    "pattern": Pattern.HASH_MAP
  },
  {
    "id": 921,
    "title": "921. Minimum Add to Make Parentheses Valid",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/",
    "pattern": Pattern.STACK
  },
  {
    "id": 151,
    "title": "151. Reverse Words in a String",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/reverse-words-in-a-string/",
    "pattern": Pattern.STRING_MANIPULATION
  },
  {
    "id": 167,
    "title": "167. Two Sum II - Input Array Is Sorted",
    "difficulty": "Easy",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 16,
    "title": "16. 3Sum Closest",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/3sum-closest/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 75,
    "title": "75. Sort Colors",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/sort-colors/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 1010,
    "title": "1010. Pairs of Songs With Total Durations Divisible by 60",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60/",
    "pattern": Pattern.HASH_MAP
  },
  {
    "id": 2260,
    "title": "2260. Minimum Consecutive Cards to Pick Up",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/minimum-consecutive-cards-to-pick-up/",
    "pattern": Pattern.HASH_MAP
  },
  {
    "id": 739,
    "title": "739. Daily Temperatures",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/daily-temperatures/",
    "pattern": Pattern.MONOTONIC_STACK
  },
  {
    "id": 1944,
    "title": "1944. Number of Visible People in a Queue",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-visible-people-in-a-queue/",
    "pattern": Pattern.MONOTONIC_STACK
  },
  {
    "id": 74,
    "title": "74. Search a 2D Matrix",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/search-a-2d-matrix/",
    "pattern": Pattern.BINARY_SEARCH
  },
  {
    "id": 1424,
    "title": "1424. Diagonal Traverse II",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/diagonal-traverse-ii/",
    "pattern": Pattern.MATRIX
  },
  {
    "id": 54,
    "title": "54. Spiral Matrix",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/spiral-matrix/",
    "pattern": Pattern.MATRIX
  },
  {
    "id": 134,
    "title": "134. Gas Station",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/gas-station/",
    "pattern": Pattern.GREEDY
  },
  {
    "id": 904,
    "title": "904. Fruit Into Baskets",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/fruit-into-baskets/",
    "pattern": Pattern.SLIDING_WINDOW
  },
  {
    "id": 325,
    "title": "325. Maximum Size Subarray Sum Equals k",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/maximum-size-subarray-sum-equals-k/",
    "pattern": Pattern.PREFIX_SUM
  },
  {
    "id": 528,
    "title": "528. Random Pick with Weight",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/random-pick-with-weight/",
    "pattern": Pattern.BINARY_SEARCH
  },
  {
    "id": 31,
    "title": "31. Next Permutation",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/next-permutation/",
    "pattern": Pattern.ARRAY_MANIPULATION
  },
  {
    "id": 253,
    "title": "253. Meeting Rooms II",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/meeting-rooms-ii/",
    "pattern": Pattern.HEAP
  },
  {
    "id": 347,
    "title": "347. Top K Frequent Elements",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/top-k-frequent-elements/",
    "pattern": Pattern.HEAP
  },
  {
    "id": 973,
    "title": "973. K Closest Points to Origin",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/k-closest-points-to-origin/",
    "pattern": Pattern.HEAP
  },
  {
    "id": 227,
    "title": "227. Basic Calculator II",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/basic-calculator-ii/",
    "pattern": Pattern.STACK
  },
  {
    "id": 735,
    "title": "735. Asteroid Collision",
    "difficulty": "Medium",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/asteroid-collision/",
    "pattern": Pattern.STACK
  },
  {
    "id": 84,
    "title": "84. Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "category": QuestionCategory.ARRAYS_STRINGS,
    "leetcodeUrl": "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    "pattern": Pattern.MONOTONIC_STACK
  },
  {
    "id": 746,
    "title": "746. Min Cost Climbing Stairs",
    "difficulty": "Easy",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/min-cost-climbing-stairs/",
    "pattern": Pattern.DYNAMIC_PROGRAMMING
  },
  {
    "id": 46,
    "title": "46. Permutations",
    "difficulty": "Medium",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/permutations/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 77,
    "title": "77. Combinations",
    "difficulty": "Medium",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/combinations/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 216,
    "title": "216. Combination Sum III",
    "difficulty": "Medium",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/combination-sum-iii/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 17,
    "title": "17. Letter Combinations of a Phone Number",
    "difficulty": "Medium",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 37,
    "title": "37. Sudoku Solver",
    "difficulty": "Hard",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/sudoku-solver/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 51,
    "title": "51. N-Queens",
    "difficulty": "Hard",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/n-queens/",
    "pattern": Pattern.BACKTRACKING
  },
  {
    "id": 1155,
    "title": "1155. Number of Dice Rolls With Target Sum",
    "difficulty": "Medium",
    "category": QuestionCategory.BACKTRACKING_DP,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-dice-rolls-with-target-sum/",
    "pattern": Pattern.DYNAMIC_PROGRAMMING
  },
  {
    "id": 876,
    "title": "876. Middle of the Linked List",
    "difficulty": "Easy",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/middle-of-the-linked-list/",
    "pattern": Pattern.FAST_SLOW_POINTERS
  },
  {
    "id": 142,
    "title": "142. Linked List Cycle II",
    "difficulty": "Medium",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/linked-list-cycle-ii/",
    "pattern": Pattern.FAST_SLOW_POINTERS
  },
  {
    "id": 160,
    "title": "160. Intersection of Two Linked Lists",
    "difficulty": "Easy",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    "pattern": Pattern.TWO_POINTERS
  },
  {
    "id": 2,
    "title": "2. Add Two Numbers",
    "difficulty": "Medium",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/add-two-numbers/",
    "pattern": Pattern.LINKED_LIST_MANIPULATION
  },
  {
    "id": 21,
    "title": "21. Merge Two Sorted Lists",
    "difficulty": "Easy",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/merge-two-sorted-lists/",
    "pattern": Pattern.LINKED_LIST_MANIPULATION
  },
  {
    "id": 143,
    "title": "143. Reorder List",
    "difficulty": "Medium",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/reorder-list/",
    "pattern": Pattern.LINKED_LIST_MANIPULATION
  },
  {
    "id": 23,
    "title": "23. Merge k Sorted Lists",
    "difficulty": "Hard",
    "category": QuestionCategory.LINKED_LISTS,
    "leetcodeUrl": "https://leetcode.com/problems/merge-k-sorted-lists/",
    "pattern": Pattern.HEAP
  },
  {
    "id": 543,
    "title": "543. Diameter of Binary Tree",
    "difficulty": "Easy",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/diameter-of-binary-tree/",
    "pattern": Pattern.DFS
  },
  {
    "id": 993,
    "title": "993. Cousins in Binary Tree",
    "difficulty": "Easy",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/cousins-in-binary-tree/",
    "pattern": Pattern.BFS
  },
  {
    "id": 515,
    "title": "515. Find Largest Value in Each Tree Row",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/find-largest-value-in-each-tree-row/",
    "pattern": Pattern.BFS
  },
  {
    "id": 129,
    "title": "129. Sum Root to Leaf Numbers",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/sum-root-to-leaf-numbers/",
    "pattern": Pattern.DFS
  },
  {
    "id": 236,
    "title": "236. Lowest Common Ancestor of a Binary Tree",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    "pattern": Pattern.DFS
  },
  {
    "id": 98,
    "title": "98. Validate Binary Search Tree",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/validate-binary-search-tree/",
    "pattern": Pattern.DFS
  },
  {
    "id": 1361,
    "title": "1361. Validate Binary Tree Nodes",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/validate-binary-tree-nodes/",
    "pattern": Pattern.GRAPH
  },
  {
    "id": 96,
    "title": "96. Unique Binary Search Trees",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/unique-binary-search-trees/",
    "pattern": Pattern.DYNAMIC_PROGRAMMING
  },
  {
    "id": 1268,
    "title": "1268. Search Suggestions System",
    "difficulty": "Medium",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/search-suggestions-system/",
    "pattern": Pattern.TRIE
  },
  {
    "id": 297,
    "title": "297. Serialize and Deserialize Binary Tree",
    "difficulty": "Hard",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    "pattern": Pattern.TREE_SERIALIZATION
  },
  {
    "id": 428,
    "title": "428. Serialize and Deserialize N-ary Tree",
    "difficulty": "Hard",
    "category": QuestionCategory.TREES,
    "leetcodeUrl": "https://leetcode.com/problems/serialize-and-deserialize-n-ary-tree/",
    "pattern": Pattern.TREE_SERIALIZATION
  },
  {
    "id": 200,
    "title": "200. Number of Islands",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-islands/",
    "pattern": Pattern.DFS
  },
  {
    "id": 286,
    "title": "286. Walls and Gates",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/walls-and-gates/",
    "pattern": Pattern.BFS
  },
  {
    "id": 721,
    "title": "721. Accounts Merge",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/accounts-merge/",
    "pattern": Pattern.UNION_FIND
  },
  {
    "id": 547,
    "title": "547. Number of Provinces",
    "difficulty": "Easy",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/number-of-provinces/",
    "pattern": Pattern.UNION_FIND
  },
  {
    "id": 743,
    "title": "743. Network Delay Time",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/network-delay-time/",
    "pattern": Pattern.DIJKSTRAS
  },
  {
    "id": 787,
    "title": "787. Cheapest Flights Within K Stops",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
    "pattern": Pattern.BELLMAN_FORD
  },
  {
    "id": 505,
    "title": "505. The Maze II",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/the-maze-ii/",
    "pattern": Pattern.DIJKSTRAS
  },
  {
    "id": 2385,
    "title": "2385. Amount of Time for Binary Tree to Be Infected",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/amount-of-time-for-binary-tree-to-be-infected/",
    "pattern": Pattern.BFS
  },
  {
    "id": 1101,
    "title": "1101. The Earliest Moment When Everyone Become Friends",
    "difficulty": "Medium",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/the-earliest-moment-when-everyone-become-friends/",
    "pattern": Pattern.UNION_FIND
  },
  {
    "id": 269,
    "title": "269. Alien Dictionary",
    "difficulty": "Hard",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/alien-dictionary/",
    "pattern": Pattern.TOPOLOGICAL_SORT
  },
  {
    "id": 317,
    "title": "317. Shortest Distance from All Buildings",
    "difficulty": "Hard",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/shortest-distance-from-all-buildings/",
    "pattern": Pattern.BFS
  },
  {
    "id": 827,
    "title": "827. Making A Large Island",
    "difficulty": "Hard",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/making-a-large-island/",
    "pattern": Pattern.DFS
  },
  {
    "id": 815,
    "title": "815. Bus Routes",
    "difficulty": "Hard",
    "category": QuestionCategory.GRAPHS,
    "leetcodeUrl": "https://leetcode.com/problems/bus-routes/",
    "pattern": Pattern.BFS
  },
  {
    "id": 155,
    "title": "155. Min Stack",
    "difficulty": "Easy",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/min-stack/",
    "pattern": Pattern.STACK
  },
  {
    "id": 146,
    "title": "146. LRU Cache",
    "difficulty": "Medium",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/lru-cache/",
    "pattern": Pattern.HASH_MAP_DOUBLY_LINKED_LIST
  },
  {
    "id": 380,
    "title": "380. Insert Delete GetRandom O(1)",
    "difficulty": "Medium",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/insert-delete-getrandom-o1/",
    "pattern": Pattern.HASH_MAP_ARRAY
  },
  {
    "id": 981,
    "title": "981. Time Based Key-Value Store",
    "difficulty": "Medium",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/time-based-key-value-store/",
    "pattern": Pattern.HASH_MAP_BINARY_SEARCH
  },
  {
    "id": 588,
    "title": "588. Design In-Memory File System",
    "difficulty": "Hard",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/design-in-memory-file-system/",
    "pattern": Pattern.TRIE
  },
  {
    "id": 432,
    "title": "432. All O`one Data Structure",
    "difficulty": "Hard",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/all-oone-data-structure/",
    "pattern": Pattern.DOUBLY_LINKED_LIST_HASH_MAP
  },
  {
    "id": 631,
    "title": "631. Design Excel Sum Formula",
    "difficulty": "Hard",
    "category": QuestionCategory.DESIGN,
    "leetcodeUrl": "https://leetcode.com/problems/design-excel-sum-formula/",
    "pattern": Pattern.TOPOLOGICAL_SORT
  }
]
