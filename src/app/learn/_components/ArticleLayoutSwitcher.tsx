'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeMode } from '@/hooks/useChromeMode';
import SessionReaderShell from '@/components/session/SessionReaderShell';
import SessionCommitControl from '@/components/session/SessionCommitControl';
import MobileSidebarToggle from './MobileSidebarToggle';

interface ArticleLayoutSwitcherProps {
    articleContent: React.ReactNode;
    pillarSidebar: React.ReactNode;
    tableOfContents: React.ReactNode;
    breadcrumbs: React.ReactNode;
    standardFooter: React.ReactNode;

    pillarName: string;
}

export default function ArticleLayoutSwitcher({
    articleContent,
    pillarSidebar,
    tableOfContents,
    breadcrumbs,
    standardFooter,
    pillarName
}: ArticleLayoutSwitcherProps) {
    const router = useRouter();
    const mode = useChromeMode();
    const isExecution = mode === 'execute';
    const isExit = mode === 'exit';

    useEffect(() => {
        if (isExit) {
            router.replace('/home');
        }
    }, [isExit, router]);

    if (isExecution) {
        return (
            <SessionReaderShell tableOfContents={tableOfContents}>
                {articleContent}

                <SessionCommitControl />
            </SessionReaderShell>
        );
    }

    if (isExit) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex items-center gap-3 text-text-secondary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-border-interactive" />
                    <p className="text-xs font-medium uppercase tracking-[0.16em]">
                        Locking progress...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8"
            data-current-mode={mode}
        >
            <div className="grid gap-16 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
                <aside className="hidden lg:block">
                    <div className="sticky top-28">
                        {pillarSidebar}
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        {breadcrumbs}
                        <MobileSidebarToggle title={pillarName}>
                            {pillarSidebar}
                        </MobileSidebarToggle>
                    </div>

                    {articleContent}

                    {standardFooter}
                </div>

                <aside className="hidden lg:block">
                    <div className="sticky top-28">
                        {tableOfContents}
                    </div>
                </aside>
            </div>
        </div>
    );
}
