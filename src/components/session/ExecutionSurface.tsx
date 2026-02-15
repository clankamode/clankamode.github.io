'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import ReadingGrid from './ReadingGrid';

export const EXECUTION_SURFACE_MAX_WIDTH_PX = 744;
export const EXECUTION_SURFACE_MAX_WIDTH_CLASS = 'max-w-[744px]';
export const EXECUTION_SURFACE_LAYOUT_CLASS = 'mx-auto w-full max-w-[744px] px-5 sm:px-6 lg:-translate-x-10';

const EXECUTION_SURFACE_TYPOGRAPHY_CLASS =
  'text-base leading-8 tracking-[0.002em] text-text-primary sm:text-[17px]';

const EXECUTION_SURFACE_RHYTHM_CLASS =
  '[&_.article-spec-header]:mb-5 [&_.article-spec-header]:pb-2 [&_.article-spec-kicker]:tracking-[0.08em] [&_.article-spec-title]:mt-1 [&_.article-spec-title]:text-[2.65rem] [&_.article-spec-title]:leading-[0.98] [&_.article-spec-title]:tracking-[-0.03em] sm:[&_.article-spec-title]:text-[3.1rem] [&_.article-spec-subtitle]:mt-1 [&_.article-spec-subtitle]:text-[16px] [&_.article-spec-subtitle]:leading-7 [&_.article-spec-meta]:mt-2 [&_.article-spec-meta]:gap-x-2 [&_.article-spec-meta]:gap-y-1 [&_.article-spec-meta]:text-[12px] [&_.article-spec-meta]:tracking-[0.02em]';

interface ExecutionSurfaceProps {
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}

export default function ExecutionSurface({ children, rail, className }: ExecutionSurfaceProps) {
  return (
    <div
      data-execution-surface="true"
      className={cn(
        EXECUTION_SURFACE_LAYOUT_CLASS,
        EXECUTION_SURFACE_TYPOGRAPHY_CLASS,
        EXECUTION_SURFACE_RHYTHM_CLASS,
        className
      )}
    >
      <ReadingGrid rail={rail}>
        {children}
      </ReadingGrid>
    </div>
  );
}
