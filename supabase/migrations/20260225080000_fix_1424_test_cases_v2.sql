-- Migration: fix LeetCode 1424 (Diagonal Traverse II) test cases v2
-- Reported bug: "typo and wrong test case on diagonal array 2"
--
-- Fixes:
-- 1. Ensures test_cases use the fnCall format required by the code editor
-- 2. Keeps existing function name find_diagonal_order (matches prod starter_code)
-- 3. Preserves all 4 prod test cases + adds a 5th jagged array case
-- 4. Updates prompt_full with clearer explanation

BEGIN;

UPDATE public."InterviewQuestions"
SET
  prompt_full = E'Given a 2D integer array `nums`, return all elements of `nums` in diagonal order.\n\nIn Diagonal Traverse II, we process diagonals where elements share the same sum of their row and column indices (`i + j`). Within each diagonal, elements are traversed from bottom to top (highest row index first).\n\nExample:\n```\nInput: nums = [[1,2,3],[4,5,6],[7,8,9]]\nOutput: [1,4,2,7,5,3,8,6,9]\n```',
  helper_code = '',
  test_cases = '[
    {
      "id": 1,
      "label": "3x3 matrix",
      "input": "nums = [[1,2,3],[4,5,6],[7,8,9]]",
      "fnCall": "find_diagonal_order([[1,2,3],[4,5,6],[7,8,9]])",
      "expected": "[1, 4, 2, 7, 5, 3, 8, 6, 9]",
      "expectedOutput": "[1,4,2,7,5,3,8,6,9]"
    },
    {
      "id": 2,
      "label": "Jagged matrix",
      "input": "nums = [[1,2,3,4,5],[6,7],[8],[9,10,11],[12,13,14,15,16]]",
      "fnCall": "find_diagonal_order([[1,2,3,4,5],[6,7],[8],[9,10,11],[12,13,14,15,16]])",
      "expected": "[1, 6, 2, 8, 7, 3, 9, 4, 12, 10, 5, 13, 11, 14, 15, 16]",
      "expectedOutput": "[1,6,2,8,7,3,9,4,12,10,5,13,11,14,15,16]"
    },
    {
      "id": 3,
      "label": "Single row",
      "input": "nums = [[1,2,3]]",
      "fnCall": "find_diagonal_order([[1,2,3]])",
      "expected": "[1, 2, 3]",
      "expectedOutput": "[1,2,3]"
    },
    {
      "id": 4,
      "label": "Single column",
      "input": "nums = [[1],[2],[3]]",
      "fnCall": "find_diagonal_order([[1],[2],[3]])",
      "expected": "[1, 2, 3]",
      "expectedOutput": "[1,2,3]"
    },
    {
      "id": 5,
      "label": "Jagged array (uneven rows)",
      "input": "nums = [[1,2,3],[4],[5,6,7],[8],[9,10,11]]",
      "fnCall": "find_diagonal_order([[1,2,3],[4],[5,6,7],[8],[9,10,11]])",
      "expected": "[1, 4, 2, 5, 3, 8, 6, 9, 7, 10, 11]",
      "expectedOutput": "[1,4,2,5,3,8,6,9,7,10,11]"
    }
  ]'::jsonb
WHERE leetcode_number = 1424;

COMMIT;
