'use client';

export default function ThumbnailCardSkeleton() {
    return (
        <div className="frame bg-surface-workbench overflow-hidden animate-pulse">
            <div className="aspect-video bg-surface-interactive" />
            <div className="p-4 flex flex-col gap-3">
                <div className="h-5 bg-surface-interactive rounded w-4/5" />
                <div className="h-5 bg-surface-interactive rounded w-3/5" />
                <div className="h-4 bg-surface-interactive rounded w-full opacity-60" />
                <div className="flex items-center justify-between mt-2">
                    <div className="h-4 bg-surface-interactive rounded w-20" />
                    <div className="h-8 bg-surface-interactive rounded w-16" />
                </div>
            </div>
        </div>
    );
}

export function ThumbnailGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ThumbnailCardSkeleton key={i} />
            ))}
        </div>
    );
}
