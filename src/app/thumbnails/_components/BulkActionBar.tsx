'use client';

import { ThumbnailJobStatus } from "@/types/ThumbnailJob";
import { FAVORITES_VIEW, type ThumbnailView } from "@/app/thumbnails/types";

interface BulkActionBarProps {
    selectedCount: number;
    currentView: ThumbnailView;
    onStatusChange: (status: ThumbnailJobStatus) => void;
    onFavorite: (favorite: boolean) => void;
    onDelete: () => void;
    onClear: () => void;
}

export default function BulkActionBar({
    selectedCount,
    currentView,
    onStatusChange,
    onFavorite,
    onDelete,
    onClear,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    const showSubmit = currentView === ThumbnailJobStatus.TODO;
    const showApprove = currentView === ThumbnailJobStatus.IN_REVIEW;
    const showReopen = currentView === ThumbnailJobStatus.COMPLETED || currentView === FAVORITES_VIEW;

    return (
        <div className="flex items-center gap-2 mb-4 p-2 bg-surface-interactive/30 border border-brand-green/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 rounded text-brand-green font-medium mr-auto">
                <span className="text-sm">{selectedCount} selected</span>
            </div>

            {showSubmit && (
                <button
                    onClick={() => onStatusChange(ThumbnailJobStatus.IN_REVIEW)}
                    className="px-3 py-1.5 text-sm font-medium text-foreground bg-surface-interactive hover:bg-surface-dense rounded-lg border border-border-subtle transition-colors"
                >
                    Submit
                </button>
            )}

            {showApprove && (
                <button
                    onClick={() => onStatusChange(ThumbnailJobStatus.COMPLETED)}
                    className="px-3 py-1.5 text-sm font-medium text-black bg-brand-green hover:bg-brand-green/90 rounded-lg transition-colors"
                >
                    Approve
                </button>
            )}

            {showReopen && (
                <button
                    onClick={() => onStatusChange(ThumbnailJobStatus.TODO)}
                    className="px-3 py-1.5 text-sm font-medium text-foreground bg-surface-interactive hover:bg-surface-dense rounded-lg border border-border-subtle transition-colors"
                >
                    Reopen
                </button>
            )}

            <div className="h-4 w-px bg-border-subtle mx-1" />

            <button
                onClick={() => onFavorite(true)}
                className="p-1.5 text-muted-foreground hover:text-yellow-300 hover:bg-white/5 rounded-lg transition-colors"
                title="Add to favorites"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            </button>

            <button
                onClick={onDelete}
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete selected"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
            </button>

            <button
                onClick={onClear}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors ml-1"
                title="Clear selection"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
