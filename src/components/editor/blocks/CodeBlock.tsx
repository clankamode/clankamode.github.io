'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import type { CodeBlock as CodeBlockType } from '../types';

interface CodeBlockProps {
  block: CodeBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<CodeBlockType>) => void;
}

const COMMON_LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'graphql', label: 'GraphQL' },
];

function parseHighlightRanges(value?: string): Set<number> {
  if (!value) {
    return new Set();
  }
  const result = new Set<number>();
  value.split(',').forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) {
      return;
    }
    const rangeMatch = /(\d+)-(\d+)/.exec(trimmed);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let i = start; i <= end; i += 1) {
        result.add(i);
      }
      return;
    }
    const single = Number(trimmed);
    if (!Number.isNaN(single)) {
      result.add(single);
    }
  });
  return result;
}

type HLJSApi = {
  highlight: (code: string, options: { language: string; ignoreIllegals: boolean }) => { value: string };
};

function CodeBlockComponent({ block, editable = false, onChange }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [hljs, setHljs] = useState<HLJSApi | null>(null);
  const highlightedLines = parseHighlightRanges(block.highlight);
  const normalizedContent = block.content.replace(/^\n+/, '');
  const lines = normalizedContent.split('\n');

  useEffect(() => {
    import('highlight.js')
      .then((mod) => {
        const hljsInstance = (mod.default || mod) as HLJSApi;
        setHljs(hljsInstance);
      })
      .catch(() => {
        // Fallback to plain text
      });
  }, []);

  const highlightedLinesArray = useMemo(() => {
    if (!normalizedContent || editable || !hljs) {
      return lines.map((line) => line);
    }
    try {
      const language = block.language || 'text';
      return lines.map((line) => {
        if (!line.trim()) {
          return line;
        }
        try {
          const result = hljs.highlight(line, {
            language: language === 'text' ? 'plaintext' : language,
            ignoreIllegals: true,
          });
          return result.value;
        } catch {
          return line;
        }
      });
    } catch {
      return lines.map((line) => line);
    }
  }, [normalizedContent, block.language, editable, lines, hljs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!block.content && !editable) {
    return null;
  }

  // Edit mode: flat monospace textarea, no chrome
  if (editable) {
    return (
      <div className="group/code relative font-mono">
        <div className="absolute top-0 right-0 z-20 flex items-center gap-2 opacity-0 transition-opacity group-focus-within/code:opacity-100 hover:opacity-100">
          <input
            type="text"
            value={block.filename ?? ''}
            placeholder="file.ts"
            className="w-20 border-none bg-transparent px-1 py-0.5 text-[10px] text-text-muted/50 placeholder:text-text-muted/20 focus:text-text-primary focus:outline-none"
            onChange={(event) => onChange?.({ filename: event.target.value })}
          />
          <select
            value={block.language || 'text'}
            className="w-20 border-none bg-transparent px-1 py-0.5 text-[10px] text-text-muted/50 transition focus:text-text-primary focus:outline-none"
            onChange={(event) => onChange?.({ language: event.target.value })}
          >
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={block.content || ''}
          placeholder="// code..."
          className="w-full min-h-[80px] resize-none bg-transparent px-0 py-2 font-mono text-base leading-relaxed text-white/90 placeholder:text-white/50 focus:outline-none overflow-hidden"
          onChange={(event) => {
            const raw = event.target.value;
            const next = raw.replace(/^\n+/, '');
            onChange?.({ content: next });
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
      </div>
    );
  }

  // Preview mode: styled code block
  return (
    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-ambient transition-all hover:border-border-interactive">
      <div className="group/code relative font-mono">
        <div className="absolute top-3 right-4 z-20 flex items-center gap-3 opacity-0 transition-opacity group-hover/code:opacity-100">
          {block.filename && <span className="text-[10px] uppercase tracking-widest text-text-muted">{block.filename}</span>}
          <button
            type="button"
            className="rounded-full border border-border-subtle bg-surface-interactive/40 px-3 py-1 text-[10px] uppercase tracking-wider text-text-secondary backdrop-blur-sm transition hover:border-border-interactive hover:text-text-primary"
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto px-4 py-4 text-sm text-text-primary">
          <code className="grid gap-1 font-mono">
            {lines.map((originalLine, index) => {
              const lineNumber = index + 1;
              const highlighted = highlightedLines.has(lineNumber);
              const highlightedLine = highlightedLinesArray[index] || originalLine;
              return (
                <span
                  key={`${block.id}-line-${lineNumber}`}
                  className={`flex gap-4 rounded px-2 py-0.5 ${highlighted ? 'bg-surface-interactive/70' : ''
                    }`}
                >
                  <span className="w-6 text-right text-xs text-text-muted">{lineNumber}</span>
                  <span
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightedLine || ' ' }}
                  />
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

export const CodeBlock = memo(CodeBlockComponent);
