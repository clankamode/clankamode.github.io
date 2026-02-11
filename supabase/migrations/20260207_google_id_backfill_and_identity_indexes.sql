-- Ensure google_id rollout remains safe for legacy email-based rows.
-- This migration is idempotent and can run in environments where columns already exist.

alter table public."TelemetryEvents" add column if not exists google_id text;
alter table public."UserInternalizations" add column if not exists google_id text;
alter table public."UserArticleProgress" add column if not exists google_id text;
alter table public."UserBookmarks" add column if not exists google_id text;
alter table public."UserConceptStats" add column if not exists google_id text;
alter table public."TestSession" add column if not exists google_id text;
alter table public."TestAnswer" add column if not exists google_id text;
alter table public."ChatConversations" add column if not exists google_id text;

create index if not exists idx_telemetry_google_id on public."TelemetryEvents"(google_id);
create index if not exists idx_internalizations_google_id on public."UserInternalizations"(google_id);
create index if not exists idx_progress_google_id on public."UserArticleProgress"(google_id);
create index if not exists idx_bookmarks_google_id on public."UserBookmarks"(google_id);
create index if not exists idx_stats_google_id on public."UserConceptStats"(google_id);
create index if not exists idx_test_session_google_id on public."TestSession"(google_id);
create index if not exists idx_test_answer_google_id on public."TestAnswer"(google_id);
create index if not exists idx_chat_google_id on public."ChatConversations"(google_id);

-- For dual-key reads, enforce uniqueness on google_id where present.
create unique index if not exists user_concept_stats_google_track_concept_uidx
on public."UserConceptStats"(google_id, track_slug, concept_slug)
where google_id is not null;

-- Backfill all legacy rows using Users.email -> Users.google_id mapping.
update public."TelemetryEvents" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."UserInternalizations" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."UserArticleProgress" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."UserBookmarks" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."UserConceptStats" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."TestSession" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."TestAnswer" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;

update public."ChatConversations" t
set google_id = u.google_id
from public."Users" u
where t.google_id is null and u.google_id is not null and t.email = u.email;
