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
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 bg-surface-interactive/80 px-6 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
        <span>Title</span>
        <span>Status</span>
        <span>Premium</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-border-subtle bg-surface-interactive/60">
        {articles.map((article) => (
          <div key={article.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-sm">
            <div>
              <p className="text-text-primary font-semibold">{article.title}</p>
              <p className="text-text-muted text-xs">{article.slug}</p>
            </div>
            <span className={article.is_published ? 'text-green-400' : 'text-text-muted'}>
              {article.is_published ? 'Published' : 'Draft'}
            </span>
            <span className={article.is_premium ? 'text-text-primary' : 'text-text-muted'}>
              {article.is_premium ? 'Yes' : 'No'}
            </span>
            <span className="text-text-muted">{formatDate(article.updated_at)}</span>
            <div className="flex items-center justify-end gap-2">
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
