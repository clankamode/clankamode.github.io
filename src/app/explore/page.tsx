'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

export default function ExplorePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user);
    const showSessionMode = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user);
    const sessionFeaturesEnabled = showProgress && showSessionMode;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                router.push('/home');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    useEffect(() => {
        if (status !== 'loading' && !sessionFeaturesEnabled) {
            router.replace('/learn');
        }
    }, [router, sessionFeaturesEnabled, status]);

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-2xl font-bold text-text-primary">Explore</h1>
                    <Link
                        href="/home"
                        className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                    >
                        ← Back to session
                    </Link>
                </div>

                {/* Search placeholder */}
                <div className="relative mb-12">
                    <input
                        type="text"
                        placeholder="Search lessons, topics, videos..."
                        className="w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.02] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-accent-primary/20"
                        autoFocus
                    />
                    <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-white/5 font-mono text-xs text-text-muted">
                        ESC
                    </kbd>
                </div>

                {/* Quick categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <CategoryTile href="/learn" label="Learn" description="Structured curriculum" />
                    <CategoryTile href="/peralta75" label="Practice" description="Peralta 75 problems" />
                    <CategoryTile href="/videos" label="Videos" description="YouTube content" />
                    {showProgress && (
                        <CategoryTile href="/learn/progress" label="Bookmarks" description="Saved articles" />
                    )}
                </div>

                {/* Tracks */}
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                        Tracks
                    </h2>
                    <div className="space-y-2">
                        <TrackRow href="/learn/dsa" name="Data Structures & Algorithms" />
                        <TrackRow href="/learn/system-design" name="System Design" />
                        <TrackRow href="/learn/interviews" name="Interview Prep" />
                    </div>
                </section>
            </div>
        </main>
    );
}

function CategoryTile({ href, label, description }: { href: string; label: string; description: string }) {
    return (
        <Link
            href={href}
            className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all"
        >
            <p className="font-medium text-text-primary">{label}</p>
            <p className="text-sm text-text-muted mt-1">{description}</p>
        </Link>
    );
}

function TrackRow({ href, name }: { href: string; name: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors group"
        >
            <span className="text-text-primary">{name}</span>
            <span className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </Link>
    );
}
