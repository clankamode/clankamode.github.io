'use client';

import { useMemo } from 'react';
import ArticleRenderer from '@/app/learn/_components/ArticleRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const { wordCount, readingTime } = useMemo(() => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    return {
      wordCount: count,
      readingTime: Math.max(1, Math.ceil(count / 200)),
    };
  }, [value]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Markdown</p>
        <textarea
          className="mt-2 h-[520px] w-full rounded-xl border border-border-subtle bg-surface-dense p-4 text-sm text-text-primary"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-text-muted">
          {wordCount} words · {readingTime} min read
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Preview</p>
        <div className="mt-2 h-[520px] overflow-y-auto rounded-xl border border-border-subtle bg-surface-interactive/70 p-6">
          <ArticleRenderer content={value} />
        </div>
      </div>
    </div>
  );
}
