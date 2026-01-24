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
  // Mode state: 'write' (default) vs 'inspect'
  const [mode, setMode] = useState<'write' | 'inspect'>('write');
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted/30 font-semibold">Authoring Surface</span>
            <div className="flex items-center gap-2 text-xs text-text-secondary font-mono">
              {wordCount} words · {readingTime} min read
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition hover:text-text-primary focus-ring"
            onClick={() => setMediaLibraryTrigger((prev) => prev + 1)}
          >
            Media Library
          </button>

          {/* Mode Toggles */}
          <div className="flex items-center rounded-full bg-surface-interactive p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'write'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
                }`}
              onClick={() => setMode('write')}
            >
              Write
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'inspect'
                ? 'bg-surface-dense text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
                }`}
              onClick={() => setMode('inspect')}
            >
              Inspect
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-8 transition-all duration-300 ${mode === 'inspect' ? 'lg:grid-cols-[60%_40%]' : 'grid-cols-1'}`}>
        {/* Editor Column */}
        <div className={`transition-all duration-300 mx-auto w-full ${mode === 'write' ? 'max-w-5xl' : 'max-w-full'}`}>
          <div className={`min-h-[800px] bg-[#18181b] px-8 lg:px-12 rounded-lg ${mode === 'write' ? 'shadow-2xl border-x border-y border-white/5' : ''}`}>
            <BlockEditor value={value} onChange={onChange} mediaLibraryTrigger={mediaLibraryTrigger} mode={mode} />
          </div>
        </div>

        {/* Preview Column - Only visible in Inspect Mode */}
        {mode === 'inspect' && (
          <div className="sticky top-24 h-[calc(100vh-160px)] min-h-[720px] min-w-[320px] overflow-hidden border-l border-white/10 pl-6 opacity-75">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted/50 font-semibold">Preview</span>
            </div>
            <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
              <BlockRenderer blocks={blocks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
