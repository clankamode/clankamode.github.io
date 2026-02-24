'use client';

import { useState, useRef } from 'react';

interface ResumeReview {
  id: string;
  created_at: string;
  author_name: string | null;
  title: string;
  context: string | null;
  resume_url: string;
  resume_filename: string;
  status: 'pending' | 'reviewed';
  review_notes: string | null;
  reviewed_at: string | null;
  vote_count: number;
  hasVoted: boolean;
}

interface Props {
  onSubmit: (review: ResumeReview) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TITLE_CHARS = 100;
const MAX_CONTEXT_CHARS = 500;

export function SubmitResume({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File must be under 5MB.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    // Step 1: Upload file to Vercel Blob
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/resume-review/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const data = await uploadRes.json();
      setError(data.error ?? 'Failed to upload file.');
      setSubmitting(false);
      return;
    }

    const { url, filename } = await uploadRes.json();

    // Step 2: Create review record
    const res = await fetch('/api/resume-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        context: context.trim() || null,
        resume_url: url,
        resume_filename: filename,
        anonymous,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      onSubmit(data.review);
      setTitle('');
      setContext('');
      setFile(null);
      setAnonymous(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to submit. Try again.');
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-5 transition-colors focus-within:border-border-interactive"
    >
      <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <p className="text-xs text-amber-400 leading-relaxed">
          Your resume will be publicly visible. Remove any information you don&apos;t want shared before uploading.
        </p>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. &quot;New grad SWE resume&quot;)"
        maxLength={MAX_TITLE_CHARS}
        className="w-full bg-transparent text-text-primary placeholder-text-muted outline-none text-sm leading-relaxed mb-2"
      />

      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Context (optional) — What roles are you targeting? Any specific concerns?"
        rows={2}
        maxLength={MAX_CONTEXT_CHARS}
        className="w-full resize-none bg-transparent text-text-primary placeholder-text-muted outline-none text-sm leading-relaxed"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle bg-surface-interactive accent-emerald-500"
            />
            Submit anonymously
          </label>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground">
            {file ? file.name : 'Choose PDF'}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={!file || !title.trim() || submitting}
            className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
