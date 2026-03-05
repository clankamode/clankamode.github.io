import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArticleDirectionGlyph, ArticleNodeGlyph } from '@/components/ui/LearnGlyphs';

interface ArticleNavItem {
  label: string;
  title: string;
  href: string;
  topicName?: string;
}

interface ArticleNavProps {
  previous?: ArticleNavItem | null;
  next?: ArticleNavItem | null;
  className?: string;
}

export default function ArticleNav({ previous, next, className }: ArticleNavProps) {
  if (!previous && !next) {
    return null;
  }

  if (next) {
    return (
      <div className={cn('space-y-3', className)}>
        <Link
          href={next.href}
          className="frame group relative flex flex-col gap-3 border-brand-green/50 bg-[linear-gradient(135deg,rgba(44,187,93,0.2),rgba(44,187,93,0.04)_62%)] p-5 transition-all duration-300 hover:border-brand-green/80 hover:shadow-[0_18px_46px_rgba(0,0,0,0.45)]"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-brand-green/75">Up Next</p>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary">
            {next.title}
          </h3>
          {next.topicName && (
            <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
              <ArticleNodeGlyph level={3} className="h-3 w-3 text-brand-green/85" />
              <span>{next.topicName}</span>
            </p>
          )}
          <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-text-primary transition-colors group-hover:text-brand-green">
            <span>Start next article</span>
            <ArticleDirectionGlyph direction="right" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </Link>

        {previous && (
          <Link
            href={previous.href}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArticleDirectionGlyph direction="left" className="h-3.5 w-3.5" />
            <span>Previous article:</span>
            <span className="font-medium">{previous.title}</span>
          </Link>
        )}
      </div>
    );
  }

  if (!previous) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Link
        href={previous.href}
        className="frame group relative flex flex-col gap-3 border-border-subtle/70 bg-surface-ambient/45 p-5 text-text-secondary transition-all duration-300 hover:border-border-subtle/90"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Previous</p>
        <h3 className="text-lg font-semibold tracking-tight text-text-secondary">{previous.title}</h3>
        {previous.topicName && (
          <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <ArticleNodeGlyph level={3} className="h-3 w-3 text-text-muted" />
            <span>{previous.topicName}</span>
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-2 text-sm text-text-secondary">
          <ArticleDirectionGlyph direction="left" className="h-3.5 w-3.5" />
          <span>Review previous article</span>
        </span>
      </Link>
    </div>
  );
}
