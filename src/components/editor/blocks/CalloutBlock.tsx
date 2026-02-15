'use client';

import { memo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugifyHeading } from '@/app/learn/_components/markdown';
import { cn } from '@/lib/utils';
import type { CalloutBlock as CalloutBlockType } from '../types';

interface CalloutBlockProps {
  block: CalloutBlockType;
  editable?: boolean;
  mode?: 'default' | 'execution';
  onChange?: (updates: Partial<CalloutBlockType>) => void;
}

const toneLabels: Record<CalloutBlockType['tone'], string> = {
  tip: 'Tip',
  warning: 'Warning',
  info: 'Info',
  important: 'Important',
};

const toneStyles: Record<CalloutBlockType['tone'], { label: string; accent: string; executionAccent: string }> = {
  tip: {
    label: '✓ Tip',
    accent: 'border-l-2 border-l-emerald-400/70',
    executionAccent: 'border-l-4 border-l-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
  },
  warning: {
    label: '⚠ Warning',
    accent: 'border-l-2 border-l-amber-300/70',
    executionAccent: 'border-l-4 border-l-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
  },
  info: {
    label: 'ℹ Info',
    accent: 'border-l-2 border-l-sky-300/70',
    executionAccent: 'border-l-4 border-l-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5'
  },
  important: {
    label: '⚡ Important',
    accent: 'border-l-2 border-l-red-400/70',
    executionAccent: 'border-l-4 border-l-red-500 bg-red-500/10 shadow-lg shadow-red-500/5'
  },
};

function CalloutBlockComponent({ block, editable = false, mode = 'default', onChange }: CalloutBlockProps) {
  const isCollapsible = block.collapsible && !editable;
  const [open, setOpen] = useState(true);
  const isExecutionMode = mode === 'execution';

  const tone = toneStyles[block.tone] ?? toneStyles.info;

  const getText = (children: ReactNode) =>
    Array.isArray(children) ? children.join('') : String(children ?? '');

  // Show content if editable, or if open (for collapsible) or always (for non-collapsible)
  const shouldShowContent = editable || (isCollapsible ? open : true);

  return (
    <div
      className={cn(
        'w-full',
        editable
          ? 'rounded-xl p-4'
          : isExecutionMode
            ? `rounded-lg backdrop-blur-sm ${tone.executionAccent} px-5 py-4`
            : `frame rounded-xl bg-surface-dense p-4 ${tone.accent}`
      )}
    >
      <div className="flex items-center gap-4">
        {editable ? (
          <select
            className="rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs uppercase tracking-[0.2em] text-text-secondary transition focus-visible:text-text-primary focus-visible:outline-none"
            value={block.tone}
            onChange={(event) => onChange?.({ tone: event.target.value as CalloutBlockType['tone'] })}
          >
            {Object.entries(toneLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-3">
            <p
              className={cn(
                'font-medium',
                isExecutionMode
                  ? 'text-sm tracking-wide text-text-primary'
                  : 'text-[10px] uppercase tracking-[0.12em] text-text-muted'
              )}
            >
              {tone.label}
            </p>
            {isCollapsible && (
              <button
                type="button"
                className="text-xs text-text-secondary transition hover:text-text-primary"
                onClick={() => setOpen((prev) => !prev)}
              >
                {open ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        )}
        {editable && (
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={block.collapsible ?? false}
              onChange={(event) => onChange?.({ collapsible: event.target.checked })}
            />
            Collapsible
          </label>
        )}
      </div>

      {editable && (
        <input
          type="text"
          value={block.title ?? ''}
          placeholder="Title (optional)"
          className="mt-3 w-full rounded-lg border border-transparent bg-transparent px-3 py-2 text-base text-white/95 placeholder:text-white/50 transition focus-visible:outline-none"
          onChange={(event) => onChange?.({ title: event.target.value })}
        />
      )}

      {editable ? (
        <textarea
          value={block.content || ''}
          placeholder="Content..."
          className="mt-3 w-full resize-none rounded-lg border border-transparent bg-transparent px-3 py-2 text-base text-white/90 placeholder:text-white/50 transition focus-visible:outline-none overflow-hidden"
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
      ) : (
        shouldShowContent && (
          <div className={isExecutionMode ? 'mt-2.5 space-y-1.5' : 'mt-3 space-y-2'}>
            {block.title && (
              <h3
                className={cn(
                  'font-semibold text-text-primary',
                  isExecutionMode ? 'text-base leading-6 tracking-[-0.01em]' : 'text-lg tracking-tight'
                )}
              >
                {block.title}
              </h3>
            )}
            {block.content ? (
              <div
                className={cn(
                  'prose prose-sm w-full max-w-none',
                  isExecutionMode ? 'text-[15px] text-text-primary/86 sm:text-base' : 'text-sm text-text-secondary'
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className="text-2xl font-bold tracking-tight text-text-primary"
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className={cn(
                          'text-xl font-semibold text-text-primary',
                          isExecutionMode ? 'mt-3 tracking-[-0.01em]' : 'mt-4 tracking-tight'
                        )}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className="mt-3 text-lg font-semibold tracking-tight text-text-primary"
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p
                        {...props}
                        className={cn(
                          isExecutionMode ? 'mt-2 leading-7 text-text-primary/86' : 'mt-2 leading-relaxed text-text-secondary'
                        )}
                      >
                        {children}
                      </p>
                    ),
                    code: ({ children, className, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (!isBlock) {
                        return (
                          <code
                            className={cn(
                              'rounded font-mono',
                              isExecutionMode
                                ? 'border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[13px] text-emerald-300'
                                : 'bg-surface-interactive px-1.5 py-0.5 text-xs text-emerald-400'
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children, ...props }) => (
                      <pre
                        {...props}
                        className={cn(
                          'mt-3 overflow-x-auto border',
                          isExecutionMode
                            ? 'rounded-none border-border-interactive/80 bg-surface-dense p-3 text-[13px]'
                            : 'rounded-lg border-border-subtle bg-surface-interactive p-3 text-xs'
                        )}
                      >
                        {children}
                      </pre>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul
                        {...props}
                        className={cn(
                          'mt-2 list-disc pl-5',
                          isExecutionMode ? 'space-y-1 text-text-primary/85' : 'space-y-1 text-text-secondary'
                        )}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol
                        {...props}
                        className={cn(
                          'mt-2 list-decimal pl-5',
                          isExecutionMode ? 'space-y-1 text-text-primary/85' : 'space-y-1 text-text-secondary'
                        )}
                      >
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        {...props}
                        className={cn(
                          'mt-2 border-l-2 border-border-interactive pl-3',
                          isExecutionMode ? 'text-text-primary/82' : 'text-text-secondary italic'
                        )}
                      >
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, ...props }) => (
                      <a
                        {...props}
                        className="text-text-primary underline transition hover:text-text-secondary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {block.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No content</p>
            )}
          </div>
        )
      )}
    </div>
  );
}

export const CalloutBlock = memo(CalloutBlockComponent);
