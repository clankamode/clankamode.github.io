"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, redirect, useRouter } from "next/navigation"
import { upload } from '@vercel/blob/client';

interface SubmissionData {
  videoTitle: string
  videoUrl: string
  thumbnail_url?: string
  notes: string
}

export default function ThumbnailSubmissionPage() {
  const { thumbnail } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<SubmissionData>({
    videoTitle: "",
    videoUrl: "",
    thumbnail_url: undefined,
    notes: "",
  })

  const inputFileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)


  useEffect(() => {
    const fetchThumbnail = async () => {
      const response = await fetch(`/api/thumbnail_job/${thumbnail}`)
      if (!response.ok) {
        throw new Error('Failed to fetch thumbnails')
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setFormData({
        thumbnail_url: data.data.thumbnail || undefined,
        notes: data.data.notes || "",
        videoUrl: data.data.video_url || "",
        videoTitle: data.data.video_title || "",
      })
      debugger;
    }

    fetchThumbnail()
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<Element> | null) => {
    if (event) {
      event.preventDefault();
    }

    if (!inputFileRef.current?.files) {
      throw new Error('No file selected');
    }

    const file = inputFileRef.current.files[0];
    const newBlob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/avatar/upload',
    });

    setFormData((prev) => ({ ...prev, thumbnail_url: newBlob.url }))
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
        handleFileChange(e);
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const response = await fetch(`/api/thumbnail_job/${thumbnail}`, {
      method: 'PATCH',
      body: JSON.stringify({
        thumbnail: formData.thumbnail_url,
        notes: formData.notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit thumbnail')
    }

    setIsSubmitting(false)
    redirect(`/thumbnails`)
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#282828] rounded-lg shadow-lg overflow-hidden border border-[#3e3e3e]">
          {/* Header */}
          <div className="bg-[#282828] px-6 py-8 border-b border-[#3e3e3e]">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/thumbnails')}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-white">{formData.videoTitle}</h1>
            </div>
          </div>

          <div className="p-6">
            {/* Video Link Section */}
            <div className="mb-8">
              <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#2cbb5d]">
                <p className="text-sm text-gray-400 mb-2">Please watch this video before creating the thumbnail:</p>
                <a
                  href={formData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2cbb5d] hover:text-[#25a24f] font-medium break-all"
                >
                  {formData.videoUrl}
                </a>
                <div className="mt-2">
                  <a
                    href={formData.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-[#2cbb5d] text-white text-sm font-medium rounded-lg hover:bg-[#28a754] transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open Video
                  </a>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Upload Thumbnail</h2>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-[#2cbb5d] bg-[#2cbb5d]/5" : "border-[#3e3e3e] hover:border-[#2cbb5d] bg-[#1a1a1a]"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={inputFileRef}
                    onChange={(e) => handleFileChange(e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {formData.thumbnail_url ? (
                    <div className="space-y-4">
                      <img
                        src={formData.thumbnail_url || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-[#282828] rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">Drop your thumbnail here</p>
                        <p className="text-gray-400">or click to browse files</p>
                      </div>
                      <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label htmlFor="notes" className="block text-xl font-semibold text-white mb-3">
                  Notes & Timestamps
                </label>
                <p className="text-white-700 mb-3">
                  Add any notes, timestamps, or key moments from the video that should be included in the description.
                </p>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Example:&#10;0:30 - Introduction to the topic&#10;2:15 - Main demonstration begins&#10;5:45 - Key takeaway&#10;&#10;Additional notes:&#10;- Great energy in this video&#10;- Consider highlighting the demo section"
                  className="w-full h-40 px-4 py-3 border border-[#3e3e3e] rounded-lg focus:ring-2 focus:ring-[#2cbb5d]/50 focus:border-[#2cbb5d] resize-vertical bg-[#1a1a1a] text-white placeholder:text-gray-500"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-2">{formData.notes.length} characters</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!formData.thumbnail_url || isSubmitting}
                  className="px-8 py-3 bg-[#2cbb5d] text-white font-medium rounded-lg hover:bg-[#25a24f] focus:ring-2 focus:ring-[#2cbb5d]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
