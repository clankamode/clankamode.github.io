import type React from "react"
import { useState, useEffect, useMemo } from "react"
import ThumbnailCard from "./ThumbnailCard"
import SortFilterBar from "./SortFilterBar"
import { ThumbnailGridSkeleton } from "./ThumbnailCardSkeleton"
import EmptyState from "./EmptyState"
import BulkActionBar from "./BulkActionBar"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import { Thumbnail } from "@/types/ThumbnailJob"
import { FAVORITES_VIEW, type ThumbnailView, type SortOption, type FilterOption } from "@/app/thumbnails/types"

type ThumbnailOverviewProps = {
  thumbnails: Thumbnail[]
  status: ThumbnailView
  isLoading: boolean
  error: string | null
  onThumbnailsChange: () => void
  onViewClick?: (thumbnailId: string) => void
  onToggleFavorite?: (thumbnailId: string) => void
  onDelete?: (thumbnailId: string) => void
  isAdmin?: boolean
  selectedIds?: Set<string>
  onSelect?: (thumbnailId: string, event: React.MouseEvent) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  onCreateClick?: () => void
  onNavigate?: (view: ThumbnailView) => void
  onBulkStatusChange?: (status: ThumbnailJobStatus) => void
  onBulkFavorite?: (favorite: boolean) => void
  onBulkDelete?: () => void
}

export default function ThumbnailOverview({
  thumbnails,
  status,
  isLoading,
  error,
  onThumbnailsChange,
  onViewClick,
  onToggleFavorite,
  onDelete,
  isAdmin,
  selectedIds = new Set(),
  onSelect,
  onSelectAll,
  onClearSelection,
  onCreateClick,
  onNavigate,
  onBulkStatusChange,
  onBulkFavorite,
  onBulkDelete,
}: ThumbnailOverviewProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setActiveFilters(new Set())
    setSearchQuery("")
  }, [status])

  const handleFilterToggle = (filter: FilterOption) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
  }

  const filteredThumbnails = useMemo(() => {
    let result = thumbnails.filter((t) =>
      status === FAVORITES_VIEW ? t.favorite : t.status === status
    )

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter((t) =>
        t.videoTitle.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query)
      )
    }

    if (activeFilters.has("has-thumbnail")) {
      result = result.filter((t) => !!t.thumbnailUrl)
    }
    if (activeFilters.has("missing-thumbnail")) {
      result = result.filter((t) => !t.thumbnailUrl)
    }
    if (activeFilters.has("favorited")) {
      result = result.filter((t) => t.favorite)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        case "oldest":
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime()
        case "title-asc":
          return a.videoTitle.localeCompare(b.videoTitle)
        case "title-desc":
          return b.videoTitle.localeCompare(a.videoTitle)
        default:
          return 0
      }
    })

    return result
  }, [thumbnails, status, debouncedSearch, activeFilters, sortBy])

  const statusLabels = {
    [ThumbnailJobStatus.TODO]: "To Do",
    [ThumbnailJobStatus.IN_REVIEW]: "In Review",
    [ThumbnailJobStatus.COMPLETED]: "Completed",
    [FAVORITES_VIEW]: "Favorites",
  }

  const handleStatusChange = async (thumbnailId: string, newStatus: ThumbnailJobStatus) => {
    try {
      const response = await fetch(`/api/thumbnail_job/${thumbnailId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update thumbnail status')
      }

      onThumbnailsChange();
    } catch (error) {
      console.error('Error updating thumbnail status:', error);
    }
  }

  const handleSelectAllFiltered = () => {
    if (selectedIds.size > 0 && onClearSelection) {
      onClearSelection()
    } else if (onSelectAll) {
      onSelectAll()
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <div className="h-9 w-32 bg-surface-interactive rounded animate-pulse" />
        </div>
        <ThumbnailGridSkeleton count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-foreground">Failed to load thumbnails</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-brand-green text-black rounded-lg hover:bg-brand-green/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-foreground">{statusLabels[status]}</h2>
      </div>

      {selectedIds.size > 0 && onBulkStatusChange && onBulkFavorite && onBulkDelete && onClearSelection ? (
        <BulkActionBar
          selectedCount={selectedIds.size}
          currentView={status}
          onStatusChange={onBulkStatusChange}
          onFavorite={onBulkFavorite}
          onDelete={onBulkDelete}
          onClear={onClearSelection}
        />
      ) : (
        <SortFilterBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeFilters={activeFilters}
          onFilterToggle={handleFilterToggle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={filteredThumbnails.length}
          onSelectAll={handleSelectAllFiltered}
          hasSelection={selectedIds.size > 0}
        />
      )}

      {filteredThumbnails.length === 0 ? (
        <EmptyState
          status={status}
          hasFilters={debouncedSearch.length > 0 || activeFilters.size > 0}
          onCreateClick={onCreateClick}
          onClearFilters={() => {
            setSearchQuery('')
            setActiveFilters(new Set())
          }}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThumbnails.map((thumbnail: Thumbnail) => (
            <ThumbnailCard
              key={thumbnail.id}
              thumbnail={thumbnail}
              status={thumbnail.status}
              onStatusChange={handleStatusChange}
              onViewClick={onViewClick}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              isAdmin={isAdmin}
              isSelected={selectedIds.has(thumbnail.id)}
              onSelect={onSelect}
              hasSelection={selectedIds.size > 0}
            />
          ))}

          {status === ThumbnailJobStatus.TODO && filteredThumbnails.length < 6 && onCreateClick && (
            <button
              onClick={onCreateClick}
              className="frame bg-transparent border-2 border-dashed border-border-subtle hover:border-brand-green hover:bg-surface-workbench/50 overflow-hidden group transition-all duration-200 flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-12 h-12 rounded-full bg-surface-workbench flex items-center justify-center mb-3 group-hover:bg-brand-green/10 transition-colors">
                <svg className="w-6 h-6 text-muted-foreground group-hover:text-brand-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground font-medium transition-colors">Create Job</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
