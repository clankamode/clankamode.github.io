-- Extend Users table with profile fields
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS username text unique,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS leetcode_url text,
  ADD COLUMN IF NOT EXISTS codeforces_url text;

-- Default username from email prefix, appending id suffix for duplicates
UPDATE "Users" u
SET username = CASE
  WHEN (
    SELECT COUNT(*) FROM "Users" u2
    WHERE split_part(u2.email, '@', 1) = split_part(u.email, '@', 1)
  ) > 1
  THEN split_part(u.email, '@', 1) || '_' || u.id::text
  ELSE split_part(u.email, '@', 1)
END
WHERE username IS NULL;

-- Track per-user solved questions
CREATE TABLE IF NOT EXISTS public."UserQuestionSubmissions" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  google_id   text,
  question_id uuid NOT NULL REFERENCES public."InterviewQuestions"(id),
  solved      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, question_id)
);

-- Badge definitions
CREATE TABLE IF NOT EXISTS public."Badges" (
  slug           text PRIMARY KEY,
  name           text NOT NULL,
  description    text NOT NULL,
  icon_name      text NOT NULL,
  criteria_type  text NOT NULL,
  criteria_value integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Per-user earned badges
CREATE TABLE IF NOT EXISTS public."UserBadges" (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  google_id  text,
  badge_slug text NOT NULL REFERENCES public."Badges"(slug),
  earned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, badge_slug)
);

-- Seed starter badges
INSERT INTO public."Badges" (slug, name, description, icon_name, criteria_type, criteria_value) VALUES
  ('first-step',       'First Step',        'Read your first article',        'BookOpen',    'articles_read',           1),
  ('bookworm',         'Bookworm',          'Read 10 articles',               'BookMarked',  'articles_read',           10),
  ('deep-reader',      'Deep Reader',       'Read 25 articles',               'Library',     'articles_read',           25),
  ('question-crusher', 'Question Crusher',  'Solve your first 10 questions',  'Code2',       'questions_solved',        10),
  ('problem-solver',   'Problem Solver',    'Solve 25 questions',             'Trophy',      'questions_solved',        25),
  ('halfway-there',    'Halfway There',     'Solve 73 questions',             'Target',      'questions_solved',        73),
  ('concept-learner',  'Concept Learner',   'Internalize 10 concepts',        'Brain',       'concepts_internalized',   10),
  ('concept-master',   'Concept Master',    'Internalize 25 concepts',        'Zap',         'concepts_internalized',   25)
ON CONFLICT (slug) DO NOTHING;
