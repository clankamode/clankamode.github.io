drop trigger if exists "update_tutor_conversations_updated_at" on "public"."TutorConversations";

drop policy "anon_all_local_dev" on "public"."TelemetryEvents";

drop policy "anon_all_local_dev" on "public"."UserArticleProgress";

drop policy "anon_all_local_dev" on "public"."UserBookmarks";

drop policy "anon_all_local_dev" on "public"."UserConceptStats";

drop policy "anon_all_local_dev" on "public"."UserFeedback";

drop policy "anon_all_local_dev" on "public"."UserInternalizations";

drop policy "anon_all_local_dev" on "public"."UserPracticeProgress";

revoke delete on table "public"."LiveQuestionVotes" from "anon";

revoke insert on table "public"."LiveQuestionVotes" from "anon";

revoke references on table "public"."LiveQuestionVotes" from "anon";

revoke select on table "public"."LiveQuestionVotes" from "anon";

revoke trigger on table "public"."LiveQuestionVotes" from "anon";

revoke truncate on table "public"."LiveQuestionVotes" from "anon";

revoke update on table "public"."LiveQuestionVotes" from "anon";

revoke delete on table "public"."LiveQuestionVotes" from "authenticated";

revoke insert on table "public"."LiveQuestionVotes" from "authenticated";

revoke references on table "public"."LiveQuestionVotes" from "authenticated";

revoke select on table "public"."LiveQuestionVotes" from "authenticated";

revoke trigger on table "public"."LiveQuestionVotes" from "authenticated";

revoke truncate on table "public"."LiveQuestionVotes" from "authenticated";

revoke update on table "public"."LiveQuestionVotes" from "authenticated";

revoke delete on table "public"."LiveQuestionVotes" from "service_role";

revoke insert on table "public"."LiveQuestionVotes" from "service_role";

revoke references on table "public"."LiveQuestionVotes" from "service_role";

revoke select on table "public"."LiveQuestionVotes" from "service_role";

revoke trigger on table "public"."LiveQuestionVotes" from "service_role";

revoke truncate on table "public"."LiveQuestionVotes" from "service_role";

revoke update on table "public"."LiveQuestionVotes" from "service_role";

revoke delete on table "public"."LiveQuestions" from "anon";

revoke insert on table "public"."LiveQuestions" from "anon";

revoke references on table "public"."LiveQuestions" from "anon";

revoke select on table "public"."LiveQuestions" from "anon";

revoke trigger on table "public"."LiveQuestions" from "anon";

revoke truncate on table "public"."LiveQuestions" from "anon";

revoke update on table "public"."LiveQuestions" from "anon";

revoke delete on table "public"."LiveQuestions" from "authenticated";

revoke insert on table "public"."LiveQuestions" from "authenticated";

revoke references on table "public"."LiveQuestions" from "authenticated";

revoke select on table "public"."LiveQuestions" from "authenticated";

revoke trigger on table "public"."LiveQuestions" from "authenticated";

revoke truncate on table "public"."LiveQuestions" from "authenticated";

revoke update on table "public"."LiveQuestions" from "authenticated";

revoke delete on table "public"."LiveQuestions" from "service_role";

revoke insert on table "public"."LiveQuestions" from "service_role";

revoke references on table "public"."LiveQuestions" from "service_role";

revoke select on table "public"."LiveQuestions" from "service_role";

revoke trigger on table "public"."LiveQuestions" from "service_role";

revoke truncate on table "public"."LiveQuestions" from "service_role";

revoke update on table "public"."LiveQuestions" from "service_role";

revoke delete on table "public"."TestAnswer" from "anon";

revoke insert on table "public"."TestAnswer" from "anon";

revoke references on table "public"."TestAnswer" from "anon";

revoke select on table "public"."TestAnswer" from "anon";

revoke trigger on table "public"."TestAnswer" from "anon";

revoke truncate on table "public"."TestAnswer" from "anon";

revoke update on table "public"."TestAnswer" from "anon";

revoke delete on table "public"."TestAnswer" from "authenticated";

revoke insert on table "public"."TestAnswer" from "authenticated";

revoke references on table "public"."TestAnswer" from "authenticated";

revoke select on table "public"."TestAnswer" from "authenticated";

revoke trigger on table "public"."TestAnswer" from "authenticated";

revoke truncate on table "public"."TestAnswer" from "authenticated";

revoke update on table "public"."TestAnswer" from "authenticated";

revoke delete on table "public"."TestAnswer" from "service_role";

revoke insert on table "public"."TestAnswer" from "service_role";

revoke references on table "public"."TestAnswer" from "service_role";

revoke select on table "public"."TestAnswer" from "service_role";

revoke trigger on table "public"."TestAnswer" from "service_role";

revoke truncate on table "public"."TestAnswer" from "service_role";

revoke update on table "public"."TestAnswer" from "service_role";

revoke delete on table "public"."TutorConversations" from "anon";

revoke insert on table "public"."TutorConversations" from "anon";

revoke references on table "public"."TutorConversations" from "anon";

revoke select on table "public"."TutorConversations" from "anon";

revoke trigger on table "public"."TutorConversations" from "anon";

revoke truncate on table "public"."TutorConversations" from "anon";

revoke update on table "public"."TutorConversations" from "anon";

revoke delete on table "public"."TutorConversations" from "authenticated";

revoke insert on table "public"."TutorConversations" from "authenticated";

revoke references on table "public"."TutorConversations" from "authenticated";

revoke select on table "public"."TutorConversations" from "authenticated";

revoke trigger on table "public"."TutorConversations" from "authenticated";

revoke truncate on table "public"."TutorConversations" from "authenticated";

revoke update on table "public"."TutorConversations" from "authenticated";

revoke delete on table "public"."TutorConversations" from "service_role";

revoke insert on table "public"."TutorConversations" from "service_role";

revoke references on table "public"."TutorConversations" from "service_role";

revoke select on table "public"."TutorConversations" from "service_role";

revoke trigger on table "public"."TutorConversations" from "service_role";

revoke truncate on table "public"."TutorConversations" from "service_role";

revoke update on table "public"."TutorConversations" from "service_role";

alter table "public"."AmaQuestions" drop constraint "AmaQuestions_question_check";

alter table "public"."AmaQuestions" drop constraint "AmaQuestions_vote_count_check";

alter table "public"."ChatMessages" drop constraint "ChatMessages_conversation_id_fkey";

alter table "public"."LiveQuestionVotes" drop constraint "LiveQuestionVotes_question_id_fkey";

alter table "public"."LiveQuestionVotes" drop constraint "LiveQuestionVotes_question_id_user_email_key";

alter table "public"."TestAnswer" drop constraint "TestAnswer_question_id_fkey";

alter table "public"."TestAnswer" drop constraint "TestAnswer_session_id_fkey";

alter table "public"."TutorConversations" drop constraint "TutorConversations_article_id_fkey";

alter table "public"."TutorConversations" drop constraint "TutorConversations_session_id_fkey";

alter table "public"."TutorConversations" drop constraint "TutorConversations_user_id_fkey";

alter table "public"."UserArticleProgress" drop constraint "uq_user_article_progress_email_article";

alter table "public"."UserFeedback" drop constraint "UserFeedback_resolution_check";

alter table "public"."ConceptDependencies" drop constraint "ConceptDependencies_concept_slug_fkey";

alter table "public"."ConceptDependencies" drop constraint "ConceptDependencies_depends_on_slug_fkey";

alter table "public"."LearningArticles" drop constraint "LearningArticles_practice_question_id_fkey";

alter table "public"."LearningArticles" drop constraint "LearningArticles_topic_id_fkey";

alter table "public"."LearningTopics" drop constraint "LearningTopics_pillar_id_fkey";

alter table "public"."UserArticleProgress" drop constraint "UserArticleProgress_article_id_fkey";

alter table "public"."UserBookmarks" drop constraint "UserBookmarks_article_id_fkey";

alter table "public"."UserConceptStats" drop constraint "UserConceptStats_concept_slug_fkey";

drop function if exists "public"."update_updated_at_column"();

alter table "public"."LiveQuestionVotes" drop constraint "LiveQuestionVotes_pkey";

alter table "public"."LiveQuestions" drop constraint "LiveQuestions_pkey";

alter table "public"."TestAnswer" drop constraint "TestAnswer_pkey";

alter table "public"."ThumbnailComments" drop constraint if exists "ThumbnailComments_thumbnail_job_id_fkey";

alter table "public"."ThumbnailJob" drop constraint "ThumbnailJob_pkey";

alter table "public"."TutorConversations" drop constraint "TutorConversations_pkey";

alter table "public"."AmaVotes" drop constraint "AmaVotes_pkey";

drop index if exists "public"."LiveQuestionVotes_pkey";

drop index if exists "public"."LiveQuestionVotes_question_id_user_email_key";

drop index if exists "public"."LiveQuestions_pkey";

drop index if exists "public"."TestAnswer_pkey";

drop index if exists "public"."ThumbnailJob_pkey";

drop index if exists "public"."TutorConversations_pkey";

drop index if exists "public"."idx_ama_questions_vote_count";

drop index if exists "public"."idx_ama_votes_user_id";

drop index if exists "public"."idx_interview_questions_leetcode_number";

drop index if exists "public"."idx_live_question_votes_google_id";

drop index if exists "public"."idx_live_questions_google_id";

drop index if exists "public"."idx_test_answer_google_id";

drop index if exists "public"."idx_tutor_conversations_session_id";

drop index if exists "public"."idx_tutor_conversations_session_uuid";

drop index if exists "public"."idx_tutor_conversations_user_id";

drop index if exists "public"."uq_user_article_progress_email_article";

drop index if exists "public"."user_concept_stats_google_track_concept_uidx";

drop index if exists "public"."AmaVotes_pkey";

drop table "public"."LiveQuestionVotes";

drop table "public"."LiveQuestions";

drop table "public"."TestAnswer";

drop table "public"."TutorConversations";


  create table "public"."ResumeReviewVotes" (
    "id" uuid not null default gen_random_uuid(),
    "review_id" uuid not null,
    "user_id" text not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."ResumeReviews" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "author_name" text,
    "title" text not null,
    "context" text,
    "resume_url" text not null,
    "resume_filename" text not null,
    "status" text not null default 'pending'::text,
    "review_notes" text,
    "reviewed_at" timestamp with time zone,
    "vote_count" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."SessionFrictionTriageAudit" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "track_slug" text not null,
    "step_index" integer not null,
    "action_type" text not null,
    "actor_email" text not null,
    "before_status" text,
    "before_owner" text,
    "before_notes" text,
    "after_status" text,
    "after_owner" text,
    "after_notes" text,
    "rationale" text,
    "metadata" jsonb not null default '{}'::jsonb
      );


alter table "public"."AmaQuestions" alter column "user_id" drop not null;

alter table "public"."AmaQuestions" enable row level security;

alter table "public"."AmaVotes" add column "created_at" timestamp with time zone not null default now();

alter table "public"."AmaVotes" add column "id" uuid not null default gen_random_uuid();

alter table "public"."AmaVotes" enable row level security;

alter table "public"."UserFeedback" drop column "resolution";

CREATE UNIQUE INDEX "AmaVotes_question_id_user_id_key" ON public."AmaVotes" USING btree (question_id, user_id);

CREATE UNIQUE INDEX "LearningArticles_topic_id_slug_key" ON public."LearningArticles" USING btree (topic_id, slug);

CREATE UNIQUE INDEX "LearningTopics_pillar_id_slug_key" ON public."LearningTopics" USING btree (pillar_id, slug);

CREATE UNIQUE INDEX "ResumeReviewVotes_pkey" ON public."ResumeReviewVotes" USING btree (id);

CREATE UNIQUE INDEX "ResumeReviewVotes_review_id_user_id_key" ON public."ResumeReviewVotes" USING btree (review_id, user_id);

CREATE UNIQUE INDEX "ResumeReviews_pkey" ON public."ResumeReviews" USING btree (id);

CREATE UNIQUE INDEX "SessionFrictionTriageAudit_pkey" ON public."SessionFrictionTriageAudit" USING btree (id);

CREATE UNIQUE INDEX "UserArticleProgress_email_article_unique" ON public."UserArticleProgress" USING btree (email, article_id);

CREATE UNIQUE INDEX "UserArticleProgress_user_id_article_id_key" ON public."UserArticleProgress" USING btree (email, article_id);

CREATE UNIQUE INDEX "UserBookmarks_user_id_article_id_key" ON public."UserBookmarks" USING btree (email, article_id);

CREATE UNIQUE INDEX "UserInternalizations_email_concept_session_unique" ON public."UserInternalizations" USING btree (email, concept_slug, session_id);

CREATE INDEX concept_dependencies_track_idx ON public."ConceptDependencies" USING btree (track_slug);

CREATE INDEX concepts_kind_idx ON public."Concepts" USING btree (kind);

CREATE INDEX concepts_track_slug_idx ON public."Concepts" USING btree (track_slug);

CREATE INDEX idx_interview_questions_concept_slug ON public."InterviewQuestions" USING btree (concept_slug);

CREATE INDEX idx_interview_questions_difficulty ON public."InterviewQuestions" USING btree (difficulty);

CREATE INDEX idx_interview_questions_source ON public."InterviewQuestions" USING gin (source);

CREATE INDEX idx_resume_review_votes_review_id ON public."ResumeReviewVotes" USING btree (review_id);

CREATE INDEX idx_resume_review_votes_user_id ON public."ResumeReviewVotes" USING btree (user_id);

CREATE INDEX idx_resume_reviews_status ON public."ResumeReviews" USING btree (status);

CREATE INDEX idx_resume_reviews_vote_count ON public."ResumeReviews" USING btree (vote_count DESC);

CREATE INDEX idx_session_ai_decisions_created_at ON public."SessionAIDecisions" USING btree (created_at DESC);

CREATE INDEX idx_session_ai_decisions_hotspot_time ON public."SessionAIDecisions" USING btree (track_slug, step_index, created_at DESC);

CREATE INDEX idx_session_friction_triage_audit_actor_time ON public."SessionFrictionTriageAudit" USING btree (actor_email, created_at DESC);

CREATE INDEX idx_session_friction_triage_audit_hotspot_time ON public."SessionFrictionTriageAudit" USING btree (track_slug, step_index, created_at DESC);

CREATE INDEX idx_user_feedback_created_at ON public."UserFeedback" USING btree (created_at DESC);

CREATE INDEX idx_user_feedback_google_id ON public."UserFeedback" USING btree (google_id);

CREATE INDEX idx_user_feedback_status_created_at ON public."UserFeedback" USING btree (status, created_at DESC);

CREATE INDEX telemetry_event_time_idx ON public."TelemetryEvents" USING btree (event_type, created_at DESC);

CREATE INDEX telemetry_session_event_idx ON public."TelemetryEvents" USING btree (session_id, event_type);

CREATE INDEX telemetry_user_time_idx ON public."TelemetryEvents" USING btree (email, created_at DESC);

CREATE UNIQUE INDEX thumbnail_job_pkey ON public."ThumbnailJob" USING btree (id);

CREATE UNIQUE INDEX uniq_session_ai_decisions_dedupe_key ON public."SessionAIDecisions" USING btree (dedupe_key) WHERE (dedupe_key IS NOT NULL);

CREATE INDEX user_article_progress_user_id_idx ON public."UserArticleProgress" USING btree (email);

CREATE INDEX user_bookmarks_user_id_idx ON public."UserBookmarks" USING btree (email);

CREATE INDEX user_concept_stats_concept_idx ON public."UserConceptStats" USING btree (concept_slug);

CREATE INDEX user_concept_stats_user_idx ON public."UserConceptStats" USING btree (email);

CREATE INDEX user_internalizations_concept_idx ON public."UserInternalizations" USING btree (concept_slug);

CREATE INDEX user_internalizations_user_id_idx ON public."UserInternalizations" USING btree (email);

CREATE UNIQUE INDEX "AmaVotes_pkey" ON public."AmaVotes" USING btree (id);

alter table "public"."ResumeReviewVotes" add constraint "ResumeReviewVotes_pkey" PRIMARY KEY using index "ResumeReviewVotes_pkey";

alter table "public"."ResumeReviews" add constraint "ResumeReviews_pkey" PRIMARY KEY using index "ResumeReviews_pkey";

alter table "public"."SessionFrictionTriageAudit" add constraint "SessionFrictionTriageAudit_pkey" PRIMARY KEY using index "SessionFrictionTriageAudit_pkey";

alter table "public"."ThumbnailJob" add constraint "thumbnail_job_pkey" PRIMARY KEY using index "thumbnail_job_pkey";

alter table "public"."ThumbnailComments" add constraint "ThumbnailComments_thumbnail_job_id_fkey" FOREIGN KEY (thumbnail_job_id) REFERENCES "public"."ThumbnailJob"(id);

alter table "public"."AmaVotes" add constraint "AmaVotes_pkey" PRIMARY KEY using index "AmaVotes_pkey";

alter table "public"."AmaVotes" add constraint "AmaVotes_question_id_user_id_key" UNIQUE using index "AmaVotes_question_id_user_id_key";

alter table "public"."LearningArticles" add constraint "LearningArticles_topic_id_slug_key" UNIQUE using index "LearningArticles_topic_id_slug_key";

alter table "public"."LearningTopics" add constraint "LearningTopics_pillar_id_slug_key" UNIQUE using index "LearningTopics_pillar_id_slug_key";

alter table "public"."ResumeReviewVotes" add constraint "ResumeReviewVotes_review_id_fkey" FOREIGN KEY (review_id) REFERENCES public."ResumeReviews"(id) ON DELETE CASCADE not valid;

alter table "public"."ResumeReviewVotes" validate constraint "ResumeReviewVotes_review_id_fkey";

alter table "public"."ResumeReviewVotes" add constraint "ResumeReviewVotes_review_id_user_id_key" UNIQUE using index "ResumeReviewVotes_review_id_user_id_key";

alter table "public"."ResumeReviews" add constraint "ResumeReviews_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text]))) not valid;

alter table "public"."ResumeReviews" validate constraint "ResumeReviews_status_check";

alter table "public"."SessionAIDecisions" add constraint "session_ai_decisions_confidence_check" CHECK (((confidence IS NULL) OR ((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)))) not valid;

alter table "public"."SessionAIDecisions" validate constraint "session_ai_decisions_confidence_check";

alter table "public"."SessionAIDecisions" add constraint "session_ai_decisions_mode_check" CHECK ((decision_mode = ANY (ARRAY['suggest'::text, 'assist'::text, 'auto'::text]))) not valid;

alter table "public"."SessionAIDecisions" validate constraint "session_ai_decisions_mode_check";

alter table "public"."SessionFrictionTriageAudit" add constraint "session_friction_triage_audit_action_type_check" CHECK ((action_type = ANY (ARRAY['manual_update'::text, 'ai_brief'::text, 'ai_recommendation'::text, 'ai_auto_batch'::text]))) not valid;

alter table "public"."SessionFrictionTriageAudit" validate constraint "session_friction_triage_audit_action_type_check";

alter table "public"."UserArticleProgress" add constraint "UserArticleProgress_email_article_unique" UNIQUE using index "UserArticleProgress_email_article_unique";

alter table "public"."UserArticleProgress" add constraint "UserArticleProgress_user_id_article_id_key" UNIQUE using index "UserArticleProgress_user_id_article_id_key";

alter table "public"."UserBookmarks" add constraint "UserBookmarks_user_id_article_id_key" UNIQUE using index "UserBookmarks_user_id_article_id_key";

alter table "public"."UserInternalizations" add constraint "UserInternalizations_email_concept_session_unique" UNIQUE using index "UserInternalizations_email_concept_session_unique";

alter table "public"."ConceptDependencies" add constraint "ConceptDependencies_concept_slug_fkey" FOREIGN KEY (concept_slug) REFERENCES public."Concepts"(slug) ON DELETE CASCADE not valid;

alter table "public"."ConceptDependencies" validate constraint "ConceptDependencies_concept_slug_fkey";

alter table "public"."ConceptDependencies" add constraint "ConceptDependencies_depends_on_slug_fkey" FOREIGN KEY (depends_on_slug) REFERENCES public."Concepts"(slug) ON DELETE CASCADE not valid;

alter table "public"."ConceptDependencies" validate constraint "ConceptDependencies_depends_on_slug_fkey";

alter table "public"."LearningArticles" add constraint "LearningArticles_practice_question_id_fkey" FOREIGN KEY (practice_question_id) REFERENCES public."InterviewQuestions"(id) ON DELETE SET NULL not valid;

alter table "public"."LearningArticles" validate constraint "LearningArticles_practice_question_id_fkey";

alter table "public"."LearningArticles" add constraint "LearningArticles_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."LearningTopics"(id) ON DELETE CASCADE not valid;

alter table "public"."LearningArticles" validate constraint "LearningArticles_topic_id_fkey";

alter table "public"."LearningTopics" add constraint "LearningTopics_pillar_id_fkey" FOREIGN KEY (pillar_id) REFERENCES public."LearningPillars"(id) ON DELETE CASCADE not valid;

alter table "public"."LearningTopics" validate constraint "LearningTopics_pillar_id_fkey";

alter table "public"."UserArticleProgress" add constraint "UserArticleProgress_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."LearningArticles"(id) ON DELETE CASCADE not valid;

alter table "public"."UserArticleProgress" validate constraint "UserArticleProgress_article_id_fkey";

alter table "public"."UserBookmarks" add constraint "UserBookmarks_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."LearningArticles"(id) ON DELETE CASCADE not valid;

alter table "public"."UserBookmarks" validate constraint "UserBookmarks_article_id_fkey";

alter table "public"."UserConceptStats" add constraint "UserConceptStats_concept_slug_fkey" FOREIGN KEY (concept_slug) REFERENCES public."Concepts"(slug) ON DELETE CASCADE not valid;

alter table "public"."UserConceptStats" validate constraint "UserConceptStats_concept_slug_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrement_resume_review_vote_count(review_id uuid)
 RETURNS integer
 LANGUAGE sql
AS $function$
  UPDATE "ResumeReviews"
  SET vote_count = GREATEST(0, vote_count - 1)
  WHERE id = review_id
  RETURNING vote_count;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_concept_exposure(p_email text, p_track_slug text, p_concept_slug text, p_last_seen_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public."UserConceptStats" (email, track_slug, concept_slug, exposures, last_seen_at)
  VALUES (p_email, p_track_slug, p_concept_slug, 1, p_last_seen_at)
  ON CONFLICT (email, track_slug, concept_slug)
  DO UPDATE SET
    exposures = "UserConceptStats".exposures + 1,
    last_seen_at = p_last_seen_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_concept_internalization(p_email text, p_track_slug text, p_concept_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public."UserConceptStats" (email, track_slug, concept_slug, internalized_count)
  VALUES (p_email, p_track_slug, p_concept_slug, 1)
  ON CONFLICT (email, track_slug, concept_slug)
  DO UPDATE SET
    internalized_count = "UserConceptStats".internalized_count + 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_resume_review_vote_count(review_id uuid)
 RETURNS integer
 LANGUAGE sql
AS $function$
  UPDATE "ResumeReviews"
  SET vote_count = vote_count + 1
  WHERE id = review_id
  RETURNING vote_count;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.decrement_ama_vote_count(question_id uuid)
 RETURNS integer
 LANGUAGE sql
AS $function$
  UPDATE "AmaQuestions"
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = question_id
  RETURNING vote_count;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_ama_vote_count(question_id uuid)
 RETURNS integer
 LANGUAGE sql
AS $function$
  UPDATE "AmaQuestions"
  SET vote_count = vote_count + 1
  WHERE id = question_id
  RETURNING vote_count;
$function$
;

grant delete on table "public"."ResumeReviewVotes" to "anon";

grant insert on table "public"."ResumeReviewVotes" to "anon";

grant references on table "public"."ResumeReviewVotes" to "anon";

grant select on table "public"."ResumeReviewVotes" to "anon";

grant trigger on table "public"."ResumeReviewVotes" to "anon";

grant truncate on table "public"."ResumeReviewVotes" to "anon";

grant update on table "public"."ResumeReviewVotes" to "anon";

grant delete on table "public"."ResumeReviewVotes" to "authenticated";

grant insert on table "public"."ResumeReviewVotes" to "authenticated";

grant references on table "public"."ResumeReviewVotes" to "authenticated";

grant select on table "public"."ResumeReviewVotes" to "authenticated";

grant trigger on table "public"."ResumeReviewVotes" to "authenticated";

grant truncate on table "public"."ResumeReviewVotes" to "authenticated";

grant update on table "public"."ResumeReviewVotes" to "authenticated";

grant delete on table "public"."ResumeReviewVotes" to "service_role";

grant insert on table "public"."ResumeReviewVotes" to "service_role";

grant references on table "public"."ResumeReviewVotes" to "service_role";

grant select on table "public"."ResumeReviewVotes" to "service_role";

grant trigger on table "public"."ResumeReviewVotes" to "service_role";

grant truncate on table "public"."ResumeReviewVotes" to "service_role";

grant update on table "public"."ResumeReviewVotes" to "service_role";

grant delete on table "public"."ResumeReviews" to "anon";

grant insert on table "public"."ResumeReviews" to "anon";

grant references on table "public"."ResumeReviews" to "anon";

grant select on table "public"."ResumeReviews" to "anon";

grant trigger on table "public"."ResumeReviews" to "anon";

grant truncate on table "public"."ResumeReviews" to "anon";

grant update on table "public"."ResumeReviews" to "anon";

grant delete on table "public"."ResumeReviews" to "authenticated";

grant insert on table "public"."ResumeReviews" to "authenticated";

grant references on table "public"."ResumeReviews" to "authenticated";

grant select on table "public"."ResumeReviews" to "authenticated";

grant trigger on table "public"."ResumeReviews" to "authenticated";

grant truncate on table "public"."ResumeReviews" to "authenticated";

grant update on table "public"."ResumeReviews" to "authenticated";

grant delete on table "public"."ResumeReviews" to "service_role";

grant insert on table "public"."ResumeReviews" to "service_role";

grant references on table "public"."ResumeReviews" to "service_role";

grant select on table "public"."ResumeReviews" to "service_role";

grant trigger on table "public"."ResumeReviews" to "service_role";

grant truncate on table "public"."ResumeReviews" to "service_role";

grant update on table "public"."ResumeReviews" to "service_role";

grant delete on table "public"."SessionFrictionTriageAudit" to "anon";

grant insert on table "public"."SessionFrictionTriageAudit" to "anon";

grant references on table "public"."SessionFrictionTriageAudit" to "anon";

grant select on table "public"."SessionFrictionTriageAudit" to "anon";

grant trigger on table "public"."SessionFrictionTriageAudit" to "anon";

grant truncate on table "public"."SessionFrictionTriageAudit" to "anon";

grant update on table "public"."SessionFrictionTriageAudit" to "anon";

grant delete on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant insert on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant references on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant select on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant trigger on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant truncate on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant update on table "public"."SessionFrictionTriageAudit" to "authenticated";

grant delete on table "public"."SessionFrictionTriageAudit" to "service_role";

grant insert on table "public"."SessionFrictionTriageAudit" to "service_role";

grant references on table "public"."SessionFrictionTriageAudit" to "service_role";

grant select on table "public"."SessionFrictionTriageAudit" to "service_role";

grant trigger on table "public"."SessionFrictionTriageAudit" to "service_role";

grant truncate on table "public"."SessionFrictionTriageAudit" to "service_role";

grant update on table "public"."SessionFrictionTriageAudit" to "service_role";


  create policy "AmaQuestions: authenticated can insert"
  on "public"."AmaQuestions"
  as permissive
  for insert
  to public
with check (true);



  create policy "AmaQuestions: authenticated can read"
  on "public"."AmaQuestions"
  as permissive
  for select
  to public
using (true);



  create policy "AmaVotes: authenticated can insert"
  on "public"."AmaVotes"
  as permissive
  for insert
  to public
with check (true);



  create policy "AmaVotes: authenticated can read"
  on "public"."AmaVotes"
  as permissive
  for select
  to public
using (true);



  create policy "AmaVotes: user can delete own vote"
  on "public"."AmaVotes"
  as permissive
  for delete
  to public
using ((user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text)));



  create policy "articles_select"
  on "public"."LearningArticles"
  as permissive
  for select
  to public
using ((is_published AND ((is_premium = false) OR (auth.role() = 'authenticated'::text) OR (auth.role() = 'service_role'::text))));



  create policy "articles_write"
  on "public"."LearningArticles"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "pillars_select"
  on "public"."LearningPillars"
  as permissive
  for select
  to public
using (true);



  create policy "pillars_write"
  on "public"."LearningPillars"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "topics_select"
  on "public"."LearningTopics"
  as permissive
  for select
  to public
using (true);



  create policy "topics_write"
  on "public"."LearningTopics"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "Service role can read all telemetry"
  on "public"."TelemetryEvents"
  as permissive
  for select
  to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));



  create policy "Users can insert their own telemetry"
  on "public"."TelemetryEvents"
  as permissive
  for insert
  to public
with check (((auth.uid())::text = email));



  create policy "Anyone can view their own article progress"
  on "public"."UserArticleProgress"
  as permissive
  for all
  to public
using (true);



  create policy "Anyone can view their own bookmarks"
  on "public"."UserBookmarks"
  as permissive
  for all
  to public
using (true);



  create policy "Anyone can view their own stats"
  on "public"."UserConceptStats"
  as permissive
  for all
  to public
using (true);



  create policy "allow_feedback_insert"
  on "public"."UserFeedback"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Anyone can view their own internalizations"
  on "public"."UserInternalizations"
  as permissive
  for all
  to public
using (true);


CREATE TRIGGER set_articles_updated_at BEFORE UPDATE ON public."LearningArticles" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER new_feedback AFTER INSERT ON public."UserFeedback" FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://dwhegbuedhkbppekzmjd.supabase.co/functions/v1/notify-discord', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER new_users AFTER INSERT ON public."Users" FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://dwhegbuedhkbppekzmjd.supabase.co/functions/v1/notify-discord', 'POST', '{"Content-type":"application/json"}', '{}', '5000');


