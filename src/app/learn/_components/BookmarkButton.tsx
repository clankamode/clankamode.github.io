'use client';

import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';

interface BookmarkButtonProps {
  articleId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function BookmarkButton({
  articleId,
  initialBookmarked,
  size = 'md',
  className = '',
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(!!initialBookmarked);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (initialBookmarked !== undefined) {
      return;
    }

    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/bookmarks?articleId=${encodeURIComponent(articleId)}`);
        if (response.status === 401) {
          setIsVisible(false);
          return;
        }
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setIsBookmarked(!!data.bookmarked);
      } catch { }
    };

    loadStatus();
  }, [articleId, initialBookmarked]);

  if (!isVisible) {
    return null;
  }

  const buttonSize = size === 'sm' ? 'h-[30px] w-[30px]' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-[17px] w-[17px]' : 'h-[20px] w-[20px]';

  const handleToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSaving) {
      return;
    }

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setIsSaving(true);

    try {
      const response = await fetch('/api/bookmarks', {
        method: nextState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsVisible(false);
        }
        setIsBookmarked(!nextState);
      }
    } catch {
      setIsBookmarked(!nextState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
      className={`${buttonSize} inline-flex items-center justify-center rounded-full border transition-all ${isBookmarked
        ? 'border-brand-green bg-brand-green/10 text-brand-green'
        : 'border-border-subtle bg-surface-interactive text-text-muted hover:border-border-interactive hover:text-text-primary'
        } ${isSaving ? 'opacity-70' : ''} ${className}`}
    >
      <svg
        className={iconSize}
        viewBox="0 0 20 20"
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M6 3.75A1.75 1.75 0 0 0 4.25 5.5v11.25l5.75-3.25 5.75 3.25V5.5A1.75 1.75 0 0 0 14 3.75H6Z" />
      </svg>
    </button>
  );
}
