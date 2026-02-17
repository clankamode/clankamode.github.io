create table if not exists "public"."UserOnboardingProfiles" (
  "id" uuid primary key default gen_random_uuid(),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "email" text not null,
  "google_id" text,
  "goal" text not null,
  "first_launch_path" text not null,
  "first_launch_track_slug" text,
  "first_completed_at" timestamptz,
  "launch_count" int not null default 1,
  constraint "user_onboarding_profiles_goal_check" check ("goal" in ('interview', 'work', 'fundamentals'))
);

create unique index if not exists "uniq_user_onboarding_profiles_email_when_google_null"
  on "public"."UserOnboardingProfiles" ("email")
  where "google_id" is null;

create unique index if not exists "uniq_user_onboarding_profiles_email_google_when_google_present"
  on "public"."UserOnboardingProfiles" ("email", "google_id")
  where "google_id" is not null;

create index if not exists "idx_user_onboarding_profiles_goal"
  on "public"."UserOnboardingProfiles" ("goal", "updated_at" desc);

create or replace function public.set_user_onboarding_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_onboarding_profiles_updated_at on "public"."UserOnboardingProfiles";
create trigger trg_user_onboarding_profiles_updated_at
before update on "public"."UserOnboardingProfiles"
for each row
execute function public.set_user_onboarding_profiles_updated_at();
