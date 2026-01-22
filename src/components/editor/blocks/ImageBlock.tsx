'use client';

import { useState } from 'react';
import type { ImageBlock as ImageBlockType } from '../types';

interface ImageBlockProps {
  block: ImageBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<ImageBlockType>) => void;
  onAnnotate?: () => void;
}

const sizeClasses: Record<NonNullable<ImageBlockType['size']>, string> = {
  full: 'w-full',
  medium: 'w-full max-w-3xl',
  small: 'w-full max-w-xl',
  inline: 'w-full max-w-md',
};

export function ImageBlock({ block, editable = false, onChange, onAnnotate }: ImageBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const containerClass = sizeClasses[block.size ?? 'full'];

  return (
    <figure className={`space-y-3 ${containerClass}`}>
      <div className="frame relative overflow-hidden rounded-xl bg-surface-interactive">
        <img
          src={block.src}
          alt={block.alt}
          className="h-auto w-full cursor-zoom-in object-contain"
          onClick={() => setLightboxOpen(true)}
        />
        {block.annotations?.map((annotation, index) => (
          <div
            key={annotation.id}
            className="absolute flex items-center gap-2"
            style={{
              left: `${annotation.x * 100}%`,
              top: `${annotation.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-surface-dense text-[11px] text-text-primary">
              {index + 1}
            </div>
            {annotation.style === 'arrow' && (
              <span className="rounded bg-surface-dense/80 px-2 py-1 text-xs text-text-primary">
                {annotation.text}
              </span>
            )}
          </div>
        ))}
        {editable && (
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              className="rounded-full border border-border-subtle bg-surface-dense/80 px-3 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary"
              onClick={onAnnotate}
            >
              Annotate
            </button>
          </div>
        )}
      </div>

      {(block.caption || editable) && (
        <div className="space-y-2 text-sm text-text-secondary">
          {editable ? (
            <input
              type="text"
              value={block.caption ?? ''}
              placeholder="Caption"
              className="w-full rounded-lg border border-border-subtle bg-surface-dense px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ caption: event.target.value })}
            />
          ) : (
            block.caption && <figcaption className="text-sm text-text-secondary">{block.caption}</figcaption>
          )}
          {editable && (
            <input
              type="text"
              value={block.alt}
              placeholder="Alt text (auto-generated)"
              className="w-full rounded-lg border border-border-subtle bg-surface-dense px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ alt: event.target.value })}
            />
          )}
          {editable && (
            <input
              type="text"
              value={block.why ?? ''}
              placeholder="Why this matters (optional)"
              className="w-full rounded-lg border border-border-subtle bg-surface-dense px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ why: event.target.value })}
            />
          )}
        </div>
      )}

      {block.why && !editable && (
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{block.why}</p>
      )}

      {!editable && block.annotations?.length ? (
        <div className="space-y-1 text-sm text-text-secondary">
          {block.annotations.map((annotation, index) => (
            <p key={annotation.id} className="flex items-center gap-2">
              <span className="text-xs text-text-muted">{index + 1}.</span>
              <span>{annotation.text}</span>
            </p>
          ))}
        </div>
      ) : null}

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <button
            type="button"
            className="absolute right-6 top-6 text-sm text-white/70 hover:text-white"
            onClick={() => setLightboxOpen(false)}
          >
            Close
          </button>
          <img src={block.src} alt={block.alt} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </figure>
  );
}
