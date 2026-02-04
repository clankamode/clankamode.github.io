import Link from 'next/link';
import type { LearningArticle } from '@/types/content';
import BookmarkButton from './BookmarkButton';

interface ArticleCardProps {
  pillarSlug: string;
  article: LearningArticle;
  showProgress?: boolean;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ArticleCard({ pillarSlug, article, showProgress = false }: ArticleCardProps) {
  return (
    <div className="group relative">
      <Link
        href={`/learn/${pillarSlug}/${article.slug}`}
        className="frame flex h-full flex-col gap-3 p-5 transition-all duration-300 bg-surface-interactive/80 hover:bg-surface-interactive/90"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] font-semibold text-text-muted">
          <div className="flex items-center gap-2">
            <span>Article</span>
            {article.is_premium && (
              <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] text-brand-green border border-brand-green/20">
                Premium
              </span>
            )}
          </div>
          {/* Spacer for bookmark button if visible */}
          {showProgress && <div className="h-[30px] w-[30px]" />}
        </div>

        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary group-hover:text-white transition-colors duration-300">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-base text-text-secondary leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2 text-sm text-text-muted">
          <span>{formatDate(article.updated_at)}</span>
          <span className="opacity-40">•</span>
          <span>{article.reading_time_minutes || 5} min read</span>
        </div>
      </Link>

      {/* Floating bookmark button to avoid nesting <button> inside <a> */}
      {showProgress && (
        <div className="absolute right-5 top-5 z-10">
          <BookmarkButton articleId={article.id} size="sm" />
        </div>
      )}
    </div>
  );
}
