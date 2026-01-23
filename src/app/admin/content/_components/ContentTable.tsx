'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_premium: boolean;
  updated_at: string;
}

interface ContentTableProps {
  articles: ArticleRow[];
  onDelete: (id: string) => void;
  canDelete?: boolean;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ContentTable({ articles, onDelete, canDelete = false }: ContentTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 bg-surface-workbench px-6 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
        <div className="flex items-center">Title</div>
        <div className="flex items-center">Status</div>
        <div className="flex items-center">Premium</div>
        <div className="flex items-center">Updated</div>
        <div className="flex items-center justify-end">Actions</div>
      </div>
      <div className="divide-y divide-border-workbench bg-surface-workbench">
        {articles.map((article) => (
          <div
            key={article.id}
            className="group grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-sm transition-colors hover:bg-white/5 focus-within:bg-white/5"
          >
            <div className="flex items-center">
              <div>
                <p className="text-text-primary font-semibold">{article.title}</p>
                <p className="text-text-muted text-xs">{article.slug}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${
                  article.is_published
                    ? 'border-border-subtle bg-surface-dense text-text-primary'
                    : 'border-border-subtle bg-surface-dense/60 text-text-muted'
                }`}
              >
                {article.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center">
              <span className={article.is_premium ? 'text-text-primary' : 'text-text-muted'}>
                {article.is_premium ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-text-muted" style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
                {formatDate(article.updated_at)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Link href={`/admin/content/${article.id}`}>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </Link>
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(article.id)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="px-6 py-6 text-sm text-text-muted">No articles yet.</div>
        )}
      </div>
    </div>
  );
}
