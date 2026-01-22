'use client';

import { useMemo, useState } from 'react';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { parseBlocks } from '@/components/editor/utils/parseBlocks';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const blocks = useMemo(() => parseBlocks(value), [value]);
  const [mediaLibraryTrigger, setMediaLibraryTrigger] = useState(0);

  const wordCount = useMemo(() => {
    const text = blocks
      .filter((block) => block.type === 'markdown' || block.type === 'callout' || block.type === 'code')
      .map((block) => ('content' in block ? block.content : ''))
      .join(' ');
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [blocks]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border-subtle bg-surface-workbench p-5 min-h-[720px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Editor</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">
              {wordCount} words · {readingTime} min read
            </span>
            <button
              type="button"
              className="rounded-full border border-border-subtle bg-surface-workbench px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition hover:border-border-interactive hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setMediaLibraryTrigger((prev) => prev + 1)}
            >
              Media Library
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-lg border border-border-workbench bg-surface-dense px-4 py-2 text-xs text-text-muted">
          Drop media anywhere or type <span className="text-text-primary">/</span> for blocks.
        </div>
        <BlockEditor value={value} onChange={onChange} mediaLibraryTrigger={mediaLibraryTrigger} />
      </div>
      <div className="rounded-xl border border-border-subtle bg-surface-ambient p-5 min-h-[720px]">
        <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-text-muted">Preview</span>
        <div className="max-h-[720px] overflow-y-auto pr-2">
          <BlockRenderer blocks={blocks} />
        </div>
      </div>
    </div>
  );
}
