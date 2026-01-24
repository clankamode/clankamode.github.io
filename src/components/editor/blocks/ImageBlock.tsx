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
  mode?: 'write' | 'inspect';
}

const sizeClasses: Record<NonNullable<ImageBlockType['size']>, string> = {
  full: 'w-full',
  medium: 'w-full max-w-3xl',
  small: 'w-full max-w-xl',
  inline: 'w-full max-w-md',
};

function ImageBlockComponent({ block, editable = false, onChange, onAnnotate, onUploadClick, onDrop, mode = 'write' }: ImageBlockProps) {
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
    <figure className={`group space-y-2 ${containerClass}`}>
      <div className={`relative overflow-hidden ${editable ? '' : 'frame rounded-xl bg-surface-interactive'}`}>
        {hasImage && !imageError ? (
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={600}
            className={`h-auto w-full object-contain ${editable ? `opacity-60 grayscale-[0.25] ${mode === 'write' ? 'max-h-[200px]' : ''}` : 'max-h-[600px] cursor-zoom-in'}`}
            onClick={editable ? undefined : () => setLightboxOpen(true)}
            onError={() => {
              console.error('Image failed to load:', block.src);
              setImageError(true);
            }}
            onLoad={() => setImageError(false)}
          />
        ) : hasImage && imageError ? (
          <div className="flex min-h-[100px] items-center justify-center text-sm text-text-muted/50">
            Failed to load image
          </div>
        ) : editable ? (
          <div
            className="flex min-h-[80px] flex-col items-center justify-center border border-dashed border-border-subtle/50 text-center transition cursor-pointer hover:border-border-interactive"
            onClick={onUploadClick}
            onDragOver={onDrop ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
            onDrop={onDrop ? (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files); } : undefined}
          >
            <p className="text-xs text-text-muted/40">Drop image or click</p>
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">No image</p>
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
          <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
              value={block.caption || ''}
              placeholder="Caption..."
              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 transition focus-visible:border-border-subtle focus-visible:outline-none"
              onChange={(event) => {
                const trimmed = event.target.value.trim();
                onChange?.({ caption: trimmed || undefined });
              }}
            />
          ) : (
            block.caption && <figcaption className="text-sm text-text-secondary">{block.caption}</figcaption>
          )}
          {editable && (
            <input
              type="text"
              value={block.alt}
              placeholder="Alt text..."
              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 transition focus-visible:border-border-subtle focus-visible:outline-none"
              onChange={(event) => onChange?.({ alt: event.target.value })}
            />
          )}
          {editable && (
            <input
              type="text"
              value={block.why ?? ''}
              placeholder="Why this matters..."
              className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/40 transition focus-visible:border-border-subtle focus-visible:outline-none"
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
