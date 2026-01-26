"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type {
  ThumbnailComment,
  CommentAttachment,
} from "@/types/ThumbnailComment";

interface CommentsSectionProps {
  thumbnailId: string;
}

interface PendingAttachment extends CommentAttachment {
  id: string;
}

const MAX_TEXT_LENGTH = 200;

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
}

export default function CommentsSection({ thumbnailId }: CommentsSectionProps) {
  const [comments, setComments] = useState<ThumbnailComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/thumbnail_job/${thumbnailId}/comments`
      );
      if (!response.ok) {
        throw new Error("Failed to load comments");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setComments(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [thumbnailId]);

  useEffect(() => {
    if (thumbnailId) {
      fetchComments();
    }
  }, [thumbnailId, fetchComments]);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setError("Only image files are allowed");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: `/api/thumbnail_job/${thumbnailId}/comments/upload`,
        });

        return {
          id: crypto.randomUUID(),
          url: blob.url,
          name: file.name,
          type: "image" as const,
        };
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setPendingAttachments((prev) => [...prev, ...uploadedAttachments]);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload attachment"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) =>
      prev.filter((att) => att.id !== attachmentId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() && pendingAttachments.length === 0) {
      return;
    }

    if (commentText.trim().length > MAX_TEXT_LENGTH) {
      setError(`Comment cannot exceed ${MAX_TEXT_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/thumbnail_job/${thumbnailId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: commentText.trim(),
            attachments: pendingAttachments.map(({ url, name, type }) => ({
              url,
              name,
              type,
            })),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      // Clear form and refresh comments
      setCommentText("");
      setPendingAttachments([]);
      fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    (commentText.trim().length > 0 || pendingAttachments.length > 0) &&
    !isSubmitting &&
    !isUploading;

  const startEditing = (comment: ThumbnailComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) {
      return;
    }

    if (editText.trim().length > MAX_TEXT_LENGTH) {
      setError(`Comment cannot exceed ${MAX_TEXT_LENGTH} characters`);
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/thumbnail_job/${thumbnailId}/comments`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commentId,
            text: editText.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update comment");
      }

      // Clear edit state and refresh comments
      setEditingCommentId(null);
      setEditText("");
      fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setIsEditing(false);
    }
  };

  const isOwnComment = (comment: ThumbnailComment) => {
    return session?.user?.email && comment.author_email === session.user.email;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Comments</h2>
        {isLoading && <span className="text-base text-muted-foreground">Loading...</span>}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 text-base">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 mb-6 overflow-y-auto pr-2 flex-1 min-h-0">
        {comments.length === 0 && !isLoading ? (
          <p className="text-muted-foreground">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-border-subtle rounded-lg p-4 bg-surface-interactive"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Profile Picture */}
                  {comment.author_image ? (
                    <Image
                      src={comment.author_image}
                      alt={comment.author_name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface-dense flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {comment.author_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {comment.created_at && (
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  )}
                  {isOwnComment(comment) && editingCommentId !== comment.id && (
                    <button
                      type="button"
                      onClick={() => startEditing(comment)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Edit comment"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Comment Text or Edit Form */}
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-interactive border border-border-subtle rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-brand-green"
                    rows={2}
                    maxLength={MAX_TEXT_LENGTH}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        editText.length > MAX_TEXT_LENGTH
                          ? "text-red-400"
                          : editText.length > MAX_TEXT_LENGTH * 0.8
                            ? "text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {editText.length}/{MAX_TEXT_LENGTH}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isEditing}
                        className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditSubmit(comment.id)}
                        disabled={isEditing || !editText.trim() || editText.length > MAX_TEXT_LENGTH}
                        className="px-3 py-1 text-sm text-brand-green font-medium hover:text-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isEditing ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-base text-foreground whitespace-pre-line mb-3">
                  {comment.text}
                </p>
              )}

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.attachments.map((attachment, index) => (
                    <button
                      key={`${comment.id}-attachment-${index}`}
                      type="button"
                      onClick={() => setExpandedImage(attachment.url)}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-border-subtle hover:border-border-interactive transition-colors cursor-pointer"
                    >
                      <Image
                        src={attachment.url}
                        alt={attachment.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-t border-border-subtle pt-4"
      >
        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-subtle group"
              >
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea with Drag/Drop */}
        <div
          className={`relative rounded-lg border transition-colors ${
            dragActive
              ? "border-brand-green bg-brand-green/5"
              : "border-border-subtle hover:border-border-interactive"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment... (drag & drop images here)"
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
            rows={3}
            maxLength={MAX_TEXT_LENGTH}
          />

          {/* Drag Overlay */}
          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-green/10 rounded-lg pointer-events-none">
              <span className="text-brand-green font-medium">
                Drop images here
              </span>
            </div>
          )}
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Attach image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Character Count */}
            <span
              className={`text-sm ${
                commentText.length > MAX_TEXT_LENGTH
                  ? "text-red-400"
                  : commentText.length > MAX_TEXT_LENGTH * 0.8
                    ? "text-yellow-400"
                    : "text-muted-foreground"
              }`}
            >
              {commentText.length}/{MAX_TEXT_LENGTH}
            </span>

            {/* Upload Indicator */}
            {isUploading && (
              <span className="text-sm text-muted-foreground flex items-center">
                <svg
                  className="animate-spin mr-1 h-4 w-4"
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
                Uploading...
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 text-brand-green font-medium hover:text-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </form>

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            type="button"
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={expandedImage}
              alt="Expanded attachment"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
