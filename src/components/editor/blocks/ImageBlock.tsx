'use client';

import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageBlock as ImageBlockType } from '../types';

interface ImageBlockProps {
  block: ImageBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<ImageBlockType>) => void;
  onAnnotate?: () => void;
  onUploadClick?: () => void;
  onDrop?: (files: FileList) => void;
}

const sizeClasses: Record<NonNullable<ImageBlockType['size']>, string> = {
  full: 'w-full',
  medium: 'w-full max-w-3xl',
  small: 'w-full max-w-xl',
  inline: 'w-full max-w-md',
};

function ImageBlockComponent({ block, editable = false, onChange, onAnnotate, onUploadClick, onDrop }: ImageBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerClass = sizeClasses[block.size ?? 'full'];

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  const hasImage = !!block.src;

  return (
    <figure className={`space-y-3 ${containerClass}`}>
      <div className="frame relative min-h-[200px] overflow-hidden rounded-xl bg-surface-interactive">
        {hasImage && !imageError ? (
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={600}
            className="h-auto max-h-[600px] w-full cursor-zoom-in object-contain"
            onClick={() => setLightboxOpen(true)}
            onError={() => {
              console.error('Image failed to load:', block.src);
              setImageError(true);
            }}
              onLoad={() => setImageError(false)}
            />
        ) : hasImage && imageError ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-text-muted">
            Failed to load image
          </div>
        ) : (
          <div
            className={`flex min-h-[200px] flex-col items-center justify-center border-2 border-dashed border-border-subtle p-8 text-center transition ${
              editable
                ? 'cursor-pointer hover:border-border-interactive hover:bg-surface-dense/50'
                : ''
            }`}
            onClick={editable && onUploadClick ? onUploadClick : undefined}
            onDragOver={
              editable && onDrop
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                : undefined
            }
            onDrop={
              editable && onDrop
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files.length) {
                      onDrop(e.dataTransfer.files);
                    }
                  }
                : undefined
            }
          >
            {editable ? (
              <>
                <p className="mb-2 text-sm text-text-muted">Drop image here or click to upload</p>
                <p className="text-xs text-text-muted">Supports JPG, PNG, GIF, WebP</p>
              </>
            ) : (
              <p className="text-sm text-text-muted">No image</p>
            )}
          </div>
        )}
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
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-text-muted">Caption</label>
              <input
                type="text"
                value={block.caption || ''}
                placeholder="Add a caption for this image"
                className="w-full rounded-lg border border-border-subtle bg-surface-dense px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  const trimmed = event.target.value.trim();
                  onChange?.({ caption: trimmed || undefined });
                }}
              />
            </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="absolute right-6 top-6 z-10 text-sm text-white/70 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            Close
          </button>
          <Image
            src={block.src}
            alt={block.alt}
            width={1920}
            height={1080}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </figure>
  );
}

export const ImageBlock = memo(ImageBlockComponent);
