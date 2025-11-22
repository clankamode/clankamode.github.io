import type React from "react"
import { Thumbnail } from "@/types/ThumbnailJob"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import Image from "next/image"


interface ThumbnailCardProps {
  thumbnail: Thumbnail
  status: ThumbnailJobStatus,
  onStatusChange?: (thumbnailId: string, newStatus: ThumbnailJobStatus) => void
  onViewClick?: (thumbnailId: string) => void
}

export default function ThumbnailCard({ thumbnail, status, onStatusChange, onViewClick }: ThumbnailCardProps) {
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
    <div key={thumbnail.id} className="bg-[#282828] rounded-lg shadow-md overflow-hidden">
      <div className="aspect-video bg-[#1a1a1a] relative">
        {thumbnail.thumbnailUrl ? (
          <Image
            src={thumbnail.thumbnailUrl || "/placeholder.svg"}
            alt={thumbnail.videoTitle}
            className="w-full h-full object-cover"
            width={100}
            height={100}
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
        <h3 className="font-semibold text-white mb-2 line-clamp-2">{thumbnail.videoTitle}</h3>


        {thumbnail.notes && (
          <div className="mb-3">
            <p className="text-sm text-gray-300 line-clamp-3">{thumbnail.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onViewClick?.(thumbnail.id)}
              className="text-[#2cbb5d] hover:text-[#25a24f] text-sm font-medium"
            >
              View Video
            </button>
            {thumbnail.thumbnailUrl && (
              <button
                onClick={handleDownload}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium p-1 rounded-full hover:bg-blue-400/10 transition-colors"
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
          </div>
          {status === ThumbnailJobStatus.TODO && onStatusChange && thumbnail.thumbnailUrl && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.IN_REVIEW)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md text-sm font-medium"
            >
              Move to Review
            </button>
          )}
          {status === ThumbnailJobStatus.IN_REVIEW && onStatusChange && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.COMPLETED)}
              className="bg-[#2cbb5d] hover:bg-[#25a24f] text-white px-4 py-1 rounded-md text-sm font-medium"
            >
              Complete
            </button>
          )}
          {status === ThumbnailJobStatus.COMPLETED && onStatusChange && (
            <button
              onClick={() => onStatusChange(thumbnail.id, ThumbnailJobStatus.TODO)}
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-1 rounded-md text-sm font-medium"
            >
              Move to Todo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

