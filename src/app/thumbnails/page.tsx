"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ThumbnailJob } from '@/types/ThumbnailJob';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import Sidebar from './_components/Sidebar';
import ThumbnailOverview from './_components/ThumbnailOverview';
import CreateJobModal from './_components/CreateJobModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleCreateJob = async (videoUrl: string, videoTitle: string) => {
    const response = await fetch('/api/thumbnail_job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        video_url: videoUrl,
        video_title: videoTitle 
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create thumbnail job')
    }

    // Refresh the thumbnails list
    const updatedResponse = await fetch('/api/thumbnail_job')
    const data = await updatedResponse.json()
    const convertedThumbnails = data.data.map(convertApiDataToThumbnail)
    setThumbnails(convertedThumbnails)
  }

  const getStatusCounts = () => {
    return {
      todo: thumbnails.filter((t) => t.status === ThumbnailJobStatus.TODO).length,
      "in-review": thumbnails.filter((t) => t.status === ThumbnailJobStatus.IN_REVIEW).length,
      completed: thumbnails.filter((t) => t.status === ThumbnailJobStatus.COMPLETED).length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        statusCounts={statusCounts} 
        sidebarOpen={sidebarOpen}
        onCreateClick={() => setIsModalOpen(true)}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 h-screen flex flex-col overflow-hidden">
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
        <div className="p-6 flex-1 overflow-y-auto">
          <ThumbnailOverview thumbnails={thumbnails} status={currentView} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  )
}
