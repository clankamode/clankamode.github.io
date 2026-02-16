create table if not exists "public"."SessionFrictionSnapshots" (
  "id" uuid primary key default gen_random_uuid(),
  "created_at" timestamptz not null default now(),
  "email" text not null,
  "google_id" text,
  "session_id" text not null,
  "track_slug" text not null,
  "step_index" int not null,
  "phase" text not null,
  "friction_state" text not null,
  "confidence" numeric not null,
  "signals" jsonb not null,
  "trigger" text not null,
  "dedupe_key" text,
  constraint "session_friction_snapshots_phase_check" check ("phase" = 'execution'),
  constraint "session_friction_snapshots_state_check" check ("friction_state" in ('flow', 'stuck', 'drift', 'fatigue', 'coast')),
  constraint "session_friction_snapshots_trigger_check" check ("trigger" in ('state_change', 'step_exit')),
  constraint "session_friction_snapshots_confidence_check" check ("confidence" >= 0 and "confidence" <= 1)
);

create index if not exists "idx_session_friction_snapshots_email_created_at"
  on "public"."SessionFrictionSnapshots" ("email", "created_at" desc);

create index if not exists "idx_session_friction_snapshots_session_step_created_at"
  on "public"."SessionFrictionSnapshots" ("session_id", "step_index", "created_at" desc);

create index if not exists "idx_session_friction_snapshots_track_slug_created_at"
  on "public"."SessionFrictionSnapshots" ("track_slug", "created_at" desc);

create unique index if not exists "uniq_session_friction_snapshots_dedupe_key"
  on "public"."SessionFrictionSnapshots" ("dedupe_key")
  where "dedupe_key" is not null;
