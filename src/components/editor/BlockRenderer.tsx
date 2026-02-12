'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugifyHeading } from '@/app/learn/_components/markdown';
import type { EditorBlock } from './types';
import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { ImageBlock } from './blocks/ImageBlock';

interface BlockRendererProps {
  blocks: EditorBlock[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const getText = (children: ReactNode) =>
    Array.isArray(children) ? children.join('') : String(children ?? '');

  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        switch (block.type) {
          case 'markdown':
            return (
              <article key={block.id} className="prose max-w-none text-text-primary">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className="text-4xl font-bold tracking-tight text-text-primary"
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className="mt-12 text-2xl font-semibold tracking-tight text-text-primary"
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3
                        {...props}
                        id={slugifyHeading(getText(children))}
                        className="mt-8 text-xl font-semibold tracking-tight text-text-primary"
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p {...props} className="mt-4 text-lg leading-relaxed text-text-secondary">
                        {children}
                      </p>
                    ),
                    code: ({ children, className, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (!isBlock) {
                        return (
                          <code
                            className="rounded bg-surface-dense px-1.5 py-0.5 text-sm text-text-primary"
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
                        className="mt-6 overflow-x-auto rounded-lg border border-border-subtle bg-surface-dense p-5 text-sm"
                      >
                        {children}
                      </pre>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul {...props} className="mt-4 list-disc space-y-2 pl-6 text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol {...props} className="mt-4 list-decimal space-y-2 pl-6 text-text-secondary">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        {...props}
                        className="mt-6 border-l-2 border-border-interactive pl-4 text-text-secondary italic [&_blockquote]:mt-3"
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
                          className="group inline-flex items-baseline gap-1 font-medium text-text-primary underline decoration-text-muted/70 decoration-2 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                      <div className="my-6 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-dense">
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
                      <tr {...props} className="transition-colors hover:bg-white/5">
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
                  }}
                >
                  {block.content}
                </ReactMarkdown>
              </article>
            );
          case 'image':
            return <ImageBlock key={block.id} block={block} />;
          case 'callout':
            return <CalloutBlock key={block.id} block={block} />;
          case 'embed':
            return <EmbedBlock key={block.id} block={block} />;
          case 'code':
            return <CodeBlock key={block.id} block={block} />;
          case 'diagram':
            return <DiagramBlock key={block.id} block={block} />;
          case 'divider':
            return <hr key={block.id} className="border-border-subtle" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
