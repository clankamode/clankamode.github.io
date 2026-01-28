'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { parseBlocks } from '@/components/editor/utils/parseBlocks';

const MIN_LEFT_PERCENT = 25;
const MAX_LEFT_PERCENT = 75;
const DEFAULT_LEFT_PERCENT = 60;
const RESIZE_HANDLE_PX = 8;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const blocks = useMemo(() => parseBlocks(value), [value]);
  const [mode, setMode] = useState<'write' | 'inspect'>('write');
  const [mediaLibraryTrigger, setMediaLibraryTrigger] = useState(0);
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const [isLg, setIsLg] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startPercent: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLg(mq.matches);
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startPercent: leftPercent };
    const onMove = (moveEvent: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const delta = moveEvent.clientX - dragRef.current.startX;
      const deltaPercent = (delta / container.offsetWidth) * 100;
      setLeftPercent(() =>
        Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, dragRef.current.startPercent + deltaPercent))
      );
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftPercent]);

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

      <div
        ref={containerRef}
        className={`flex gap-0 transition-all duration-300 ${mode === 'inspect' ? 'lg:flex-row' : 'flex-col'}`}
      >
        {/* Editor Column */}
        <div
          className={`transition-all duration-300 mx-auto w-full ${mode === 'write' ? 'max-w-5xl' : ''} ${mode === 'inspect' ? 'lg:mx-0 lg:min-w-0 lg:shrink-0' : ''}`}
          style={mode === 'inspect' && isLg ? { flex: `0 0 ${leftPercent}%` } : undefined}
        >
          <div className={`min-h-[800px] bg-[#18181b] px-8 lg:px-12 rounded-lg ${mode === 'write' ? 'shadow-2xl border-x border-y border-white/5' : ''}`}>
            <BlockEditor value={value} onChange={onChange} mediaLibraryTrigger={mediaLibraryTrigger} mode={mode} />
          </div>
        </div>

        {/* Resize Handle - Only in Inspect Mode */}
        {mode === 'inspect' && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(leftPercent)}
            aria-valuemin={MIN_LEFT_PERCENT}
            aria-valuemax={MAX_LEFT_PERCENT}
            tabIndex={0}
            className="hidden lg:flex shrink-0 w-2 cursor-col-resize items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
            onMouseDown={startResize}
            style={{ width: RESIZE_HANDLE_PX }}
          >
            <div className="w-0.5 h-full min-h-[600px] bg-border/50 group-hover:bg-accent-primary/60 transition-colors rounded-full" />
          </div>
        )}

        {/* Preview Column - Only visible in Inspect Mode */}
        {mode === 'inspect' && (
          <div className="lg:flex-1 sticky top-24 h-[calc(100vh-160px)] min-h-[720px] min-w-[320px] overflow-hidden lg:border-l border-white/10 pl-6 opacity-75 w-full">
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
