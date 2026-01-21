import { ThumbnailJobStatus } from "@/types/ThumbnailJob"

export const FAVORITES_VIEW = "FAVORITES" as const

export type ThumbnailView = ThumbnailJobStatus | typeof FAVORITES_VIEW
