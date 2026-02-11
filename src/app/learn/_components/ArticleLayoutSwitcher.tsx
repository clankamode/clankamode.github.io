'use client';

import { useChromeMode } from '@/hooks/useChromeMode';
import SessionReaderShell from '@/components/session/SessionReaderShell';
import SessionCommitControl from '@/components/session/SessionCommitControl';
import SessionChecklist from '@/components/session/SessionChecklist';
import MobileSidebarToggle from './MobileSidebarToggle';

interface ArticleLayoutSwitcherProps {
    articleContent: React.ReactNode;
    pillarSidebar: React.ReactNode;
    tableOfContents: React.ReactNode;
    breadcrumbs: React.ReactNode;
    standardFooter: React.ReactNode;

    pillarName: string; // for mobile toggle
}

export default function ArticleLayoutSwitcher({
    articleContent,
    pillarSidebar,
    tableOfContents,
    breadcrumbs,
    standardFooter,
    pillarName
}: ArticleLayoutSwitcherProps) {
    const mode = useChromeMode();
    const isExecution = mode === 'execute';

    if (isExecution) {
        return (
            <SessionReaderShell
                leftDrawerContent={<SessionChecklist />}
                tableOfContents={tableOfContents} // Right drawer remains TOC ("On this page")
            >
                {/* Session Layout: Content + Commit Control */}
                {articleContent}

                <SessionCommitControl />
            </SessionReaderShell>
        );
    }

    return (
        <div
            className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8"
            data-current-mode={mode}
        >
            <div className="grid gap-16 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
                {/* Left Sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-28">
                        {pillarSidebar}
                    </div>
                </aside>

                {/* Center Content */}
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

                {/* Right Sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-28">
                        {tableOfContents}
                    </div>
                </aside>
            </div>
        </div>
    );
}
