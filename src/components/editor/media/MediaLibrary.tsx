'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { EditorBlock } from '../types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ url: string; name: string; isRecent: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const removeFromRecent = (url: string) => {
    try {
      const items = JSON.parse(localStorage.getItem(RECENT_MEDIA_KEY) || '[]') as MediaItem[];
      const filtered = items.filter((item) => item.url !== url);
      localStorage.setItem(RECENT_MEDIA_KEY, JSON.stringify(filtered));
      setRecent(filtered);
      window.dispatchEvent(new Event('media:recent-updated'));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleDeleteRecent = (url: string) => {
    removeFromRecent(url);
    setDeleteConfirm(null);
  };

  const handleDeleteBlob = async (url: string) => {
    setDeleting(url);
    setError(null);
    try {
      const response = await fetch('/api/content/delete-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete media');
      }

      removeFromRecent(url);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: MediaItem, isRecent: boolean) => {
    e.stopPropagation();
    setDeleteConfirm({
      url: item.url,
      name: item.name ?? 'Media',
      isRecent,
    });
  };

  const renderGrid = (items: MediaItem[], isRecent: boolean) => {
    const filtered = filterItems(items);
    if (!filtered.length) {
      return <p className="text-sm text-text-muted">No matches found.</p>;
    }
    return (
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((item) => (
          <div
            key={item.url}
            className="group relative frame overflow-hidden rounded-lg border border-border-subtle bg-surface-interactive"
          >
            <button
              type="button"
              className="w-full"
              onClick={() => onInsert(item.url)}
            >
              <Image
                src={item.url}
                alt={item.name ?? 'Media'}
                width={200}
                height={80}
                className="h-20 w-full object-cover"
              />
              <div className="px-2 py-1 text-left text-xs text-text-secondary group-hover:text-text-primary">
                {item.name ?? 'Media'}
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteClick(e, item, isRecent)}
              disabled={deleting === item.url}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-surface-dense border border-border-subtle hover:bg-surface-interactive disabled:opacity-50"
              title="Delete"
            >
              {deleting === item.url ? (
                <svg className="w-3.5 h-3.5 animate-spin text-text-muted" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50">
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

        {error && (
          <div className="mt-4 rounded-lg border border-border-interactive bg-surface-interactive px-3 py-2 text-sm text-text-secondary">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-8">
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Recent</p>
            {recent.length ? renderGrid(recent, true) : <p className="text-sm text-text-muted">No recent uploads.</p>}
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">This Article</p>
            {articleImages.length ? (
              renderGrid(articleImages, false)
            ) : (
              <p className="text-sm text-text-muted">No images in this article yet.</p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.isRecent) {
              handleDeleteRecent(deleteConfirm.url);
            } else {
              handleDeleteBlob(deleteConfirm.url);
            }
          }
        }}
        title={deleteConfirm?.isRecent ? 'Remove from Recent' : 'Delete Media File'}
        message={
          deleteConfirm?.isRecent
            ? `Remove "${deleteConfirm.name}" from your recent media? This won't delete the file.`
            : `Permanently delete "${deleteConfirm?.name}"? This action cannot be undone.`
        }
        confirmLabel={deleteConfirm?.isRecent ? 'Remove' : 'Delete'}
        cancelLabel="Cancel"
        confirmVariant={deleteConfirm?.isRecent ? 'primary' : 'danger'}
      />
    </div>
  );
}
