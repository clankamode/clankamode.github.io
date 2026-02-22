-- AMA (Ask Me Anything) questions and votes.
-- Used by /ama page and admin AMA management.

create table if not exists public."AmaQuestions" (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     text not null,
  author_name text,
  question    text not null check (char_length(question) >= 5 and char_length(question) <= 500),
  status      text not null default 'unanswered' check (status in ('unanswered', 'answered')),
  answer      text,
  answered_at timestamptz,
  vote_count  integer not null default 0 check (vote_count >= 0)
);

create table if not exists public."AmaVotes" (
  question_id uuid not null references public."AmaQuestions"(id) on delete cascade,
  user_id     text not null,
  primary key (question_id, user_id)
);

create index if not exists idx_ama_questions_vote_count on public."AmaQuestions"(vote_count desc, created_at asc);
create index if not exists idx_ama_votes_user_id on public."AmaVotes"(user_id);

-- RPC: increment vote_count for a question (used after inserting a vote).
create or replace function public.increment_ama_vote_count(question_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public."AmaQuestions"
  set vote_count = vote_count + 1
  where id = question_id
  returning vote_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

-- RPC: decrement vote_count for a question (used after deleting a vote), floored at 0.
create or replace function public.decrement_ama_vote_count(question_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public."AmaQuestions"
  set vote_count = greatest(0, vote_count - 1)
  where id = question_id
  returning vote_count into new_count;
  return coalesce(new_count, 0);
end;
$$;
