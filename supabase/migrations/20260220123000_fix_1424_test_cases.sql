-- Migration: fix test cases for LeetCode 1424 Diagonal Traverse II
-- Adjusts a wrong test case and corrects a small typo reported via user feedback.

BEGIN;

UPDATE public."InterviewQuestions"
SET test_cases = (
  -- Replace test_cases with corrected JSON array for safety; adjust as needed.
  '[
    { "input": [[1,2,3],[4,5,6],[7,8,9]], "expected": [1,4,2,7,5,3,8,6,9] },
    { "input": [[1,2,3,4],[5,6,7,8],[9,10,11,12]], "expected": [1,5,2,9,6,3,10,7,4,11,8,12] }
  ]'
)::jsonb
WHERE leetcode_number = 1424;

COMMIT;
