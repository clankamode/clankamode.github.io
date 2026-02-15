'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const READING_GRID_MEASURE_CH = 66;
export const READING_GRID_VERTICAL_CADENCE_PX = 14;
export const READING_GRID_DIVIDER_STRENGTH_CLASS = 'border-border-interactive/72';
export const READING_GRID_AUTHORITY_LEVELS = {
  strong: 'text-text-primary',
  medium: 'text-text-primary/88',
  muted: 'text-text-secondary',
} as const;

interface ReadingGridProps {
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}

const readingGridStyle = {
  '--reading-measure': `${READING_GRID_MEASURE_CH}ch`,
  '--reading-cadence': `${READING_GRID_VERTICAL_CADENCE_PX}px`,
  '--reading-spine-offset': '2.5rem',
} as CSSProperties;

export default function ReadingGrid({ children, rail, className }: ReadingGridProps) {
  return (
    <section
      data-reading-grid="execution"
      style={readingGridStyle}
      className={cn(
        'relative min-w-0 [&_[data-reading-boundary]]:relative [&_[data-reading-boundary]]:border-border-interactive/82 [&_[data-reading-boundary]]:pt-[var(--reading-cadence)]',
        className
      )}
    >
      {rail ? (
        <>
          <aside
            className="absolute left-0 top-0 hidden w-28 -translate-x-28 lg:block"
            aria-label="Execution rail"
          >
            <div className="sticky top-[5.75rem] pr-1">{rail}</div>
          </aside>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-0 top-4 hidden translate-x-[calc(var(--reading-spine-offset)*-1)] lg:block"
          >
            <div className="h-full w-[1.5px] bg-border-interactive/75" />
          </div>
        </>
      ) : null}

      <div className="min-w-0">{children}</div>
    </section>
  );
}
