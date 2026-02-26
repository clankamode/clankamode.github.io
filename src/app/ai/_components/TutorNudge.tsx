'use client';

import React from 'react';

interface TutorNudgeProps {
  onOpen: () => void;
  checklistItemTitle?: string;
}

export default function TutorNudge({ onOpen, checklistItemTitle }: TutorNudgeProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-16 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border-interactive bg-surface-2 px-3 py-2 font-mono text-[11px] text-text-muted shadow-sm transition-colors hover:text-text-primary"
      aria-label={checklistItemTitle ? `Need a hint on: ${checklistItemTitle}` : 'Need a hint on this step?'}
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-border-interactive animate-pulse" />
      <span>Need a hint on this step?</span>
    </button>
  );
}
