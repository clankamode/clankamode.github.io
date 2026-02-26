-- Add resolution column to UserFeedback for close reasons
ALTER TABLE public."UserFeedback"
  ADD COLUMN IF NOT EXISTS resolution text DEFAULT NULL
  CHECK (resolution IS NULL OR resolution = ANY (ARRAY['resolved', 'wont_fix', 'duplicate', 'not_a_bug']));

COMMENT ON COLUMN public."UserFeedback".resolution IS 'Why this feedback was closed: resolved, wont_fix, duplicate, not_a_bug';
