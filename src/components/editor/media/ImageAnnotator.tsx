'use client';

import { useMemo, useRef, useState } from 'react';
import type { ImageAnnotation, ImageBlock } from '../types';
import { createBlockId } from '../utils/blockUtils';

interface ImageAnnotatorProps {
  block: ImageBlock;
  onClose: () => void;
  onSave: (annotations: ImageAnnotation[]) => void;
}

export function ImageAnnotator({ block, onClose, onSave }: ImageAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(block.annotations ?? []);
  const overlayId = useMemo(() => createBlockId('annotation'), []);

  const handleAddAnnotation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const next: ImageAnnotation[] = [
      ...annotations,
      {
        id: createBlockId('callout'),
        x: Math.min(Math.max(x, 0), 1),
        y: Math.min(Math.max(y, 0), 1),
        text: 'New annotation',
        style: 'callout' as const,
      },
    ];
    setAnnotations(next);
  };

  const updateAnnotation = (id: string, updates: Partial<ImageAnnotation>) => {
    setAnnotations((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-dense/80 px-6 py-4 text-text-primary">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Annotation Mode</p>
          <p className="mt-2 text-xs text-text-muted">Click the image to add callouts. Drag to refine.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary"
            onClick={() => onSave(annotations)}
          >
            Save
          </button>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row">
        <div className="flex-1 overflow-auto">
          <div
            ref={containerRef}
            className="frame relative mx-auto max-w-4xl cursor-crosshair bg-surface-interactive p-3"
            onClick={handleAddAnnotation}
          >
            <img src={block.src} alt={block.alt} className="h-auto w-full rounded-lg" />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              {annotations.map((annotation) => {
                if (annotation.style !== 'arrow') {
                  return null;
                }
                const startX = annotation.x * 100;
                const startY = annotation.y * 100;
                const endX = Math.min(startX + 12, 95);
                const endY = Math.max(startY - 8, 5);
                return (
                  <line
                    key={`${overlayId}-line-${annotation.id}`}
                    x1={`${startX}%`}
                    y1={`${startY}%`}
                    x2={`${endX}%`}
                    y2={`${endY}%`}
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            {annotations.map((annotation, index) => (
              <div
                key={annotation.id}
                className="absolute flex items-center gap-2"
                style={{
                  left: `${annotation.x * 100}%`,
                  top: `${annotation.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-surface-dense text-xs text-text-primary shadow-[var(--shadow-lift)]">
                  {index + 1}
                </div>
                {annotation.style === 'arrow' && (
                  <span className="rounded bg-surface-dense/80 px-2 py-1 text-xs text-text-primary">
                    {annotation.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface-dense p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Annotations</p>
            <span className="text-xs text-text-muted">{annotations.length} total</span>
          </div>
          {annotations.map((annotation, index) => (
            <div key={annotation.id} className="space-y-2 rounded-lg border border-border-subtle bg-surface-interactive/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">#{index + 1}</p>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => removeAnnotation(annotation.id)}
                >
                  Remove
                </button>
              </div>
              <select
                value={annotation.style ?? 'callout'}
                className="w-full rounded border border-border-subtle bg-surface-dense px-2 py-1 text-xs text-text-secondary"
                onChange={(event) =>
                  updateAnnotation(annotation.id, {
                    style: event.target.value as ImageAnnotation['style'],
                  })
                }
              >
                <option value="callout">Callout</option>
                <option value="arrow">Arrow</option>
              </select>
              <input
                type="text"
                value={annotation.text}
                className="w-full rounded border border-border-subtle bg-surface-dense px-2 py-1 text-xs text-text-primary"
                onChange={(event) => updateAnnotation(annotation.id, { text: event.target.value })}
              />
            </div>
          ))}
          {!annotations.length && (
            <p className="text-sm text-text-muted">Click the image to add an annotation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
