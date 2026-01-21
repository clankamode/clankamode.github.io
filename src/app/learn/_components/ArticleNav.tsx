import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ArticleNavItem {
  label: string;
  title: string;
  href: string;
  topicName?: string;
}

interface ArticleNavProps {
  previous?: ArticleNavItem | null;
  next?: ArticleNavItem | null;
}

export default function ArticleNav({ previous, next }: ArticleNavProps) {
  if (!previous && !next) {
    return null;
  }

  const renderItem = (item: ArticleNavItem, align: 'left' | 'right') => (
    <Link
      href={item.href}
      className={cn(
        'frame group flex h-full flex-col gap-3 p-5 transition-all duration-300',
        align === 'right' && 'text-right'
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
        {item.label}
      </p>
      <h3 className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-white">
        {item.title}
      </h3>
      {item.topicName && (
        <p className="text-xs text-text-muted">{item.topicName}</p>
      )}
      <span className="mt-auto text-sm text-text-primary">
        {align === 'left' ? '← Continue' : 'Next →'}
      </span>
    </Link>
  );

  return (
    <div className="mt-12 grid gap-4 md:grid-cols-2">
      {previous ? renderItem(previous, 'left') : <div />}
      {next ? renderItem(next, 'right') : <div />}
    </div>
  );
}
