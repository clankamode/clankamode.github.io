"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { upload } from '@vercel/blob/client';
import Image from "next/image"
import { ThumbnailSuggestionStatus } from '@/types/ThumbnailJob'
import CommentsSection from './CommentsSection'

interface ThumbnailViewModalProps {
  isOpen: boolean
  onClose: () => void
  thumbnailId: string | null
  onSubmitSuccess: () => void
}

interface SubmissionData {
  videoTitle: string
  videoUrl: string
  thumbnail_url?: string
  suggestedThumbnails: string[]
  suggestionStatus: ThumbnailSuggestionStatus
  notes: string
}

export default function ThumbnailViewModal({ isOpen, onClose, thumbnailId, onSubmitSuccess }: ThumbnailViewModalProps) {
  const [formData, setFormData] = useState<SubmissionData>({
    videoTitle: "",
    videoUrl: "",
    thumbnail_url: undefined,
    suggestedThumbnails: [],
    suggestionStatus: ThumbnailSuggestionStatus.IDLE,
    notes: "",
  })

  const inputFileRef = useRef<HTMLInputElement>(null);
  const pollRunRef = useRef(0);
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false)

  useEffect(() => {
    if (!isOpen) pollRunRef.current += 1;
  }, [isOpen])

  useEffect(() => {
    return () => { pollRunRef.current += 1; };
  }, [])

  const pollForSuggestionStatus = async (jobId: string) => {
    const runId = ++pollRunRef.current
    const maxAttempts = 30
    let attempts = 0

    const poll = async (): Promise<void> => {
      if (runId !== pollRunRef.current) return

      attempts++
      try {
        const res = await fetch(`/api/thumbnail_job/${jobId}`)
        if (runId !== pollRunRef.current) return

        if (res.ok) {
          const data = await res.json()
          const status = data.data?.thumbnail_suggestion_status || ThumbnailSuggestionStatus.IDLE
          const suggested = data.data?.suggested_thumbnails || []

          if (status === ThumbnailSuggestionStatus.COMPLETED) {
            setFormData((prev) => ({
              ...prev,
              suggestedThumbnails: suggested,
              suggestionStatus: status,
            }))
            setIsGeneratingSuggestions(false)
            return
          }

          if (status === ThumbnailSuggestionStatus.FAILED) {
            setFormData((prev) => ({
              ...prev,
              suggestionStatus: status,
            }))
            setIsGeneratingSuggestions(false)
            setSuggestionError('Generation failed. Please try again.')
            return
          }
        }
      } catch (error) {
        console.error('Error polling for suggestions:', error)
      }

      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        if (runId !== pollRunRef.current) return
        return poll()
      } else {
        setIsGeneratingSuggestions(false)
        setSuggestionError('Generation timed out. Please try again.')
      }
    }

    return poll()
  }

  useEffect(() => {
    if (isOpen && thumbnailId) {
      setIsLoading(true)
      setSuggestionError(null)
      setIsGeneratingSuggestions(false)

      const fetchThumbnail = async () => {
        try {
          const response = await fetch(`/api/thumbnail_job/${thumbnailId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch thumbnail')
          }
          const data = await response.json()
          if (data.error) {
            throw new Error(data.error)
          }
          const suggestionStatus = data.data.thumbnail_suggestion_status || ThumbnailSuggestionStatus.IDLE
          setFormData({
            thumbnail_url: data.data.thumbnail || undefined,
            notes: data.data.notes || "",
            videoUrl: data.data.video_url || "",
            videoTitle: data.data.video_title || "",
            suggestedThumbnails: data.data.suggested_thumbnails || [],
            suggestionStatus,
          })

          if (suggestionStatus === ThumbnailSuggestionStatus.GENERATING) {
            setIsGeneratingSuggestions(true)
            setIsSuggestionsExpanded(true)
            pollForSuggestionStatus(thumbnailId)
          }

          if (data.data.suggested_thumbnails?.length > 0) {
            setIsSuggestionsExpanded(true)
          }
        } catch (error) {
          console.error('Error fetching thumbnail:', error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchThumbnail()
    }
  }, [isOpen, thumbnailId])

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
        if (inputFileRef.current) {
          inputFileRef.current.files = e.dataTransfer.files
          handleFileChange(e);
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/thumbnail_job/${thumbnailId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thumbnail: formData.thumbnail_url,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit thumbnail')
      }

      onSubmitSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting thumbnail:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async (imageUrl?: string, filename?: string) => {
    const urlToDownload = imageUrl || formData.thumbnail_url
    if (!urlToDownload) return

    try {
      const response = await fetch(urlToDownload)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `${formData.videoTitle || 'thumbnail'}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading thumbnail:', error)
      alert('Failed to download thumbnail')
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!thumbnailId || isGeneratingSuggestions) return

    setIsGeneratingSuggestions(true)
    setSuggestionError(null)

    try {
      const response = await fetch(`/api/thumbnail_job/${thumbnailId}/generate-suggestions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate suggestions')
      }

      setFormData((prev) => ({
        ...prev,
        suggestionStatus: ThumbnailSuggestionStatus.GENERATING,
      }))

      pollForSuggestionStatus(thumbnailId)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      setSuggestionError(error instanceof Error ? error.message : 'Failed to generate suggestions')
      setIsGeneratingSuggestions(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-surface-workbench rounded-lg shadow-lg w-full max-w-6xl xl:max-w-7xl my-8 border border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-surface-workbench px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-foreground">
              {isLoading ? "Loading..." : formData.videoTitle}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading thumbnail data...</div>
          </div>
        ) : (
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-hidden">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 h-full">
              <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-250px)] pr-6">
                {/* Video Link Section */}
                <div className="mb-8">
                  <div className="bg-surface-interactive rounded-lg p-4 border-l-4 border-brand-green">
                    <p className="text-base text-muted-foreground mb-2">Please watch this video before creating the thumbnail:</p>
                    <a
                      href={formData.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-green hover:text-brand-green/90 font-medium break-all"
                    >
                      {formData.videoUrl}
                    </a>
                    <div className="mt-2">
                      <a
                        href={formData.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-brand-green text-black text-base font-medium rounded-lg hover:bg-brand-green/90 transition-colors"
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

                {/* Suggested Thumbnails - Collapsible */}
                <div className="mb-8 border border-border-subtle rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-surface-interactive hover:bg-surface-dense transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg
                        className={`w-5 h-5 text-muted-foreground transition-transform ${isSuggestionsExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h2 className="text-xl font-semibold text-foreground whitespace-nowrap">Suggested thumbnails</h2>
                      {formData.suggestedThumbnails.length > 0 && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">({formData.suggestedThumbnails.length})</span>
                      )}

                      {!isSuggestionsExpanded && formData.suggestedThumbnails.length > 0 && (
                        <div className="flex items-center gap-2 ml-4 overflow-hidden">
                          {formData.suggestedThumbnails.slice(0, 3).map((url, idx) => (
                            <div key={idx} className="relative w-12 h-8 rounded overflow-hidden border border-border-subtle shrink-0">
                              <Image
                                src={url}
                                alt="Suggestion preview"
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ))}
                          {formData.suggestedThumbnails.length > 3 && (
                            <span className="text-xs text-muted-foreground shrink-0">+{formData.suggestedThumbnails.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isGeneratingSuggestions && (
                        <span className="text-sm text-muted-foreground flex items-center">
                          <svg
                            className="animate-spin mr-2 h-4 w-4"
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Generating…
                        </span>
                      )}
                    </div>
                  </button>

                  {isSuggestionsExpanded && (
                    <div className="p-4 border-t border-border-subtle">
                      <div className="flex items-center justify-end mb-3">
                        {formData.suggestedThumbnails.length > 0 && !isGeneratingSuggestions && (
                          <button
                            type="button"
                            onClick={handleGenerateSuggestions}
                            disabled={isGeneratingSuggestions}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-surface-dense border border-border-interactive text-foreground rounded-lg hover:bg-surface-interactive focus:ring-2 focus:ring-brand-green/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Regenerate
                          </button>
                        )}
                      </div>
                      {suggestionError && (
                        <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 text-sm">
                          {suggestionError}
                        </div>
                      )}
                      {formData.suggestedThumbnails.length === 0 ? (
                        <div className="border border-dashed border-border-interactive rounded-lg p-6 text-center bg-surface-interactive">
                          <p className="text-muted-foreground mb-4">
                            Generate AI thumbnail suggestions using your headshots and the video title.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateSuggestions}
                            disabled={isGeneratingSuggestions}
                            className="inline-flex items-center px-4 py-2 bg-surface-dense border border-border-interactive text-foreground rounded-lg hover:bg-surface-interactive focus:ring-2 focus:ring-brand-green/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isGeneratingSuggestions ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Generating…
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Suggestions
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.suggestedThumbnails.map((url, index) => (
                            <div
                              key={`${url}-${index}`}
                              className="bg-surface-interactive border border-border-subtle rounded-lg overflow-hidden"
                            >
                              <div className="relative w-full aspect-video">
                                <Image
                                  src={url}
                                  alt={`Suggested thumbnail ${index + 1}`}
                                  className="object-cover"
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </div>
                              <div className="p-3 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Option {index + 1}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(url, `${formData.videoTitle || 'thumbnail'}-suggestion-${index + 1}.png`)}
                                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-surface-dense transition-colors"
                                    title="Download"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
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
                                  <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, thumbnail_url: url }))}
                                    className="text-sm px-3 py-1 rounded-lg bg-brand-green text-black font-semibold hover:bg-brand-green/90"
                                  >
                                    Use this
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* File Upload Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-semibold text-foreground">Upload Thumbnail</h2>
                      {formData.thumbnail_url && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDownload()
                          }}
                          type="button"
                          className="text-muted-foreground hover:text-foreground text-base font-medium p-1 rounded-full hover:bg-surface-dense transition-colors"
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
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-brand-green bg-brand-green/5" : "border-border-subtle hover:border-border-interactive bg-surface-interactive"
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
                          <div className="relative w-full max-w-2xl mx-auto aspect-video">
                            <Image
                              src={formData.thumbnail_url || "/placeholder.svg"}
                              alt="Thumbnail preview"
                              className="rounded-lg shadow-md object-contain"
                              fill
                              sizes="(max-width: 768px) 100vw, 672px"
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm font-medium rounded-full">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Uploaded
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-surface-workbench rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xl font-medium text-foreground">Drop your thumbnail here</p>
                            <p className="text-muted-foreground">or click to browse files</p>
                          </div>
                          <p className="text-base text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <label htmlFor="notes" className="block text-2xl font-semibold text-foreground mb-3">
                      Notes & Timestamps
                    </label>
                    <p className="text-muted-foreground mb-3">
                      Add any notes, timestamps, or key moments from the video that should be included in the description.
                    </p>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Example:&#10;0:30 - Introduction to the topic&#10;2:15 - Main demonstration begins&#10;5:45 - Key takeaway&#10;&#10;Additional notes:&#10;- Great energy in this video&#10;- Consider highlighting the demo section"
                      className="w-full h-40 px-4 py-3 border border-border-subtle rounded-lg focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green resize-vertical bg-surface-interactive text-foreground placeholder:text-muted-foreground"
                      rows={8}
                    />
                    <p className="text-base text-muted-foreground mt-2">{formData.notes.length} characters</p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.thumbnail_url || isSubmitting}
                      className="px-8 py-3 bg-brand-green text-black font-medium rounded-lg hover:bg-brand-green/90 focus:ring-2 focus:ring-brand-green/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

              {/* Comments Section */}
              <div className="w-full lg:w-96 xl:w-[420px] border-t border-border-subtle lg:border-t-0 lg:border-l lg:pl-6 pt-6 lg:pt-0 flex flex-col h-full max-h-[calc(100vh-250px)] overflow-hidden min-h-0">
                {thumbnailId && <CommentsSection thumbnailId={thumbnailId} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
