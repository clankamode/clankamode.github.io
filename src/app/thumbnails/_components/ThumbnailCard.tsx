'use client';

import type React from "react"
import { Thumbnail } from "@/types/ThumbnailJob"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import { useState } from "react"


interface ThumbnailCardProps {
  thumbnail: Thumbnail
  status: ThumbnailJobStatus
  onStatusChange?: (thumbnailId: string, newStatus: ThumbnailJobStatus) => void
  onViewClick?: (thumbnailId: string) => void
  onToggleFavorite?: (thumbnailId: string) => void
  onDelete?: (thumbnailId: string) => void
  isAdmin?: boolean
}

export default function ThumbnailCard({ thumbnail, status, onStatusChange, onViewClick, onToggleFavorite, onDelete, isAdmin }: ThumbnailCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(thumbnail.thumbnailUrl || '')
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${thumbnail.videoTitle || ''}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading thumbnail:', error)
      alert('Failed to download thumbnail')
    }
  }

  return (
    <div key={thumbnail.id} className="frame bg-surface-workbench overflow-hidden">
      <div className="aspect-video bg-surface-interactive relative">
        {thumbnail.thumbnailUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail.thumbnailUrl}
            alt={thumbnail.videoTitle}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{thumbnail.videoTitle}</h3>


        {thumbnail.notes && (
          <div className="mb-3">
            <p className="text-base text-muted-foreground line-clamp-3">{thumbnail.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onViewClick?.(thumbnail.id)}
              className="text-muted-foreground hover:text-foreground text-base font-medium"
            >
              View Video
            </button>
            {isAdmin && (
              <button
                onClick={() => onToggleFavorite?.(thumbnail.id)}
                className={`text-sm font-medium p-1 rounded-full transition-colors ${thumbnail.favorite ? "text-yellow-300 hover:text-yellow-200" : "text-muted-foreground hover:text-foreground"}`}
                title={thumbnail.favorite ? "Remove favorite" : "Add favorite"}
                aria-pressed={thumbnail.favorite}
                aria-label={thumbnail.favorite ? "Remove favorite" : "Add favorite"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={thumbnail.favorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
            {thumbnail.thumbnailUrl && (
              <button
                onClick={handleDownload}
                className="text-muted-foreground hover:text-foreground text-base font-medium p-1 rounded-full hover:bg-white/5 transition-colors"
                title="Download Thumbnail"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onDelete?.(thumbnail.id)}
              className="text-red-400 hover:text-red-300 text-sm font-medium p-1 rounded-full hover:bg-red-400/10 transition-colors"
              title="Delete Thumbnail"
              aria-label="Delete Thumbnail"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
          </div>
          {status === ThumbnailJobStatus.TODO && onStatusChange && thumbnail.thumbnailUrl && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.IN_REVIEW)}
              className="bg-surface-interactive hover:bg-surface-dense text-foreground px-4 py-1 rounded-md text-base font-medium border border-border-subtle"
            >
              Move to Review
            </button>
          )}
          {status === ThumbnailJobStatus.IN_REVIEW && onStatusChange && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.COMPLETED)}
              className="bg-surface-interactive hover:bg-surface-dense text-foreground px-4 py-1 rounded-md text-base font-medium border border-border-subtle"
            >
              Complete
            </button>
          )}
          {status === ThumbnailJobStatus.COMPLETED && onStatusChange && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.TODO)}
              className="bg-surface-interactive hover:bg-surface-dense text-foreground px-4 py-1 rounded-md text-base font-medium border border-border-subtle"
            >
              Move to Todo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
