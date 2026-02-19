import Link from 'next/link';
import type { ProgressSummary, BookmarkItem } from '@/lib/progress';

interface TodaysPlanProps {
    summary: ProgressSummary;
    bookmarks: BookmarkItem[];
}

interface PlanRow {
    type: 'learn' | 'practice' | 'review';
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
    cta: string;
}

export default function TodaysPlan({ summary, bookmarks }: TodaysPlanProps) {
    const rows = buildPlanRows(summary, bookmarks);

    if (rows.length === 0) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-6 md:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-6">
                Today
            </h2>
            <div className="space-y-4">
                {rows.map((row) => (
                    <div
                        key={row.type}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-workbench border border-border-subtle hover:border-border-interactive transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-interactive flex items-center justify-center text-text-muted">
                                {row.icon}
                            </div>
                            <div>
                                <p className="font-medium text-text-primary">{row.title}</p>
                                <p className="text-sm text-text-secondary">{row.subtitle}</p>
                            </div>
                        </div>
                        <Link
                            href={row.href}
                            className="flex-shrink-0 rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-interactive hover:bg-surface-interactive"
                        >
                            {row.cta}
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}

function buildPlanRows(summary: ProgressSummary, bookmarks: BookmarkItem[]): PlanRow[] {
    const rows: PlanRow[] = [];

    if (summary.nextArticle) {
        rows.push({
            type: 'learn',
            icon: <BookIcon />,
            title: summary.nextArticle.title,
            subtitle: `${summary.nextArticle.readingTimeMinutes || 5} min read`,
            href: `/learn/${summary.nextArticle.pillarSlug}/${summary.nextArticle.articleSlug}`,
            cta: 'Start',
        });
    } else if (summary.totalArticles > 0) {
        rows.push({
            type: 'learn',
            icon: <BookIcon />,
            title: 'Explore the library',
            subtitle: 'Find your next lesson',
            href: '/learn',
            cta: 'Browse',
        });
    }

    rows.push({
        type: 'practice',
        icon: <CodeIcon />,
        title: 'Practice problems',
        subtitle: 'Peralta 75 curated set',
        href: '/peralta75',
        cta: 'Try',
    });

    if (bookmarks.length > 0) {
        const lastBookmark = bookmarks[0];
        rows.push({
            type: 'review',
            icon: <BookmarkIcon />,
            title: lastBookmark.title,
            subtitle: 'Saved for review',
            href: `/learn/${lastBookmark.pillarSlug}/${lastBookmark.articleSlug}`,
            cta: 'Review',
        });
    }

    return rows.slice(0, 3);
}

function BookIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
    );
}

function CodeIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
    );
}

function BookmarkIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
    );
}
