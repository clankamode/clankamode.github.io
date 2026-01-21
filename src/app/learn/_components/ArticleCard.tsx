import Link from 'next/link';
import type { LearningArticle } from '@/types/content';

interface ArticleCardProps {
  pillarSlug: string;
  article: LearningArticle;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ArticleCard({ pillarSlug, article }: ArticleCardProps) {
  return (
    <Link
      href={`/learn/${pillarSlug}/${article.slug}`}
      className="group frame flex flex-col gap-3 p-5 transition-all duration-300"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-muted">
        <span>Article</span>
        {article.is_premium && (
          <span className="rounded-full bg-surface-dense px-3 py-1 text-[10px] font-semibold text-text-primary">
            Premium
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-text-primary group-hover:text-white">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-base text-text-secondary leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
      )}
      <div className="mt-2 flex items-center gap-3 text-xs font-mono tracking-wide text-text-muted">
        <span>{formatDate(article.updated_at)}</span>
        <span className="text-text-muted/60">•</span>
        <span>{article.reading_time_minutes || 5} min read</span>
      </div>
    </Link>
  );
}
