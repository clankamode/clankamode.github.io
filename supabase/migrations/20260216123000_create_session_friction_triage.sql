create table if not exists "public"."SessionFrictionTriage" (
  "id" uuid primary key default gen_random_uuid(),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "track_slug" text not null,
  "step_index" int not null,
  "status" text not null default 'new',
  "owner" text,
  "notes" text,
  "updated_by_email" text not null,
  constraint "session_friction_triage_status_check" check ("status" in ('new', 'investigating', 'resolved'))
);

create unique index if not exists "uniq_session_friction_triage_track_step"
  on "public"."SessionFrictionTriage" ("track_slug", "step_index");

create index if not exists "idx_session_friction_triage_status_updated_at"
  on "public"."SessionFrictionTriage" ("status", "updated_at" desc);

create or replace function "public"."set_session_friction_triage_updated_at"()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists "session_friction_triage_set_updated_at" on "public"."SessionFrictionTriage";
create trigger "session_friction_triage_set_updated_at"
before update on "public"."SessionFrictionTriage"
for each row execute procedure "public"."set_session_friction_triage_updated_at"();
