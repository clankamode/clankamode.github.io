'use client';

import { useState, useEffect } from 'react'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (videoUrl: string, videoTitle: string) => Promise<void>
}

export default function CreateJobModal({ isOpen, onClose, onSubmit }: CreateJobModalProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVideoUrl('')
      setVideoTitle('')
      setVideoId(null)
      setIsValidUrl(false)
      setError(null)
    }
  }, [isOpen])

  const parseYouTubeUrl = (url: string) => {
    if (!url) {
      setVideoId(null)
      setIsValidUrl(false)
      return
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;

    setVideoId(id)
    setIsValidUrl(!!id)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setVideoUrl(url)
    parseYouTubeUrl(url)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidUrl) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(videoUrl, videoTitle)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-workbench rounded-lg p-6 w-full max-w-lg border border-border-subtle shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-foreground mb-6">Create New Thumbnail Job</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-muted-foreground mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full px-3 py-2 bg-surface-interactive border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-transparent transition-colors ${videoId ? 'border-brand-green' : 'border-border-subtle'}`}
                required
                autoFocus
              />
              {videoId && (
                <div className="mt-3 p-3 bg-surface-dense rounded-lg border border-border-subtle flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative w-24 aspect-video bg-black rounded overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-brand-green font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Valid YouTube Video
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">ID: {videoId}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="videoTitle" className="block text-sm font-medium text-muted-foreground mb-2">
                Video Title
              </label>
              <input
                type="text"
                id="videoTitle"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title..."
                className="w-full px-3 py-2 bg-surface-interactive border border-border-subtle rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-transparent"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-brand-green text-black rounded-md hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isValidUrl || !videoTitle.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}