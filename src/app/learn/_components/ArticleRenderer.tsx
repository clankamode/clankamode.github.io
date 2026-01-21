import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugifyHeading } from './markdown';

interface ArticleRendererProps {
  content: string;
}

export default function ArticleRenderer({ content }: ArticleRendererProps) {
  const getText = (children: ReactNode) =>
    Array.isArray(children) ? children.join('') : String(children ?? '');

  return (
    <article className="prose max-w-none text-text-primary">
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
                <code className="rounded bg-surface-dense px-1.5 py-0.5 text-sm text-text-primary" {...props}>
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
              className="mt-6 border-l-2 border-border-interactive pl-4 text-text-secondary italic"
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
