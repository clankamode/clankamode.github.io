import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LearningPillar } from '@/types/content';
import type { ReactElement } from 'react';

interface PillarCardProps {
  pillar: LearningPillar;
  articleCount: number;
}

const iconMap: Record<string, ReactElement> = {
  resume: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M9 11h6M9 15h6M9 7h3" />
    </svg>
  ),
  dsa: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 8L3 12l4 4M17 8l4 4-4 4M14 4l-4 16" />
    </svg>
  ),
  'system-design': (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="8" y="13" width="8" height="8" />
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 20h4l10-10-4-4L5 16v4z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
};

export default function PillarCard({ pillar, articleCount }: PillarCardProps) {
  const icon = iconMap[pillar.slug] || iconMap.blog;
  const isEmpty = articleCount === 0;

  const content = (
    <>
      <div className="flex items-center justify-between text-text-secondary">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
          <span className="text-text-muted">Pillar</span>
          <span className="text-text-primary font-semibold">{pillar.name}</span>
        </div>
        <div className="text-text-muted">{icon}</div>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
          {pillar.name}
        </h2>
        <p className="mt-3 text-base text-text-secondary leading-relaxed">
          {pillar.description || 'A curated path built for deliberate growth.'}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between text-sm text-text-muted">
        <span>{articleCount} articles</span>
        <span
          className={cn(
            'text-text-primary',
            !isEmpty && 'transition-transform duration-200 group-hover:translate-x-1'
          )}
        >
          {isEmpty ? 'Under construction' : 'Explore →'}
        </span>
      </div>
    </>
  );

  if (isEmpty) {
    return (
      <div
        className={cn(
          'frame relative flex h-full cursor-default flex-col gap-6 p-6',
          'bg-surface-interactive/60'
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/learn/${pillar.slug}`}
      className={cn(
        'group frame relative flex h-full flex-col gap-6 p-6 transition-all duration-300',
        'bg-surface-interactive/80 hover:bg-surface-interactive/90'
      )}
    >
      {content}
    </Link>
  );
}
