-- Tutor conversations for session intent tutoring flow

-- Ensure shared updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "TutorConversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL REFERENCES "Sessions"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "article_id" UUID REFERENCES "LearningArticles"("id") ON DELETE SET NULL,
  "messages" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_conversations_session_id ON "TutorConversations"("session_id");
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_id ON "TutorConversations"("user_id");

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_tutor_conversations_updated_at
  BEFORE UPDATE ON "TutorConversations"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
