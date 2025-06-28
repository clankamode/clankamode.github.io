import type React from "react"
import ThumbnailCard from "./ThumbnailCard"
import { ThumbnailJobStatus } from "@/types/ThumbnailJob"
import { Thumbnail } from "@/types/ThumbnailJob"
import Loading from '@/components/ui/Loading';

type ThumbnailOverviewProps = {
  thumbnails: Thumbnail[]
  status: ThumbnailJobStatus
  isLoading: boolean
  error: string | null
  onThumbnailsChange: () => void
}

export default function ThumbnailOverview({ thumbnails, status, isLoading, error, onThumbnailsChange }: ThumbnailOverviewProps) {
  const filteredThumbnails = thumbnails
    .filter((t) => t.status === status)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime()
      const dateB = new Date(b.updatedAt || 0).getTime()
      return dateB - dateA // Sort in descending order (newest first)
    })

  const statusLabels = {
    [ThumbnailJobStatus.TODO]: "To Do",
    [ThumbnailJobStatus.IN_REVIEW]: "In Review",
    [ThumbnailJobStatus.COMPLETED]: "Completed",
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

      // Refresh the thumbnails list
      onThumbnailsChange();
    } catch (error) {
      console.error('Error updating thumbnail status:', error);
      // You might want to show an error toast here
    }
  }

  if (isLoading) {
    return <Loading />
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
          <h3 className="text-lg font-medium text-white">Failed to load thumbnails</h3>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#2cbb5d] text-white rounded-lg hover:bg-[#25a24f]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{statusLabels[status]}</h2>
        <p className="text-gray-400">
          {filteredThumbnails.length} thumbnail{filteredThumbnails.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filteredThumbnails.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No thumbnails {status === ThumbnailJobStatus.TODO ? "to do" : status}
          </h3>
          <p className="text-gray-400">
            {status === ThumbnailJobStatus.TODO && "New video requests will appear here"}
            {status === ThumbnailJobStatus.IN_REVIEW && "Submitted thumbnails will appear here for review"}
            {status === ThumbnailJobStatus.COMPLETED && "Approved thumbnails will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThumbnails.map((thumbnail: Thumbnail) => (
            <ThumbnailCard 
              key={thumbnail.id} 
              thumbnail={thumbnail} 
              status={status}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
