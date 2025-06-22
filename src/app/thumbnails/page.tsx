"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ThumbnailJob } from '@/types/ThumbnailJob';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import Loading from '@/components/ui/Loading';

interface Thumbnail {
  id: string
  editUrl: string
  videoTitle: string
  thumbnailUrl?: string
  notes: string
  status: ThumbnailJobStatus
}

// Function to convert API data to our frontend format
const convertApiDataToThumbnail = (job: ThumbnailJob): Thumbnail => {
  return {
    id: job.id,
    editUrl: `/thumbnails/${job.id}`,
    videoTitle: job.video_title,
    thumbnailUrl: job.thumbnail,
    notes: job.notes || '',
    status: job.status,
  }
}

export default function ThumbnailDashboard() {
  const [currentView, setCurrentView] = useState<ThumbnailJobStatus>(ThumbnailJobStatus.TODO)
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        const response = await fetch('/api/thumbnail_job')
        if (!response.ok) {
          throw new Error('Failed to fetch thumbnails')
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        const convertedThumbnails = data.data.map(convertApiDataToThumbnail)
        setThumbnails(convertedThumbnails)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchThumbnails()
  }, [])

  const getStatusCounts = () => {
    return {
      todo: thumbnails.filter((t) => t.status === ThumbnailJobStatus.TODO).length,
      "in-review": thumbnails.filter((t) => t.status === ThumbnailJobStatus.IN_REVIEW).length,
      completed: thumbnails.filter((t) => t.status === ThumbnailJobStatus.COMPLETED).length,
    }
  }

  const statusCounts = getStatusCounts()


  const updateThumbnailStatus = (id: string, newStatus: ThumbnailJobStatus) => {
    setThumbnails((prev) => prev.map((thumb) => (thumb.id === id ? { ...thumb, status: newStatus } : thumb)))
  }

  const renderSidebar = () => (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#282828] shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
    >

      <nav className="mt-8">
        <div className="px-6 mb-6">
          <button
            disabled={true}
            // onClick={() => setCurrentView("submit")}
            className="w-full bg-[#2cbb5d] text-white px-4 py-2 rounded-lg hover:bg-[#25a24f] transition-colors font-medium"
          >
            Create New Job
          </button>
        </div>

        <div className="space-y-1">
          {[
            { key: ThumbnailJobStatus.TODO, label: "To Do", icon: "📋", count: statusCounts.todo },
            { key: ThumbnailJobStatus.IN_REVIEW, label: "In Review", icon: "👀", count: statusCounts["in-review"] },
            { key: ThumbnailJobStatus.COMPLETED, label: "Completed", icon: "✅", count: statusCounts.completed },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-[#1a1a1a] transition-colors ${
                currentView === item.key ? "bg-[#1a1a1a] border-r-2 border-[#2cbb5d] text-[#2cbb5d]" : "text-gray-300"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  currentView === item.key ? "bg-[#2cbb5d] text-white" : "bg-[#282828] text-gray-400 border border-gray-600"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )

  const renderThumbnailCard = (thumbnail: Thumbnail) => (
    <div key={thumbnail.id} className="bg-[#282828] rounded-lg shadow-md overflow-hidden">
      <div className="aspect-video bg-[#1a1a1a] relative">
        {thumbnail.thumbnailUrl ? (
          <img
            src={thumbnail.thumbnailUrl || "/placeholder.svg"}
            alt={thumbnail.videoTitle}
            className="w-full h-full object-cover"
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
          <a
            href={thumbnail.editUrl}
            // target="_blank"
            rel="noopener noreferrer"
            className="text-[#2cbb5d] hover:text-[#25a24f] text-sm font-medium"
          >
            View Video →
          </a>
        </div>
      </div>
    </div>
  )

  const renderStatusView = (status: ThumbnailJobStatus) => {
    const filteredThumbnails = thumbnails.filter((t) => t.status === status)
    const statusLabels = {
      [ThumbnailJobStatus.TODO]: "To Do",
      [ThumbnailJobStatus.IN_REVIEW]: "In Review",
      [ThumbnailJobStatus.COMPLETED]: "Completed",
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
            {filteredThumbnails.map(renderThumbnailCard)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#282828] shadow-sm px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Thumbnail Dashboard</h1>
          <div></div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {renderStatusView(currentView)}
        </div>
      </div>
    </div>
  )
}
