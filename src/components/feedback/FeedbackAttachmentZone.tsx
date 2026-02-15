'use client';

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type DragEvent,
  type ClipboardEvent,
} from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';

export interface FeedbackAttachment {
  id: string;
  url: string;
  name: string;
}

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

function isAllowedFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_SIZE_BYTES;
}

export interface FeedbackAttachmentZoneRef {
  addFiles: (files: File[]) => void;
}

interface FeedbackAttachmentZoneProps {
  attachments: FeedbackAttachment[];
  onAttachmentsChange: (attachments: FeedbackAttachment[]) => void;
  isUploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

function FeedbackAttachmentZoneInner(
  {
    attachments,
    onAttachmentsChange,
    isUploading,
    onUploadingChange,
    onError,
    disabled = false,
    className = '',
  }: FeedbackAttachmentZoneProps,
  ref: React.Ref<FeedbackAttachmentZoneRef>
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const uploadFilesRef = useRef<(files: File[]) => Promise<void>>(async () => {});

  useImperativeHandle(ref, () => ({
    addFiles(files: File[]) {
      uploadFilesRef.current(files);
    },
  }));

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const valid = files.filter(isAllowedFile);
      const invalidCount = files.length - valid.length;
      if (invalidCount > 0) {
        onError(
          `Only images and PDFs up to 5MB are allowed. ${invalidCount} file(s) skipped.`
        );
      }
      if (valid.length === 0) return;

      const remaining = MAX_FILES - attachments.length;
      const toUpload = valid.slice(0, remaining);
      if (toUpload.length < valid.length) {
        onError(`Maximum ${MAX_FILES} attachments. Only ${toUpload.length} added.`);
      }

      onUploadingChange(true);
      onError('');

      try {
        const uploaded: FeedbackAttachment[] = await Promise.all(
          toUpload.map(async (file) => {
            const blob = await upload(file.name, file, {
              access: 'public',
              handleUploadUrl: '/api/feedback/upload',
            });
            return {
              id: crypto.randomUUID(),
              url: blob.url,
              name: file.name,
            };
          })
        );
        onAttachmentsChange([...attachments, ...uploaded]);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to upload attachment.');
      } finally {
        onUploadingChange(false);
      }
    },
    [attachments, onAttachmentsChange, onError, onUploadingChange]
  );

  uploadFilesRef.current = uploadFiles;

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || isUploading || !e.dataTransfer.files?.length) return;
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData?.files;
    if (!items?.length) return;
    const files = Array.from(items).filter((f) => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (files.length > 0) {
      e.preventDefault();
      uploadFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    uploadFiles(Array.from(files));
    e.target.value = '';
  };

  const remove = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  const canAdd = attachments.length < MAX_FILES && !disabled && !isUploading;

  return (
    <div className={className}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">
          Screenshots or attachments (optional)
        </label>
        <p className="text-xs text-text-secondary">
          Drag and drop, paste from clipboard, or click to browse. Images and PDFs, up to 5MB each, max {MAX_FILES} files.
        </p>
      </div>

      {canAdd && (
        <div
          className={`mt-2 rounded-xl border border-dashed p-4 transition-colors ${
            dragActive
              ? 'border-brand-green/50 bg-brand-green/5'
              : 'border-border-subtle bg-surface-ambient/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAdd}
            className="min-h-[44px] w-full touch-manipulation text-left text-sm text-text-secondary hover:text-foreground disabled:pointer-events-none"
          >
            {isUploading
              ? 'Uploading…'
              : 'Drop files here, paste from clipboard, or click to browse'}
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-2" role="list">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-ambient/60 px-3 py-2 text-sm"
            >
              {a.url.match(/\.(jpe?g|png|gif|webp)(\?|$)/i) ? (
                <Image
                  src={a.url}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-dense/80 text-text-muted">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v11A2.5 2.5 0 0 0 4.5 18h11a2.5 2.5 0 0 0 2.5-2.5V7.414a2.5 2.5 0 0 0-.732-1.767L13.353 2.732A2.5 2.5 0 0 0 11.586 2H4.5Z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-foreground" title={a.name}>
                {a.name}
              </span>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 min-h-[44px] min-w-[44px] flex items-center text-brand-green hover:text-brand-emerald touch-manipulation"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="shrink-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-text-muted hover:bg-white/10 hover:text-foreground touch-manipulation"
                aria-label={`Remove ${a.name}`}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 6.22Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const FeedbackAttachmentZone = forwardRef(FeedbackAttachmentZoneInner);
export default FeedbackAttachmentZone;
