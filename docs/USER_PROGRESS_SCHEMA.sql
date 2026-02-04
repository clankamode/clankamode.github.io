create table if not exists public."UserArticleProgress" (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  article_id uuid not null references public."LearningArticles"(id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table if not exists public."UserBookmarks" (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  article_id uuid not null references public."LearningArticles"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists user_article_progress_user_id_idx
  on public."UserArticleProgress"(user_id);

create index if not exists user_bookmarks_user_id_idx
  on public."UserBookmarks"(user_id);
