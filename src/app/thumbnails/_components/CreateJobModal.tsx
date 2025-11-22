import { useState } from 'react'

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

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(videoUrl, videoTitle)
      setVideoUrl('')
      setVideoTitle('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#282828] rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Create New Thumbnail Job</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-300 mb-2">
                Video Title
              </label>
              <input
                type="text"
                id="videoTitle"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title..."
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d] focus:border-transparent"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2cbb5d] text-white rounded-md hover:bg-[#25a24f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 