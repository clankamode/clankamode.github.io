-- Add missing unique constraint on UserArticleProgress (email, article_id)
-- Required for upsert ON CONFLICT (email, article_id) in /api/progress/complete
-- Without this, the route returns 500 with PostgreSQL error 42P10.

ALTER TABLE public."UserArticleProgress"
  ADD CONSTRAINT uq_user_article_progress_email_article UNIQUE (email, article_id);
