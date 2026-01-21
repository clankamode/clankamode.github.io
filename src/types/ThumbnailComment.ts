export interface CommentAttachment {
  url: string;
  name: string;
  type: 'image';
}

export interface ThumbnailComment {
  id: string;
  thumbnail_job_id: string;
  text: string;
  attachments: CommentAttachment[];
  author_name: string;
  author_email?: string;
  author_image?: string;
  created_at: string;
}
