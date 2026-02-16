-- Extend live questions to support stable Google identity in addition to email.

alter table public."LiveQuestions"
add column if not exists google_id text;

alter table public."LiveQuestionVotes"
add column if not exists google_id text;

create index if not exists idx_live_questions_google_id
on public."LiveQuestions"(google_id);

create index if not exists idx_live_question_votes_google_id
on public."LiveQuestionVotes"(google_id);

update public."LiveQuestions" q
set google_id = u.google_id
from public."Users" u
where q.google_id is null
  and u.google_id is not null
  and q.user_email = u.email;

update public."LiveQuestionVotes" v
set google_id = u.google_id
from public."Users" u
where v.google_id is null
  and u.google_id is not null
  and v.user_email = u.email;
