"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useSession } from "next-auth/react";
import { hasRole, UserRole } from "@/types/roles";

// Gallery image component with error handling
function GalleryImage({ 
  url, 
  onCopy, 
  onDownload, 
  onDelete 
}: { 
  url: string; 
  onCopy: () => void; 
  onDownload: () => void;
  onDelete?: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div 
      className="frame relative aspect-video bg-surface-interactive rounded-lg overflow-hidden group cursor-pointer"
      onClick={onCopy}
    >
      {imgError ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-muted-foreground">Failed to load</p>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-surface-interactive animate-pulse" />
          )}
          <img 
            src={url} 
            alt="Headshot" 
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : ''}`}
            onError={handleError}
            onLoad={handleLoad}
          />
        </>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-foreground text-base font-medium backdrop-blur-sm"
          title="Download"
        >
          Download
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-base font-medium backdrop-blur-sm"
            title="Delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

interface GalleryItem {
  url: string;
  pathname?: string;
  size?: number;
  uploadedAt?: string;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

  const userRole = useMemo(() => (session?.user?.role as UserRole) || UserRole.USER, [session?.user?.role]);
  const hasAccess = Boolean(session && hasRole(userRole, UserRole.EDITOR));
  const canUpload = Boolean(session && hasRole(userRole, UserRole.ADMIN));

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/gallery", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load gallery");
      }
      const data = await response.json();
      setItems(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load gallery");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchGallery();
    }
  }, [hasAccess]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setStatusMessage(null);

    try {
      // Upload the file to blob storage
      const blob = await upload(`gallery/${selectedFile.name}`, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/gallery/upload",
      });
      
      // Save the blob URL to database
      const confirmResponse = await fetch("/api/gallery/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: blob.url }),
      });

      if (!confirmResponse.ok) {
        throw new Error("Failed to save headshot to database");
      }

      await fetchGallery();
      setStatusMessage("Upload complete! Share this link with your thumbnail designers.");
      
      // Clear everything after successful save
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelection(file);
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setError('Please select a PNG, JPG, or WEBP image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setStatusMessage(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter') {
      dragCounter.current += 1;
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    // Only take the first file
    const file = droppedFiles[0];
    handleFileSelection(file);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setStatusMessage("Copied link to clipboard");
    } catch {
      setError("Unable to copy link");
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `headshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image');
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Are you sure you want to delete this headshot?')) {
      return;
    }

    try {
      const response = await fetch('/api/gallery/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete headshot');
      }

      setStatusMessage('Headshot deleted successfully');
      await fetchGallery();
    } catch (error) {
      console.error('Error deleting headshot:', error);
      setError('Failed to delete headshot');
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-foreground">Checking access…</div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-foreground">
        <h1 className="text-4xl font-semibold mb-4">Gallery</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-foreground">

      {canUpload && (
        <div 
          className={`bg-surface-workbench border rounded-xl p-6 mb-8 transition-colors ${
            dragActive 
              ? 'border-brand-green bg-brand-green/10' 
              : 'border-border-subtle'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xl font-medium">Upload new headshots</p>
            <p className="text-muted-foreground text-base">
              {dragActive ? 'Drop file here' : 'Drag and drop an image here, or click to choose a file'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">PNG, JPG, or WEBP up to 10MB (one file at a time)</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg border border-border-subtle text-foreground hover:border-border-interactive disabled:opacity-50"
            >
              Choose file
            </button>
          </div>
        </div>
        {statusMessage && <p className="text-base text-brand-green mt-3">{statusMessage}</p>}
        {error && <p className="text-base text-red-400 mt-3">{error}</p>}
        </div>
      )}

      {canUpload && selectedFile && previewUrl && (
        <div className="bg-surface-workbench border border-border-subtle rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="aspect-video w-full md:w-64 bg-surface-interactive rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={previewUrl} 
                alt={selectedFile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xl font-semibold mb-2">{selectedFile.name}</p>
                <p className="text-base text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="mt-4 px-4 py-2 rounded-lg border border-border-subtle text-foreground hover:border-border-interactive text-base"
                >
                  Remove
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="mt-4 px-4 py-2 rounded-lg bg-brand-green text-black font-semibold hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        {isLoading && <span className="text-base text-muted-foreground">Loading gallery…</span>}
      </div>

      {items.length === 0 && !isLoading ? (
        <div className="text-center py-12 border border-dashed border-border-subtle rounded-lg text-muted-foreground">
          No headshots uploaded yet. Add your first image to share with designers.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <GalleryImage
              key={item.url}
              url={item.url}
              onCopy={() => copyUrl(item.url)}
              onDownload={() => handleDownload(item.url)}
              onDelete={canUpload ? () => handleDelete(item.url) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
