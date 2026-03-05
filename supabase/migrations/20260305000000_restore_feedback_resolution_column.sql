-- Restore resolution column for admin feedback close reasons.
ALTER TABLE public."UserFeedback"
  ADD COLUMN IF NOT EXISTS resolution text DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public."UserFeedback"'::regclass
      AND conname IN ('UserFeedback_resolution_check', 'user_feedback_resolution_check')
  ) THEN
    ALTER TABLE public."UserFeedback"
      ADD CONSTRAINT user_feedback_resolution_check
      CHECK (resolution IS NULL OR resolution = ANY (ARRAY['resolved', 'wont_fix', 'duplicate', 'not_a_bug']));
  END IF;
END $$;

COMMENT ON COLUMN public."UserFeedback".resolution IS 'Why this feedback was closed: resolved, wont_fix, duplicate, not_a_bug';
