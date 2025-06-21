"use client"

import type React from "react"

import { useState } from "react"

interface Thumbnail {
  id: string
  editUrl: string
  videoTitle: string
  thumbnailUrl?: string
  notes: string
  status: "todo" | "in-review" | "completed"
  submittedAt: Date
  submittedBy: string
}

interface SubmissionData {
  thumbnail: File | null
  notes: string
  videoUrl: string
  editUrl?: string
}

// Mock data for demonstration
const mockThumbnails: Thumbnail[] = [
  {
    id: "1",
    editUrl: "/thumbnails/1",
    videoTitle: "How to Build a React App",
    thumbnailUrl: "/placeholder.svg?height=180&width=320",
    notes:
      "0:30 - Introduction\n2:15 - Setup process\n5:45 - First component\n\nGreat tutorial, focus on the coding sections",
    status: "completed",
    submittedAt: new Date("2024-01-15"),
    submittedBy: "Designer A",
  },
  {
    id: "2",
    editUrl: "/thumbnails/2",
    videoTitle: "Advanced JavaScript Concepts",
    thumbnailUrl: "/placeholder.svg?height=180&width=320",
    notes: "1:00 - Closures explanation\n3:30 - Async/await demo\n7:20 - Key takeaways",
    status: "in-review",
    submittedAt: new Date("2024-01-18"),
    submittedBy: "Designer B",
  },
  {
    id: "3",
    editUrl: "/thumbnails/3",
    videoTitle: "CSS Grid Layout Tutorial",
    notes: "",
    status: "todo",
    submittedAt: new Date("2024-01-20"),
    submittedBy: "",
  },
  {
    id: "4",
    editUrl: "/thumbnails/4",
    videoTitle: "Node.js Backend Development",
    notes: "",
    status: "todo",
    submittedAt: new Date("2024-01-22"),
    submittedBy: "",
  },
  {
    id: "5",
    editUrl: "/thumbnails/5",
    videoTitle: "Database Design Principles",
    thumbnailUrl: "/placeholder.svg?height=180&width=320",
    notes:
      "2:00 - ERD creation\n4:45 - Normalization\n8:15 - Best practices\n\nVery technical, might need simpler thumbnail",
    status: "in-review",
    submittedAt: new Date("2024-01-19"),
    submittedBy: "Designer A",
  },
]

type ViewType = "todo" | "in-review" | "completed" | "submit"

export default function ThumbnailDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("todo")
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>(mockThumbnails)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Submission form state
  const [formData, setFormData] = useState<SubmissionData>({
    thumbnail: null,
    notes: "",
    videoUrl: "",
  })
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getStatusCounts = () => {
    return {
      todo: thumbnails.filter((t) => t.status === "todo").length,
      "in-review": thumbnails.filter((t) => t.status === "in-review").length,
      completed: thumbnails.filter((t) => t.status === "completed").length,
    }
  }

  const statusCounts = getStatusCounts()

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, thumbnail: file }))

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        handleFileChange(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Add new thumbnail to in-review
    const newThumbnail: Thumbnail = {
      id: Date.now().toString(),
      editUrl: formData.editUrl || "",
      videoTitle: "New Video Submission",
      thumbnailUrl: previewUrl || undefined,
      notes: formData.notes,
      status: "in-review",
      submittedAt: new Date(),
      submittedBy: "Current User",
    }

    setThumbnails((prev) => [...prev, newThumbnail])
    setFormData({ thumbnail: null, notes: "", videoUrl: "" })
    setPreviewUrl(null)
    setIsSubmitting(false)
    setCurrentView("in-review")
  }

  const updateThumbnailStatus = (id: string, newStatus: "todo" | "in-review" | "completed") => {
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
            onClick={() => setCurrentView("submit")}
            className="w-full bg-[#2cbb5d] text-white px-4 py-2 rounded-lg hover:bg-[#25a24f] transition-colors font-medium"
          >
            Create New Job
          </button>
        </div>

        <div className="space-y-1">
          {[
            { key: "todo" as const, label: "To Do", icon: "📋", count: statusCounts.todo },
            { key: "in-review" as const, label: "In Review", icon: "👀", count: statusCounts["in-review"] },
            { key: "completed" as const, label: "Completed", icon: "✅", count: statusCounts.completed },
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

        <div className="flex items-center text-sm text-gray-400 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {thumbnail.submittedAt.toLocaleDateString()}
          {thumbnail.submittedBy && (
            <>
              <span className="mx-2">•</span>
              <span>{thumbnail.submittedBy}</span>
            </>
          )}
        </div>

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

          <div className="flex space-x-1">
            {thumbnail.status !== "todo" && (
              <button
                onClick={() => updateThumbnailStatus(thumbnail.id, "todo")}
                className="px-2 py-1 text-xs bg-[#1a1a1a] text-gray-400 rounded hover:bg-[#282828] transition-colors"
                title="Move to To Do"
              >
                📋
              </button>
            )}
            {thumbnail.status !== "in-review" && (
              <button
                onClick={() => updateThumbnailStatus(thumbnail.id, "in-review")}
                className="px-2 py-1 text-xs bg-[#282828] text-[#2cbb5d] rounded hover:bg-[#1a1a1a] transition-colors"
                title="Move to In Review"
              >
                👀
              </button>
            )}
            {thumbnail.status !== "completed" && (
              <button
                onClick={() => updateThumbnailStatus(thumbnail.id, "completed")}
                className="px-2 py-1 text-xs bg-[#2cbb5d] text-white rounded hover:bg-[#25a24f] transition-colors"
                title="Move to Completed"
              >
                ✅
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStatusView = (status: "todo" | "in-review" | "completed") => {
    const filteredThumbnails = thumbnails.filter((t) => t.status === status)
    const statusLabels = {
      todo: "To Do",
      "in-review": "In Review",
      completed: "Completed",
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
              No thumbnails {status === "todo" ? "to do" : status}
            </h3>
            <p className="text-gray-400">
              {status === "todo" && "New video requests will appear here"}
              {status === "in-review" && "Submitted thumbnails will appear here for review"}
              {status === "completed" && "Approved thumbnails will appear here"}
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

  const renderSubmissionForm = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Submit New Thumbnail</h2>
        <p className="text-gray-400">Upload your Canva-created thumbnail and add your notes</p>
      </div>

      <div className="bg-[#282828] rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video URL Input */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">
              Video URL
            </label>
            <input
              type="url"
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-600 bg-[#1a1a1a] text-white rounded-lg focus:ring-2 focus:ring-[#2cbb5d] focus:border-[#2cbb5d]"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image</label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-[#2cbb5d] bg-[#1a1a1a]" : "border-gray-600 hover:border-gray-400 bg-[#282828]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Thumbnail preview"
                    className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex items-center justify-center space-x-2 text-[#2cbb5d]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{formData.thumbnail?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Drop your thumbnail here</p>
                    <p className="text-sm text-gray-400">or click to browse files</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes & Timestamps
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Example:&#10;0:30 - Introduction&#10;2:15 - Main demo&#10;5:45 - Key takeaway"
              className="w-full h-32 px-4 py-3 border border-gray-600 bg-[#1a1a1a] text-white rounded-lg focus:ring-2 focus:ring-[#2cbb5d] focus:border-[#2cbb5d] resize-vertical"
              rows={6}
            />
          </div>

          <button
            type="submit"
            disabled={!formData.thumbnail || !formData.videoUrl || isSubmitting}
            className="w-full px-6 py-3 bg-[#2cbb5d] text-white font-medium rounded-lg hover:bg-[#25a24f] focus:ring-2 focus:ring-[#2cbb5d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </div>
            ) : (
              "Submit Thumbnail"
            )}
          </button>
        </form>
      </div>
    </div>
  )

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
          {currentView === "submit" && renderSubmissionForm()}
          {currentView !== "submit" && renderStatusView(currentView)}
        </div>
      </div>
    </div>
  )
}
