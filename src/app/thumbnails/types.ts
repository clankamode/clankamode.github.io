import { ThumbnailJobStatus } from "@/types/ThumbnailJob"

export const FAVORITES_VIEW = "FAVORITES" as const

export type ThumbnailView = ThumbnailJobStatus | typeof FAVORITES_VIEW

export type SortOption = "newest" | "oldest" | "title-asc" | "title-desc"

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title-asc", label: "Title A-Z" },
    { value: "title-desc", label: "Title Z-A" },
]

export type FilterOption = "has-thumbnail" | "missing-thumbnail" | "favorited"

export const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
    { value: "has-thumbnail", label: "Has Thumbnail" },
    { value: "missing-thumbnail", label: "Missing Thumbnail" },
    { value: "favorited", label: "Favorited" },
]
