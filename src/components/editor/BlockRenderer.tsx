'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugifyHeading } from '@/app/learn/_components/markdown';
import { cn } from '@/lib/utils';
import type { EditorBlock } from './types';
import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { ImageBlock } from './blocks/ImageBlock';

interface BlockRendererProps {
  blocks: EditorBlock[];
  mode?: 'default' | 'execution';
}

export function BlockRenderer({ blocks, mode = 'default' }: BlockRendererProps) {
  const getText = (children: ReactNode) =>
    Array.isArray(children) ? children.join('') : String(children ?? '');
  const isExecution = mode === 'execution';

  return (
    <div className={isExecution ? 'space-y-4' : 'space-y-5'}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'markdown':
            return (
              <article
                key={block.id}
                className={cn(
                  'prose max-w-none',
                  isExecution
                    ? 'text-text-primary [&>h2+h3]:mt-2 [&>h2+h2]:mt-3 [&>h3+h3]:mt-2.5'
                    : 'text-text-primary [&>h2+h3]:mt-3 [&>h2+h2]:mt-6 [&>h3+h3]:mt-4'
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
                        className={cn(
                          'font-bold text-text-primary',
                          isExecution ? 'text-3xl tracking-[-0.018em]' : 'text-4xl tracking-tight'
                        )}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => {
                      const text = getText(children);
                      return (
                        <h2
                          {...props}
                          id={slugifyHeading(text)}
                          className={cn(
                            'font-semibold text-text-primary',
                            isExecution
                              ? 'first-of-type:hidden mt-8 text-[2.05rem] leading-tight tracking-[-0.015em]'
                              : 'mt-12 text-2xl tracking-tight'
                          )}
                        >
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children, ...props }) => (
                      <h3
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className={cn(
                          'font-semibold text-text-primary',
                          isExecution ? 'mt-5 text-[1.45rem] leading-tight tracking-[-0.01em]' : 'mt-6 text-xl tracking-tight'
                        )}
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => {
                      return (
                        <p
                          {...props}
                          className={cn(
                            isExecution
                              ? 'mt-4 text-base leading-relaxed sm:text-[17px]'
                              : 'mt-4 text-lg leading-relaxed text-text-secondary',
                            isExecution ? 'text-text-primary/90' : ''
                          )}
                        >
                          {children}
                        </p>
                      );
                    },
                    code: ({ children, className, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (!isBlock) {
                        return (
                          <code
                            className={cn(
                              'rounded font-mono',
                              isExecution
                                ? 'border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[14px] text-emerald-400'
                                : 'bg-surface-dense px-1.5 py-0.5 text-sm text-emerald-400'
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
                          'overflow-x-auto border text-sm',
                          isExecution
                            ? 'relative mt-6 rounded-lg border-emerald-500/20 bg-[#0d0d0d] p-5 text-base leading-7 shadow-lg shadow-emerald-500/5 sm:text-[17px]'
                            : 'mt-6 rounded-lg border-border-subtle bg-surface-dense p-5'
                        )}
                      >
                        {children}
                      </pre>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul
                        {...props}
                        className={cn(
                          isExecution
                            ? 'mt-5 space-y-3 text-base text-text-primary/90 sm:text-[17px] [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-emerald-500 [&>li]:marker:hidden'
                            : 'mt-4 list-disc space-y-2 pl-6 text-text-secondary'
                        )}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol
                        {...props}
                        className={cn(
                          'list-decimal pl-6',
                          isExecution
                            ? 'mt-4 space-y-1.5 text-base text-text-primary/90 sm:text-[17px]'
                            : 'mt-4 space-y-2 text-text-secondary'
                        )}
                      >
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        {...props}
                        className={cn(
                          'relative border-l-2 [&_blockquote]:mt-3',
                          isExecution
                            ? 'my-6 border-l-emerald-500 bg-emerald-500/5 py-4 pl-6 pr-4 text-base leading-relaxed text-text-primary sm:text-[17px]'
                            : 'mt-6 border-border-interactive pl-4 text-text-secondary italic'
                        )}
                      >
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href, ...props }) => {
                      const isExternal = href?.startsWith('http');
                      return (
                        <a
                          {...props}
                          href={href}
                          className="group inline-flex items-baseline gap-1 font-medium text-text-primary underline decoration-text-muted/70 decoration-2 underline-offset-4 transition-colors duration-200 hover:text-accent-primary hover:decoration-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noreferrer noopener' : undefined}
                        >
                          <span>{children}</span>
                          {isExternal && (
                            <span
                              aria-hidden="true"
                              className="text-[0.7em] text-text-muted transition-colors group-hover:text-brand-green"
                            >
                              ↗
                            </span>
                          )}
                        </a>
                      );
                    },
                    table: ({ children, ...props }) => (
                      <div
                        className={cn(
                          'w-full overflow-hidden border',
                          isExecution
                            ? 'my-4 rounded-none border-border-interactive/80 bg-surface-workbench/70'
                            : 'my-6 rounded-lg border-border-subtle bg-surface-dense'
                        )}
                      >
                        <div className="overflow-x-auto">
                          <table {...props} className="w-full text-left text-sm">
                            {children}
                          </table>
                        </div>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead {...props} className="border-b border-border-subtle bg-surface-interactive/50">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody {...props} className="divide-y divide-border-subtle/50">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr {...props} className="transition-colors hover:bg-surface-interactive">
                        {children}
                      </tr>
                    ),
                    th: ({ children, ...props }) => (
                      <th {...props} className="px-4 py-3 font-medium text-text-primary">
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td {...props} className="px-4 py-3 text-text-secondary">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className={isExecution ? 'my-4 border-border-interactive/70' : 'mt-8 mb-3 border-border-subtle'} />
                    ),
                  }}
                >
                  {block.content}
                </ReactMarkdown>
              </article>
            );
          case 'image':
            return <ImageBlock key={block.id} block={isExecution ? { ...block, size: 'full' } : block} />;
          case 'callout':
            return <CalloutBlock key={block.id} block={block} mode={mode} />;
          case 'embed':
            return <EmbedBlock key={block.id} block={block} />;
          case 'code':
            return <CodeBlock key={block.id} block={block} mode={mode} />;
          case 'diagram':
            return <DiagramBlock key={block.id} block={block} mode={mode} />;
          case 'divider':
            return (
              <div key={block.id} className={isExecution ? 'my-4' : 'mt-8 mb-3'}>
                <hr className={isExecution ? 'border-border-interactive/65' : 'border-border-subtle'} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
