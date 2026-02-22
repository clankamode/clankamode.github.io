export default function ArticleLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive/28 bg-background/92 h-10" />
            <div className="mx-auto w-full max-w-[744px] px-5 sm:px-6 pt-24 pb-20">
                <div className="animate-pulse space-y-8">
                    <div className="space-y-3">
                        <div className="h-3 w-16 rounded bg-surface-interactive" />
                        <div className="h-10 w-3/4 rounded bg-surface-interactive" />
                        <div className="h-4 w-1/3 rounded bg-surface-interactive" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="h-4 w-full rounded bg-surface-interactive" />
                        <div className="h-4 w-5/6 rounded bg-surface-interactive" />
                        <div className="h-4 w-4/5 rounded bg-surface-interactive" />
                        <div className="h-4 w-full rounded bg-surface-interactive" />
                        <div className="h-4 w-2/3 rounded bg-surface-interactive" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="h-6 w-1/2 rounded bg-surface-interactive" />
                        <div className="h-4 w-full rounded bg-surface-interactive" />
                        <div className="h-4 w-5/6 rounded bg-surface-interactive" />
                        <div className="h-4 w-3/4 rounded bg-surface-interactive" />
                    </div>
                </div>
            </div>
        </div>
    );
}
