-- Migration: fix Group Anagrams (LeetCode 49) test cases
-- Root cause: test runner sortResult only sorted the outer list, not inner groups.
--             A buggy solution grouping non-anagrams together could pass if the
--             expected value happened to match the wrong grouping order.
-- Fix:
--   1. PracticeEditor.tsx now deep-sorts (inner lists too) when sortResult=true.
--   2. This migration upserts correct test cases with sortResult:true and adds
--      the user-reported failing case: ["ddddddddddg","dggggggggggg"] (not anagrams).

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_questions_leetcode_number
  ON public."InterviewQuestions"(leetcode_number);

UPDATE public."InterviewQuestions"
SET test_cases = '[
  {
    "id": 1,
    "label": "LeetCode example 1",
    "fnCall": "group_anagrams([\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"])",
    "expected": "[[\"ate\",\"eat\",\"tea\"],[\"bat\"],[\"nat\",\"tan\"]]",
    "sortResult": true
  },
  {
    "id": 2,
    "label": "Single empty string",
    "fnCall": "group_anagrams([\"\"])",
    "expected": "[[\"\"]]",
    "sortResult": true
  },
  {
    "id": 3,
    "label": "Single char",
    "fnCall": "group_anagrams([\"a\"])",
    "expected": "[[\"a\"]]",
    "sortResult": true
  },
  {
    "id": 4,
    "label": "No anagrams — all separate groups",
    "fnCall": "group_anagrams([\"abc\",\"def\",\"ghi\"])",
    "expected": "[[\"abc\"],[\"def\"],[\"ghi\"]]",
    "sortResult": true
  },
  {
    "id": 5,
    "label": "User-reported: non-anagram long strings must be separate groups",
    "fnCall": "group_anagrams([\"ddddddddddg\",\"dggggggggggg\"])",
    "expected": "[[\"ddddddddddg\"],[\"dggggggggggg\"]]",
    "sortResult": true
  }
]'::jsonb
WHERE leetcode_number = 49;

COMMIT;
