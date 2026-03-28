create or replace function public.reconcile_google_identity_tables(
  p_google_id text,
  p_emails text[],
  p_article_progress_rows jsonb,
  p_user_badge_rows jsonb,
  p_user_question_submission_rows jsonb,
  p_user_concept_stat_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public."UserArticleProgress"
  where google_id = p_google_id
     or email = any(coalesce(p_emails, array[]::text[]));

  delete from public."UserBadges"
  where google_id = p_google_id
     or email = any(coalesce(p_emails, array[]::text[]));

  delete from public."UserQuestionSubmissions"
  where google_id = p_google_id
     or email = any(coalesce(p_emails, array[]::text[]));

  delete from public."UserConceptStats"
  where google_id = p_google_id
     or email = any(coalesce(p_emails, array[]::text[]));

  if jsonb_typeof(coalesce(p_article_progress_rows, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_article_progress_rows, '[]'::jsonb)) > 0 then
    insert into public."UserArticleProgress" (
      article_id,
      completed_at,
      created_at,
      email,
      google_id
    )
    select
      row_data.article_id,
      row_data.completed_at,
      row_data.created_at,
      row_data.email,
      row_data.google_id
    from jsonb_to_recordset(p_article_progress_rows) as row_data(
      article_id uuid,
      completed_at timestamptz,
      created_at timestamptz,
      email text,
      google_id text
    );
  end if;

  if jsonb_typeof(coalesce(p_user_badge_rows, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_user_badge_rows, '[]'::jsonb)) > 0 then
    insert into public."UserBadges" (
      badge_slug,
      earned_at,
      email,
      google_id
    )
    select
      row_data.badge_slug,
      row_data.earned_at,
      row_data.email,
      row_data.google_id
    from jsonb_to_recordset(p_user_badge_rows) as row_data(
      badge_slug text,
      earned_at timestamptz,
      email text,
      google_id text
    );
  end if;

  if jsonb_typeof(coalesce(p_user_question_submission_rows, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_user_question_submission_rows, '[]'::jsonb)) > 0 then
    insert into public."UserQuestionSubmissions" (
      id,
      question_id,
      solved,
      source_code,
      created_at,
      updated_at,
      email,
      google_id
    )
    select
      row_data.id,
      row_data.question_id,
      row_data.solved,
      row_data.source_code,
      row_data.created_at,
      row_data.updated_at,
      row_data.email,
      row_data.google_id
    from jsonb_to_recordset(p_user_question_submission_rows) as row_data(
      id uuid,
      question_id uuid,
      solved boolean,
      source_code text,
      created_at timestamptz,
      updated_at timestamptz,
      email text,
      google_id text
    );
  end if;

  if jsonb_typeof(coalesce(p_user_concept_stat_rows, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_user_concept_stat_rows, '[]'::jsonb)) > 0 then
    insert into public."UserConceptStats" (
      concept_slug,
      track_slug,
      exposures,
      internalized_count,
      last_seen_at,
      email,
      google_id
    )
    select
      row_data.concept_slug,
      row_data.track_slug,
      row_data.exposures,
      row_data.internalized_count,
      row_data.last_seen_at,
      row_data.email,
      row_data.google_id
    from jsonb_to_recordset(p_user_concept_stat_rows) as row_data(
      concept_slug text,
      track_slug text,
      exposures integer,
      internalized_count integer,
      last_seen_at timestamptz,
      email text,
      google_id text
    );
  end if;
end;
$$;
