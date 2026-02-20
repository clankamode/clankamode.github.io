-- Store user's passing source code for each question so it can be loaded when they return
ALTER TABLE public."UserQuestionSubmissions"
  ADD COLUMN IF NOT EXISTS source_code text;
