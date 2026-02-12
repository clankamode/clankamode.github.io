'use client';

import { memo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugifyHeading } from '@/app/learn/_components/markdown';
import type { CalloutBlock as CalloutBlockType } from '../types';

interface CalloutBlockProps {
  block: CalloutBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<CalloutBlockType>) => void;
}

const toneLabels: Record<CalloutBlockType['tone'], string> = {
  tip: 'Tip',
  warning: 'Warning',
  info: 'Info',
  important: 'Important',
};

const toneStyles: Record<CalloutBlockType['tone'], { label: string; accent: string }> = {
  tip: { label: 'Tip', accent: 'border-l-2 border-l-emerald-400/70' },
  warning: { label: 'Warning', accent: 'border-l-2 border-l-amber-300/70' },
  info: { label: 'Info', accent: 'border-l-2 border-l-sky-300/70' },
  important: { label: 'Important', accent: 'border-l-2 border-l-red-400/70' },
};

function CalloutBlockComponent({ block, editable = false, onChange }: CalloutBlockProps) {
  const isCollapsible = block.collapsible && !editable;
  const [open, setOpen] = useState(true);

  const tone = toneStyles[block.tone] ?? toneStyles.info;

  const getText = (children: ReactNode) =>
    Array.isArray(children) ? children.join('') : String(children ?? '');

  // Show content if editable, or if open (for collapsible) or always (for non-collapsible)
  const shouldShowContent = editable || (isCollapsible ? open : true);

  return (
    <div className={`rounded-xl p-4 w-full ${editable ? '' : `frame bg-surface-dense ${tone.accent}`}`}>
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
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{tone.label}</p>
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
          <div className="mt-3 space-y-2">
            {block.title && (
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">{block.title}</h3>
            )}
            {block.content ? (
              <div className="prose prose-sm max-w-none w-full text-sm text-text-secondary">
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
                        className="mt-4 text-xl font-semibold tracking-tight text-text-primary"
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
                      <p {...props} className="mt-2 leading-relaxed text-text-secondary">
                        {children}
                      </p>
                    ),
                    code: ({ children, className, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (!isBlock) {
                        return (
                          <code
                            className="rounded bg-surface-interactive px-1.5 py-0.5 text-xs text-text-primary"
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
                        className="mt-3 overflow-x-auto rounded-lg border border-border-subtle bg-surface-interactive p-3 text-xs"
                      >
                        {children}
                      </pre>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul {...props} className="mt-2 list-disc space-y-1 pl-5 text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol {...props} className="mt-2 list-decimal space-y-1 pl-5 text-text-secondary">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        {...props}
                        className="mt-2 border-l-2 border-border-interactive pl-3 text-text-secondary italic"
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
