'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) {
          setActiveId(visible[0]?.target.id || null);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0.1 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="sticky top-28 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">In this article</p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={cn(item.level === 3 && 'ml-4')}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block rounded-md border-l-2 border-l-transparent px-3 py-1.5 text-text-muted transition-all duration-200 hover:border-l-border-interactive hover:bg-surface-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/70',
                activeId === item.id && 'border-l-brand-green bg-surface-interactive text-text-primary'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
