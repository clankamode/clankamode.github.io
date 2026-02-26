ALTER TABLE "TutorConversations" ADD COLUMN IF NOT EXISTS "session_uuid" TEXT;
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_session_uuid ON "TutorConversations"("session_uuid");
