'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { ProgressSummary } from '@/lib/progress';

interface ContinueCardProps {
    summary: ProgressSummary;
}

type CardState = 'nice-work' | 'continue' | 'start';

function getCardState(summary: ProgressSummary): CardState {
    const hasRecentCompletion = summary.recentActivity.length > 0 &&
        isWithinHours(summary.recentActivity[0]?.completedAt, 12);

    const hasNextArticle = summary.nextArticle !== null;

    if (hasRecentCompletion && hasNextArticle) {
        return 'nice-work';
    }
    if (hasNextArticle) {
        return 'continue';
    }
    return 'start';
}

function isWithinHours(dateString: string | undefined, hours: number): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return diffMs < hours * 60 * 60 * 1000;
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

export default function ContinueCard({ summary }: ContinueCardProps) {
    const state = getCardState(summary);
    const { nextArticle, recentActivity } = summary;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isInputFocused()) {
                const primaryCta = document.querySelector<HTMLAnchorElement>('[data-cta="primary"]');
                primaryCta?.click();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (state === 'start') {
        return (
            <section className="rounded-2xl border border-border-subtle bg-surface-1 p-8 md:p-10">
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Start</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold text-text-primary">
                    Pick your first track
                </h2>
                <p className="mt-3 text-text-secondary">
                    Choose a pillar to begin your learning journey.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <PillarPill href="/learn/dsa" label="DSA" />
                    <PillarPill href="/learn/system-design" label="System Design" />
                    <PillarPill href="/learn/job-hunt" label="Job Hunt" />
                </div>
                <Link
                    href="/learn"
                    data-cta="primary"
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-base font-semibold text-black transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                    Begin
                </Link>
            </section>
        );
    }

    if (state === 'nice-work') {
        const lastCompleted = recentActivity[0];
        return (
            <section className="rounded-2xl border border-border-subtle bg-surface-1 p-8 md:p-10">
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Nice work</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold text-text-primary">
                    Ready for the next step?
                </h2>
                <p className="mt-3 text-text-secondary">
                    You completed <span className="text-text-primary font-medium">{lastCompleted?.title}</span> {formatRelativeTime(lastCompleted?.completedAt || '')}.
                </p>
                {nextArticle && (
                    <div className="mt-6 p-4 rounded-xl bg-surface-workbench border border-border-subtle">
                        <p className="text-sm text-text-muted">Up next</p>
                        <p className="mt-1 text-lg font-medium text-text-primary">{nextArticle.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                            {nextArticle.pillarSlug.replace(/-/g, ' ')} • {nextArticle.readingTimeMinutes || 5} min
                        </p>
                    </div>
                )}
                <Link
                    href={nextArticle ? `/learn/${nextArticle.pillarSlug}/${nextArticle.articleSlug}` : '/learn'}
                    data-cta="primary"
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-base font-semibold text-black transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                    Start next
                </Link>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Continue</p>
            {nextArticle && (
                <>
                    <h2 className="mt-4 text-3xl md:text-4xl font-bold text-text-primary">
                        {nextArticle.title}
                    </h2>
                    <p className="mt-3 text-text-secondary">
                        {nextArticle.pillarSlug.replace(/-/g, ' ')} • {nextArticle.readingTimeMinutes || 5} min
                        {recentActivity.length > 0 && (
                            <> • Last session {formatRelativeTime(recentActivity[0]?.completedAt || '')}</>
                        )}
                    </p>
                    {summary.percent > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-text-muted">Overall progress</span>
                                <span className="text-text-secondary">{summary.percent}%</span>
                            </div>
                            <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent-primary rounded-full transition-all"
                                    style={{ width: `${summary.percent}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <Link
                        href={`/learn/${nextArticle.pillarSlug}/${nextArticle.articleSlug}`}
                        data-cta="primary"
                        className="mt-8 inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-base font-semibold text-black transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background"
                    >
                        Resume
                    </Link>
                </>
            )}
        </section>
    );
}

function PillarPill({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="rounded-full border border-border-subtle bg-surface-workbench px-5 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-interactive hover:bg-surface-interactive"
        >
            {label}
        </Link>
    );
}

function isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;
}
