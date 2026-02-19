'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LearningTopicWithArticles } from '@/types/content';

interface PillarSidebarProps {
  pillarSlug: string;
  pillarName: string;
  topics: LearningTopicWithArticles[];
  currentArticleSlug?: string;
}

type TopicState = Record<string, boolean>;

export default function PillarSidebar({
  pillarSlug,
  pillarName,
  topics,
  currentArticleSlug,
}: PillarSidebarProps) {
  const initialState = useMemo<TopicState>(() => {
    const nextState: TopicState = {};
    topics.forEach((topic) => {
      const hasCurrent = topic.articles.some((article) => article.slug === currentArticleSlug);
      nextState[topic.id] = hasCurrent;
    });
    return nextState;
  }, [topics, currentArticleSlug]);

  const [openTopics, setOpenTopics] = useState<TopicState>(initialState);

  useEffect(() => {
    setOpenTopics(initialState);
  }, [initialState]);

  return (
    <aside className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Pillar</p>
        <Link
          href={`/learn/${pillarSlug}`}
          className="mt-2 inline-flex text-lg font-semibold tracking-tight text-text-primary hover:text-text-secondary"
        >
          {pillarName}
        </Link>
      </div>

      <div className="space-y-4">
        {topics.map((topic) => {
          const isOpen = openTopics[topic.id];
          return (
            <div key={topic.id} className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-text-secondary hover:text-text-primary"
                onClick={() =>
                  setOpenTopics((prev) => ({ ...prev, [topic.id]: !prev[topic.id] }))
                }
              >
                <span>{topic.name}</span>
                <span className="text-text-muted">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <ul className="space-y-2 pl-2">
                  {topic.articles.map((article) => {
                    const isActive = article.slug === currentArticleSlug;
                    return (
                      <li key={article.id}>
                        <Link
                          href={`/learn/${pillarSlug}/${article.slug}`}
                          className={cn(
                            'block border-l-2 pl-3 text-sm transition-colors',
                            isActive
                              ? 'border-brand-green text-text-primary'
                              : 'border-transparent text-text-muted hover:text-text-primary'
                          )}
                        >
                          {article.title}
                        </Link>
                      </li>
                    );
                  })}
                  {topic.articles.length === 0 && (
                    <li className="pl-3 text-xs text-text-muted">No articles yet.</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
