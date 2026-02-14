'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

type FeedbackCategory = 'bug' | 'idea' | 'content' | 'other';

const FEEDBACK_CATEGORIES: Array<{
  value: FeedbackCategory;
  label: string;
  description: string;
}> = [
  { value: 'bug', label: 'Bug', description: 'Something is broken or unexpected.' },
  { value: 'idea', label: 'Idea', description: 'A feature or workflow improvement.' },
  { value: 'content', label: 'Content', description: 'Topics, lessons, or video requests.' },
  { value: 'other', label: 'Other', description: 'Anything else you want to share.' },
];

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

export default function FeedbackWidget() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [didAutofillEmail, setDidAutofillEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const shouldHide = useMemo(() => {
    return pathname.startsWith('/admin') || pathname.startsWith('/ai') || pathname.startsWith('/login') || pathname.startsWith('/feedback');
  }, [pathname]);

  useEffect(() => {
    if (!didAutofillEmail && session?.user?.email) {
      setContactEmail(session.user.email);
      setDidAutofillEmail(true);
    }
  }, [didAutofillEmail, session?.user?.email]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen]);

  if (shouldHide) {
    return null;
  }

  const trimmedLength = message.trim().length;
  const canSubmit =
    !isSubmitting && trimmedLength >= MIN_MESSAGE_LENGTH && trimmedLength <= MAX_MESSAGE_LENGTH;

  const resetForm = () => {
    setCategory('idea');
    setMessage('');
    setSubmitError(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitted(false);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const pathWithQuery =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : pathname;

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          message: message.trim(),
          contactEmail: contactEmail.trim() || null,
          pagePath: pathWithQuery,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Could not submit feedback.');
      }

      resetForm();
      setIsSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit feedback.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 left-5 z-40 min-h-[44px] rounded-full border border-border-subtle bg-surface-interactive/90 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_20px_50px_-25px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-border-interactive hover:bg-surface-dense/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Open feedback form"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-green" aria-hidden="true" />
            Feedback
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-ambient/95 p-6 shadow-[0_30px_100px_-30px_rgba(0,0,0,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Quick feedback</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Share a fast note. For full reports, use the detailed form.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close feedback modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {isSubmitted ? (
              <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-4 text-sm text-text-primary" role="status" aria-live="polite">
                <p className="font-semibold text-foreground">Feedback received. Thanks.</p>
                <p className="mt-1 text-text-secondary">Your note was logged for review.</p>
                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsSubmitted(false)}>
                    Submit another
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Feedback type</label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {FEEDBACK_CATEGORIES.map((item) => {
                      const active = category === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setCategory(item.value)}
                          className={`rounded-xl border p-3 text-left transition-all ${active
                            ? 'border-brand-green/60 bg-brand-green/10'
                            : 'border-border-subtle bg-surface-interactive/70 hover:border-border-interactive hover:bg-surface-dense/70'
                            }`}
                        >
                          <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                          <span className="mt-1 block text-xs text-text-secondary">{item.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="feedback-message" className="text-sm font-medium text-foreground">
                    Message
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="What happened, what did you expect, and what would make it better?"
                    rows={6}
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="w-full rounded-xl border border-border-subtle bg-surface-interactive px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Minimum {MIN_MESSAGE_LENGTH} characters.</span>
                    <span className={trimmedLength > MAX_MESSAGE_LENGTH ? 'text-red-300' : 'text-text-secondary'}>
                      {trimmedLength}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="feedback-email" className="text-sm font-medium text-foreground">
                    Contact email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border-subtle bg-surface-interactive px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Link
                    href="/feedback"
                    onClick={closeModal}
                    className="text-sm text-text-secondary hover:text-foreground transition-colors"
                  >
                    Open full form
                  </Link>
                  <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="novice" disabled={!canSubmit}>
                    {isSubmitting ? 'Sending...' : 'Send feedback'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
