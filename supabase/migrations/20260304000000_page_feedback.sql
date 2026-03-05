create table if not exists public.page_feedback (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  helpful boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_page_feedback_page_slug_created_at
  on public.page_feedback (page_slug, created_at desc);
