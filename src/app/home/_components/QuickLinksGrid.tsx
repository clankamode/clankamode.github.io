'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

const BASE_LINKS = [
    {
        icon: <BookIcon />,
        label: 'Learn',
        hint: 'Structured curriculum',
        href: '/learn',
    },
    {
        icon: <CodeIcon />,
        label: 'Practice',
        hint: 'Peralta 75 problems',
        href: '/peralta75',
    },
    {
        icon: <VideoIcon />,
        label: 'Videos',
        hint: 'YouTube content',
        href: '/videos',
    },
];

export default function QuickLinksGrid() {
    const { data: session } = useSession();
    const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user);
    const links = showProgress
        ? [
            ...BASE_LINKS,
            {
                icon: <BookmarkIcon />,
                label: 'Bookmarks',
                hint: 'Saved articles',
                href: '/learn/progress',
            },
        ]
        : BASE_LINKS;

    return (
        <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {links.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="group p-5 rounded-xl border border-border-subtle bg-surface-workbench hover:border-border-interactive hover:bg-surface-interactive transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-surface-interactive flex items-center justify-center text-text-muted group-hover:text-text-secondary transition-colors">
                            {link.icon}
                        </div>
                        <p className="mt-4 font-medium text-text-primary">{link.label}</p>
                        <p className="mt-1 text-sm text-text-muted">{link.hint}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
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

function VideoIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
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
