export enum ThumbnailJobStatus {
  TODO = 'TODO',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED'
}

export type ThumbnailJob = {
    id: string;
    video_title: string;
    video_url: string;
    status: ThumbnailJobStatus;
    thumbnail?: string;
    notes?: string;
    created_at?: string;
}