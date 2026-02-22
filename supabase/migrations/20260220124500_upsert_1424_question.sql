-- Upsert InterviewQuestions row for leetcode 1424 (Diagonal Traverse II)
-- This ensures the question exists locally for testing and corrects the test cases.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_questions_leetcode_number ON public."InterviewQuestions"(leetcode_number);

INSERT INTO public."InterviewQuestions" (id, leetcode_number, name, prompt_full, starter_code, helper_code, test_cases, difficulty, source)

VALUES (
  gen_random_uuid(),
  1424,
  'Diagonal Traverse II',
  'Given a list of lists of integers representing a matrix, return all elements of the matrix in diagonal order.',
  '',
  '',
  '[{"input": [[1,2,3],[4,5,6],[7,8,9]], "expected": [1,4,2,7,5,3,8,6,9]},{"input": [[1,2,3,4],[5,6,7,8],[9,10,11,12]], "expected": [1,5,2,9,6,3,10,7,4,11,8,12]}]',
  'Medium',
  array['seeded-fix']
)
ON CONFLICT (leetcode_number) DO UPDATE
SET test_cases = EXCLUDED.test_cases,
    name = EXCLUDED.name,
    prompt_full = EXCLUDED.prompt_full;

COMMIT;
