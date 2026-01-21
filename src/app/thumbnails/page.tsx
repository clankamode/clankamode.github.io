"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { ThumbnailJob } from '@/types/ThumbnailJob';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import Sidebar from './_components/Sidebar';
import ThumbnailOverview from './_components/ThumbnailOverview';
import CreateJobModal from './_components/CreateJobModal';
import ThumbnailViewModal from './_components/ThumbnailViewModal';
import { Thumbnail } from "@/types/ThumbnailJob"
import { type ThumbnailView } from "@/app/thumbnails/types"
import { hasRole, UserRole } from "@/types/roles"

// Function to convert API data to our frontend format
const convertApiDataToThumbnail = (job: ThumbnailJob): Thumbnail => {
  return {
    id: job.id,
    editUrl: `/thumbnails/${job.id}`,
    videoTitle: job.video_title,
    thumbnailUrl: job.thumbnail,
    notes: job.notes || '',
    status: job.status,
    favorite: job.favorite ?? false,
    updatedAt: job.updated_at,
  }
}

export default function ThumbnailDashboard() {
  const [currentView, setCurrentView] = useState<ThumbnailView>(ThumbnailJobStatus.TODO)
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<string | null>(null)
  const { data: session } = useSession()

  const isAdmin = session?.user?.role ? hasRole(session.user.role as UserRole, UserRole.ADMIN) : false

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

  useEffect(() => {
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
    fetchThumbnails()
  }

  const handleViewClick = (thumbnailId: string) => {
    setSelectedThumbnailId(thumbnailId)
    setViewModalOpen(true)
  }

  const handleToggleFavorite = async (thumbnailId: string) => {
    const thumbnail = thumbnails.find((t) => t.id === thumbnailId)
    if (!thumbnail) return

    const newFavoriteValue = !thumbnail.favorite

    // Optimistically update the UI
    setThumbnails((prev) =>
      prev.map((t) =>
        t.id === thumbnailId ? { ...t, favorite: newFavoriteValue } : t
      )
    )

    try {
      const response = await fetch(`/api/thumbnail_job/${thumbnailId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorite: newFavoriteValue }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }
    } catch (error) {
      console.error('Error updating favorite status:', error)
      // Revert on error
      setThumbnails((prev) =>
        prev.map((t) =>
          t.id === thumbnailId ? { ...t, favorite: !newFavoriteValue } : t
        )
      )
    }
  }

  const handleDelete = async (thumbnailId: string) => {
    if (!confirm('Are you sure you want to delete this thumbnail?')) {
      return
    }

    // Optimistically remove from UI
    setThumbnails((prev) => prev.filter((t) => t.id !== thumbnailId))

    try {
      const response = await fetch(`/api/thumbnail_job/${thumbnailId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete thumbnail')
      }
    } catch (error) {
      console.error('Error deleting thumbnail:', error)
      // Revert on error by refetching
      fetchThumbnails()
    }
  }

  const getStatusCounts = () => {
    return {
      todo: thumbnails.filter((t) => t.status === ThumbnailJobStatus.TODO).length,
      "in-review": thumbnails.filter((t) => t.status === ThumbnailJobStatus.IN_REVIEW).length,
      completed: thumbnails.filter((t) => t.status === ThumbnailJobStatus.COMPLETED).length,
      favorites: thumbnails.filter((t) => t.favorite).length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-surface-ambient flex">
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

      {/* Thumbnail View Modal */}
      <ThumbnailViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedThumbnailId(null)
        }}
        thumbnailId={selectedThumbnailId}
        onSubmitSuccess={fetchThumbnails}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 h-full flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-surface-workbench shadow-sm px-4 py-3 flex items-center justify-between border-b border-border-subtle">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-foreground">Thumbnail Dashboard</h1>
          <div></div>
        </div>

        {/* Page content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <ThumbnailOverview 
            thumbnails={thumbnails} 
            status={currentView} 
            isLoading={isLoading} 
            error={error}
            onThumbnailsChange={fetchThumbnails}
            onViewClick={handleViewClick}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  )
}
