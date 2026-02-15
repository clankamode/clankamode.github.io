'use client';

import { useMemo, useState } from 'react';
import type { LearningTopicWithArticles } from '@/types/content';
import ArticleCard from './ArticleCard';

interface TopicAccordionProps {
  pillarSlug: string;
  topic: LearningTopicWithArticles;
  defaultOpen?: boolean;
  showProgress?: boolean;
  bookmarkedIds?: string[] | null;
  isSignedIn?: boolean;
}

export default function TopicAccordion({
  pillarSlug,
  topic,
  defaultOpen = false,
  showProgress = false,
  bookmarkedIds = null,
  isSignedIn = false
}: TopicAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bookmarkedSet = useMemo(() => (
    bookmarkedIds ? new Set(bookmarkedIds) : null
  ), [bookmarkedIds]);

  return (
    <div className="border-b border-border-subtle py-6">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-text-primary">
            {topic.name}
          </h3>
          {topic.description && (
            <p className="mt-2 text-base text-text-secondary">
              {topic.description}
            </p>
          )}
        </div>
        <span className="text-text-muted text-xl">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {topic.articles.map((article) => (
            <ArticleCard
              key={article.id}
              pillarSlug={pillarSlug}
              article={article}
              showProgress={showProgress}
              initialBookmarked={bookmarkedSet ? bookmarkedSet.has(article.id) : undefined}
              showSignInBadge={!isSignedIn}
            />
          ))}
          {topic.articles.length === 0 && (
            <div className="text-text-muted text-sm">
              No articles yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
