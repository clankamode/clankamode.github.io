alter table if exists "public"."SessionAIDecisions"
  add column if not exists "session_id" text,
  add column if not exists "decision_scope" text,
  add column if not exists "decision_target" text,
  add column if not exists "fallback_used" boolean not null default false,
  add column if not exists "latency_ms" integer,
  add column if not exists "error_code" text;

alter table if exists "public"."SessionAIDecisions"
  alter column "step_index" drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_ai_decisions_decision_scope_check'
  ) then
    alter table "public"."SessionAIDecisions"
      add constraint "session_ai_decisions_decision_scope_check"
      check ("decision_scope" in ('planner', 'scope', 'onboarding', 'triage'));
  end if;
end
$$;

create index if not exists "idx_session_ai_decisions_created_at_desc"
  on "public"."SessionAIDecisions" ("created_at" desc);

create index if not exists "idx_session_ai_decisions_type_created_desc"
  on "public"."SessionAIDecisions" ("decision_type", "created_at" desc);

create index if not exists "idx_session_ai_decisions_session_created_desc"
  on "public"."SessionAIDecisions" ("session_id", "created_at" desc);

create index if not exists "idx_session_ai_decisions_scope_created_desc"
  on "public"."SessionAIDecisions" ("decision_scope", "created_at" desc);
