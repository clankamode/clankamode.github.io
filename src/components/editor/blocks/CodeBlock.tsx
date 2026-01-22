'use client';

import { useEffect, useMemo, useState } from 'react';
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

export function CodeBlock({ block, editable = false, onChange }: CodeBlockProps) {
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

  return (
    <div className="frame rounded-xl bg-surface-dense">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        {editable ? (
          <div className="flex flex-1 flex-wrap gap-3">
            <input
              type="text"
              value={block.filename ?? ''}
              placeholder="Filename"
              className="w-40 rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-xs text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ filename: event.target.value })}
            />
            <select
              value={block.language || 'text'}
              className="w-40 rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-xs text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ language: event.target.value })}
            >
              {COMMON_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={block.highlight ?? ''}
              placeholder="Highlight lines (2,4-6)"
              className="w-40 rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-xs text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onChange?.({ highlight: event.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-1">
            {block.filename && <p className="text-xs text-text-primary">{block.filename}</p>}
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{block.language}</p>
          </div>
        )}

        {!editable && (
          <button
            type="button"
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary transition hover:border-border-interactive hover:text-text-primary"
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

    {editable ? (
        <textarea
          value={block.content}
          className="min-h-[200px] w-full rounded-b-xl bg-surface-dense px-4 py-3 font-mono text-sm text-text-primary focus-visible:outline-none"
          onChange={(event) => {
            const raw = event.target.value;
            const next = raw.replace(/^\n+/, '');
            onChange?.({ content: next });
          }}
        />
      ) : (
        <pre className="overflow-x-auto px-4 py-4 text-sm text-text-primary">
          <code className="grid gap-1 font-mono">
            {lines.map((originalLine, index) => {
              const lineNumber = index + 1;
              const highlighted = highlightedLines.has(lineNumber);
              const highlightedLine = highlightedLinesArray[index] || originalLine;
              return (
                <span
                  key={`${block.id}-line-${lineNumber}`}
                  className={`flex gap-4 rounded px-2 py-0.5 ${
                    highlighted ? 'bg-surface-interactive/70' : ''
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
      )}
    </div>
  );
}
