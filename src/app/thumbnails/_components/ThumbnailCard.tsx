'use client';

import type React from "react"
import { Thumbnail } from "@/types/ThumbnailJob"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import { useState, useRef, useEffect } from "react"


interface ThumbnailCardProps {
  thumbnail: Thumbnail
  status: ThumbnailJobStatus
  onStatusChange?: (thumbnailId: string, newStatus: ThumbnailJobStatus) => void | Promise<void>
  onViewClick?: (thumbnailId: string) => void
  onToggleFavorite?: (thumbnailId: string) => void
  onDelete?: (thumbnailId: string) => void
  isAdmin?: boolean
  isSelected?: boolean
  onSelect?: (thumbnailId: string, event: React.MouseEvent) => void
  hasSelection?: boolean
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ThumbnailCard({
  thumbnail,
  status,
  onStatusChange,
  onViewClick,
  onToggleFavorite,
  onDelete,
  isAdmin,
  isSelected = false,
  onSelect,
  hasSelection = false,
}: ThumbnailCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setShowOverflow(false);
      }
    };
    if (showOverflow) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOverflow]);

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
    }
  }

  const handleDeleteClick = () => {
    setShowOverflow(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.(thumbnail.id);
  };

  return (
    <div
      key={thumbnail.id}
      className={`frame bg-surface-workbench overflow-hidden group relative transition-all duration-200 ${isSelected ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-surface-ambient' : ''
        }`}
    >
      <div className="aspect-video bg-surface-interactive relative">
        {onSelect && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${hasSelection || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(thumbnail.id, e);
              }}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected
                ? 'bg-brand-green border-brand-green'
                : 'bg-black/50 border-white/50 hover:border-white'
                }`}
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>
        )}

        {thumbnail.thumbnailUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail.thumbnailUrl}
            alt={thumbnail.videoTitle}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-dense p-4">
            <div className="w-12 h-12 rounded-full bg-surface-workbench flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-3">No thumbnail yet</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewClick?.(thumbnail.id);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-brand-green text-black font-medium hover:bg-brand-green/90 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewClick?.(thumbnail.id);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-surface-workbench text-foreground border border-border-subtle hover:border-border-interactive transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{thumbnail.videoTitle}</h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {thumbnail.updatedAt && (
            <span>{formatRelativeTime(thumbnail.updatedAt)}</span>
          )}
          {thumbnail.thumbnailUrl && (
            <>
              <span className="opacity-50">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                Has thumbnail
              </span>
            </>
          )}
        </div>

        {thumbnail.notes && (
          <div className="mb-3">
            <p className="text-base text-muted-foreground line-clamp-2">{thumbnail.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border-subtle/50">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewClick?.(thumbnail.id)
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-foreground bg-surface-interactive hover:bg-surface-dense rounded-lg transition-colors text-center border border-border-subtle"
          >
            Open
          </button>

          {onStatusChange && (
            <>
              {status === ThumbnailJobStatus.TODO && thumbnail.thumbnailUrl && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (isUpdating) return
                    setIsUpdating(true)
                    try {
                      await onStatusChange(thumbnail.id, ThumbnailJobStatus.IN_REVIEW)
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  disabled={isUpdating}
                  className={`flex-1 px-3 py-2 text-sm font-medium text-black bg-brand-green hover:bg-brand-green/90 rounded-lg transition-colors text-center shadow-sm ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUpdating ? 'Submitting...' : 'Submit for review'}
                </button>
              )}
              {status === ThumbnailJobStatus.IN_REVIEW && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (isUpdating) return
                    setIsUpdating(true)
                    try {
                      await onStatusChange(thumbnail.id, ThumbnailJobStatus.COMPLETED)
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  disabled={isUpdating}
                  className={`flex-1 px-3 py-2 text-sm font-medium text-black bg-brand-green hover:bg-brand-green/90 rounded-lg transition-colors text-center shadow-sm ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUpdating ? 'Approving...' : 'Approve'}
                </button>
              )}
              {status === ThumbnailJobStatus.COMPLETED && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (isUpdating) return
                    setIsUpdating(true)
                    try {
                      await onStatusChange(thumbnail.id, ThumbnailJobStatus.TODO)
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  disabled={isUpdating}
                  className={`flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-surface-interactive hover:bg-surface-dense rounded-lg border border-border-subtle transition-colors text-center ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Reopen
                </button>
              )}
            </>
          )}

          <div className="relative shrink-0" ref={overflowRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowOverflow(!showOverflow)
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-dense transition-colors border border-transparent hover:border-border-subtle"
              title="More actions"
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
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showOverflow && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-surface-workbench border border-border-subtle rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="py-1">
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite?.(thumbnail.id)
                        setShowOverflow(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-interactive transition-colors flex items-center gap-3"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={thumbnail.favorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={thumbnail.favorite ? "text-yellow-300" : ""}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {thumbnail.favorite ? "Remove favorite" : "Add to favorites"}
                    </button>
                  )}
                  {thumbnail.thumbnailUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload()
                        setShowOverflow(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-interactive transition-colors flex items-center gap-3"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                      Download thumbnail
                    </button>
                  )}

                  <div className="h-px bg-border-subtle my-1" />

                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete forever
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 p-4">
          <div className="bg-surface-workbench border border-border-subtle rounded-lg p-4 max-w-xs text-center">
            <p className="text-foreground mb-4">Delete this thumbnail job?</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
