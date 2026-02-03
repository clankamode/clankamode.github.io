'use client';

import { ThumbnailJobStatus } from "@/types/ThumbnailJob";
import { FAVORITES_VIEW, type ThumbnailView } from "@/app/thumbnails/types";

interface EmptyStateProps {
    status: ThumbnailView;
    hasFilters: boolean;
    onCreateClick?: () => void;
    onClearFilters?: () => void;
    onNavigate?: (view: ThumbnailView) => void;
}

const EMPTY_STATE_CONFIG = {
    [ThumbnailJobStatus.TODO]: {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: "No videos queued",
        subtitle: "Add a new video to get started with thumbnail creation",
        ctaLabel: "Create Job",
        showCta: true,
        navigateTo: null as ThumbnailView | null,
        navigateLabel: "",
    },
    [ThumbnailJobStatus.IN_REVIEW]: {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
        title: "Nothing to review",
        subtitle: "Submit thumbnails from To Do to see them here",
        ctaLabel: "",
        showCta: false,
        navigateTo: ThumbnailJobStatus.TODO as ThumbnailView,
        navigateLabel: "Go to To Do",
    },
    [ThumbnailJobStatus.COMPLETED]: {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: "No completed thumbnails",
        subtitle: "Approved thumbnails will appear here",
        ctaLabel: "",
        showCta: false,
        navigateTo: ThumbnailJobStatus.IN_REVIEW as ThumbnailView,
        navigateLabel: "View In Review",
    },
    [FAVORITES_VIEW]: {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polygon strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        title: "No favorites yet",
        subtitle: "Star any thumbnail to save it here",
        ctaLabel: "",
        showCta: false,
        navigateTo: null as ThumbnailView | null,
        navigateLabel: "",
    },
};

export default function EmptyState({
    status,
    hasFilters,
    onCreateClick,
    onClearFilters,
    onNavigate,
}: EmptyStateProps) {
    if (hasFilters) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-surface-workbench rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                    No matching thumbnails
                </h3>
                <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filters
                </p>
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-surface-interactive hover:bg-surface-dense border border-border-subtle rounded-lg transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        );
    }

    const config = EMPTY_STATE_CONFIG[status];

    return (
        <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-workbench rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                {config.icon}
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">
                {config.title}
            </h3>
            <p className="text-muted-foreground mb-6">
                {config.subtitle}
            </p>
            <div className="flex items-center justify-center gap-3">
                {config.showCta && onCreateClick && (
                    <button
                        onClick={onCreateClick}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-black bg-brand-green hover:bg-brand-green/90 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {config.ctaLabel}
                    </button>
                )}
                {config.navigateTo && onNavigate && (
                    <button
                        onClick={() => onNavigate(config.navigateTo!)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground bg-surface-interactive hover:bg-surface-dense border border-border-subtle rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {config.navigateLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

