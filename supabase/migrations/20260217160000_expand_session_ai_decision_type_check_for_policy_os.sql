alter table if exists "public"."SessionAIDecisions"
  drop constraint if exists "session_ai_decisions_type_check";

alter table if exists "public"."SessionAIDecisions"
  add constraint "session_ai_decisions_type_check"
  check (
    "decision_type" in (
      'triage_brief',
      'triage_recommendation',
      'session_plan',
      'scope_policy',
      'onboarding_path'
    )
  );
