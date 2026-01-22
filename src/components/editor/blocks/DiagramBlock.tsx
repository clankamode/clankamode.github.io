'use client';

import { useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import type { DiagramBlock as DiagramBlockType } from '../types';

interface DiagramBlockProps {
  block: DiagramBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<DiagramBlockType>) => void;
}

export function DiagramBlock({ block, editable = false, onChange }: DiagramBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const renderId = useMemo(() => `diagram-${Math.random().toString(36).slice(2, 9)}`, []);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  }, []);

  useEffect(() => {
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
  }, [block.content, renderId]);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-dense p-5">
      {editable && (
        <textarea
          value={block.content}
          placeholder="Write Mermaid syntax here..."
          className="mb-4 min-h-[160px] w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 font-mono text-sm text-text-primary"
          onChange={(event) => onChange?.({ content: event.target.value })}
        />
      )}

      {error ? (
        <p className="text-sm text-text-muted">Unable to render diagram: {error}</p>
      ) : (
        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
