export type ThumbnailActivityType =
  | 'STATUS_CHANGE'
  | 'THUMBNAIL_UPLOADED'
  | 'THUMBNAIL_UPDATED'
  | 'COMMENT'

export interface ThumbnailActivity {
  id: string
  thumbnail_job_id: string
  type: ThumbnailActivityType
  message: string
  actor?: string | null
  created_at?: string
}
