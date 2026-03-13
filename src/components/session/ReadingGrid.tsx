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
            <div className="sticky top-[5.75rem] pr-1">
              <div className="relative">
                <div
                  data-reading-spine="rail"
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 right-[-1rem] top-2 w-[1.5px] bg-border-interactive/75"
                />
                {rail}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <div className="min-w-0">{children}</div>
    </section>
  );
}
