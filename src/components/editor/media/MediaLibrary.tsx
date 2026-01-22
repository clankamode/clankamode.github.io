'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EditorBlock } from '../types';

interface MediaLibraryProps {
  isOpen: boolean;
  blocks: EditorBlock[];
  onClose: () => void;
  onInsert: (url: string) => void;
}

interface MediaItem {
  url: string;
  name?: string;
}

const RECENT_MEDIA_KEY = 'learning-media-recent';

export function MediaLibrary({ isOpen, blocks, onClose, onInsert }: MediaLibraryProps) {
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState('');

  const articleImages = useMemo(
    () =>
      blocks
        .filter((block) => block.type === 'image')
        .map((block) => ({
          url: block.src,
          name: block.caption ?? block.alt ?? 'Image',
        })),
    [blocks]
  );

  useEffect(() => {
    const loadRecent = () => {
      try {
        const items = JSON.parse(localStorage.getItem(RECENT_MEDIA_KEY) || '[]') as MediaItem[];
        setRecent(items);
      } catch {
        setRecent([]);
      }
    };
    if (isOpen) {
      loadRecent();
    }
    const handler = () => loadRecent();
    window.addEventListener('media:recent-updated', handler);
    return () => window.removeEventListener('media:recent-updated', handler);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const filterItems = (items: MediaItem[]) => {
    if (!query.trim()) {
      return items;
    }
    const needle = query.toLowerCase();
    return items.filter((item) => (item.name ?? '').toLowerCase().includes(needle));
  };

  const renderGrid = (items: MediaItem[]) => {
    const filtered = filterItems(items);
    if (!filtered.length) {
      return <p className="text-sm text-text-muted">No matches found.</p>;
    }
    return (
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((item) => (
        <button
          key={item.url}
          type="button"
          className="group frame overflow-hidden rounded-lg border border-border-subtle bg-surface-interactive"
          onClick={() => onInsert(item.url)}
        >
          <img src={item.url} alt={item.name ?? 'Media'} className="h-20 w-full object-cover" />
          <div className="px-2 py-1 text-left text-xs text-text-secondary group-hover:text-text-primary">
            {item.name ?? 'Media'}
          </div>
        </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
      <div className="h-full w-full max-w-md border-l border-border-subtle bg-surface-dense p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Media Library</p>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-5">
          <input
            type="text"
            placeholder="Search media..."
            value={query}
            className="w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="mt-6 space-y-8">
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Recent</p>
            {recent.length ? renderGrid(recent) : <p className="text-sm text-text-muted">No recent uploads.</p>}
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">This Article</p>
            {articleImages.length ? (
              renderGrid(articleImages)
            ) : (
              <p className="text-sm text-text-muted">No images in this article yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
