'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import type { DiagramBlock as DiagramBlockType } from '../types';

interface DiagramBlockProps {
  block: DiagramBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<DiagramBlockType>) => void;
}

function DiagramBlockComponent({ block, editable = false, onChange }: DiagramBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const renderId = useMemo(() => `diagram-${Math.random().toString(36).slice(2, 9)}`, []);

  useEffect(() => {
    if (editable) return; // Don't render in edit mode
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  }, [editable]);

  useEffect(() => {
    if (editable) return; // Don't render in edit mode

    let cancelled = false;
    const renderDiagram = async () => {
      try {
        const { svg: rendered } = await mermaid.render(renderId, block.content || 'flowchart TD\n  A[Empty] --> B[Diagram]');
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      }
    };
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [block.content, renderId, editable]);

  // Edit mode: raw mermaid code only
  if (editable) {
    return (
      <textarea
        value={block.content || ''}
        placeholder="flowchart TD
  A[Start] --> B[Next]"
        className="w-full resize-none bg-transparent px-0 py-2 font-mono text-base text-white/90 placeholder:text-white/50 focus:outline-none overflow-hidden"
        onChange={(event) => {
          onChange?.({ content: event.target.value });
          event.target.style.height = 'auto';
          event.target.style.height = `${event.target.scrollHeight}px`;
        }}
        ref={(el) => {
          if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
      />
    );
  }

  // Preview mode: rendered diagram only
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-dense p-4">
      {error ? (
        <p className="text-sm text-text-muted">Unable to render diagram: {error}</p>
      ) : svg ? (
        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <p className="text-sm text-text-muted italic">No diagram content</p>
      )}
    </div>
  );
}

export const DiagramBlock = memo(DiagramBlockComponent);
