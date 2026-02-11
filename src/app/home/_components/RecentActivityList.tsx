import Link from 'next/link';
import type { RecentActivityItem } from '@/lib/progress';

interface RecentActivityListProps {
    recentActivity: RecentActivityItem[];
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
}

export default function RecentActivityList({ recentActivity }: RecentActivityListProps) {
    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-6">
                Recent
            </h2>
            {recentActivity.length === 0 ? (
                <p className="text-text-secondary text-sm">
                    Your recent activity will show up here.
                </p>
            ) : (
                <ul className="space-y-3">
                    {recentActivity.slice(0, 5).map((item) => (
                        <li key={item.articleId}>
                            <Link
                                href={`/learn/${item.pillarSlug}/${item.articleSlug}`}
                                className="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-primary/50" />
                                    <span className="text-text-primary truncate">{item.title}</span>
                                </div>
                                <span className="flex-shrink-0 text-sm text-text-muted ml-4">
                                    {formatRelativeTime(item.completedAt)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
