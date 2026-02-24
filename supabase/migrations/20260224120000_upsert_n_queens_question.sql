-- Migration: upsert N-Queens (LeetCode 51) with correct sort-order-independent test cases
-- Fixes: "solution passes on LC but not the site" at /code-editor/practice/51
-- Root cause: test_cases lacked sortResult:true, so valid solutions in a different
--             order than expected would fail. N-Queens solutions are unordered by spec.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_questions_leetcode_number
  ON public."InterviewQuestions"(leetcode_number);

INSERT INTO public."InterviewQuestions" (
  id,
  leetcode_number,
  name,
  difficulty,
  category,
  pattern,
  leetcode_url,
  prompt_full,
  starter_code,
  helper_code,
  test_cases,
  source
)
VALUES (
  gen_random_uuid(),
  51,
  'N-Queens',
  'Hard',
  'Backtracking',
  'Backtracking',
  'https://leetcode.com/problems/n-queens/',
  'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order. Each solution contains a distinct board configuration of the n-queens'' placement, where ''Q'' and ''.'' both indicate a queen and an empty space, respectively.',
  E'def solve_n_queens(n: int) -> list[list[str]]:\n    """\n    Place n queens on an n x n chessboard such that no two queens\n    attack each other. Return all distinct solutions.\n\n    Each solution is a list of n strings, each of length n.\n    ''Q'' = queen, ''.'' = empty.\n\n    Example:\n        Input:  n = 4\n        Output: [[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],\n                 [\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]\n    """\n    pass\n',
  '',
  '[
    {
      "id": 1,
      "label": "n = 1",
      "fnCall": "solve_n_queens(1)",
      "expected": [["Q"]],
      "sortResult": false
    },
    {
      "id": 2,
      "label": "n = 4 (2 solutions, order-independent)",
      "fnCall": "sorted(solve_n_queens(4))",
      "expected": [["..Q.","Q...","...Q",".Q.."], [".Q..","...Q","Q...","..Q."]],
      "sortResult": false
    },
    {
      "id": 3,
      "label": "n = 4 solution count",
      "fnCall": "len(solve_n_queens(4))",
      "expected": 2,
      "sortResult": false
    }
  ]'::jsonb,
  array['leetcode']
)
ON CONFLICT (leetcode_number) DO UPDATE
  SET
    test_cases = '[
      {
        "id": 1,
        "label": "n = 1",
        "fnCall": "solve_n_queens(1)",
        "expected": [["Q"]],
        "sortResult": false
      },
      {
        "id": 2,
        "label": "n = 4 (2 solutions, order-independent)",
        "fnCall": "sorted(solve_n_queens(4))",
        "expected": [["..Q.","Q...","...Q",".Q.."], [".Q..","...Q","Q...","..Q."]],
        "sortResult": false
      },
      {
        "id": 3,
        "label": "n = 4 solution count",
        "fnCall": "len(solve_n_queens(4))",
        "expected": 2,
        "sortResult": false
      }
    ]'::jsonb,
    name        = EXCLUDED.name,
    difficulty  = EXCLUDED.difficulty,
    category    = EXCLUDED.category,
    pattern     = EXCLUDED.pattern,
    leetcode_url = EXCLUDED.leetcode_url,
    prompt_full = EXCLUDED.prompt_full,
    starter_code = EXCLUDED.starter_code;

COMMIT;
