'use client';

import { useState, useEffect, useRef } from 'react';
import {
    type SortOption,
    type FilterOption,
    SORT_OPTIONS,
    FILTER_OPTIONS,
} from '@/app/thumbnails/types';

interface SortFilterBarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    activeFilters: Set<FilterOption>;
    onFilterToggle: (filter: FilterOption) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    totalCount: number;
    onSelectAll?: () => void;
    hasSelection?: boolean;
}

export default function SortFilterBar({
    sortBy,
    onSortChange,
    activeFilters,
    onFilterToggle,
    searchQuery,
    onSearchChange,
    totalCount,
    onSelectAll,
    hasSelection,
}: SortFilterBarProps) {
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setSortOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sort';

    return (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search thumbnails..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-interactive border border-border-subtle rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-colors"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="relative" ref={sortRef}>
                <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-interactive border border-border-subtle rounded-lg text-foreground hover:bg-surface-dense transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span>{currentSortLabel}</span>
                    <svg className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {sortOpen && (
                    <div className="absolute top-full mt-1 left-0 z-20 bg-surface-workbench border border-border-subtle rounded-lg shadow-lg py-1 min-w-[160px]">
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onSortChange(option.value);
                                    setSortOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm transition-colors ${sortBy === option.value
                                        ? 'text-brand-green bg-brand-green/10'
                                        : 'text-foreground hover:bg-surface-interactive'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative" ref={filterRef}>
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${activeFilters.size > 0
                            ? 'bg-brand-green/10 border-brand-green text-brand-green'
                            : 'bg-surface-interactive border-border-subtle text-foreground hover:bg-surface-dense'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filter{activeFilters.size > 0 ? ` (${activeFilters.size})` : ''}</span>
                    <svg className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {filterOpen && (
                    <div className="absolute top-full mt-1 left-0 z-20 bg-surface-workbench border border-border-subtle rounded-lg shadow-lg py-1 min-w-[180px]">
                        {FILTER_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onFilterToggle(option.value)}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${activeFilters.has(option.value)
                                        ? 'text-brand-green bg-brand-green/10'
                                        : 'text-foreground hover:bg-surface-interactive'
                                    }`}
                            >
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${activeFilters.has(option.value)
                                        ? 'bg-brand-green border-brand-green'
                                        : 'border-border-subtle'
                                    }`}>
                                    {activeFilters.has(option.value) && (
                                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </span>
                                {option.label}
                            </button>
                        ))}
                        {activeFilters.size > 0 && (
                            <>
                                <div className="border-t border-border-subtle my-1" />
                                <button
                                    onClick={() => {
                                        activeFilters.forEach((f) => onFilterToggle(f));
                                        setFilterOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive"
                                >
                                    Clear filters
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {onSelectAll && totalCount > 0 && (
                <button
                    onClick={onSelectAll}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive border border-border-subtle rounded-lg transition-colors"
                >
                    {hasSelection ? 'Deselect All' : 'Select All'}
                </button>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
        </div>
    );
}
