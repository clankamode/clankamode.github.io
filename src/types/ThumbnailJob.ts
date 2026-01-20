export enum ThumbnailJobStatus {
  TODO = 'TODO',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED'
}

export enum ThumbnailSuggestionStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export type ThumbnailJob = {
    id: string;
    video_title: string;
    video_url: string;
    status: ThumbnailJobStatus;
    thumbnail?: string;
    suggested_thumbnails?: string[];
    thumbnail_suggestion_status?: ThumbnailSuggestionStatus;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Thumbnail {
  id: string
  editUrl: string
  videoTitle: string
  thumbnailUrl?: string
  notes?: string
  status: ThumbnailJobStatus
  updatedAt?: string
}
