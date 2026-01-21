import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-text-muted transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-text-primary' : 'text-text-muted'}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-text-muted/60">→</span>}
          </span>
        );
      })}
    </nav>
  );
}
