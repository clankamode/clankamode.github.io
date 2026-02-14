'use client';

import { FormEvent, useEffect, useState } from 'react';
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
  { value: 'content', label: 'Content', description: 'Topic, lesson, or content request.' },
  { value: 'other', label: 'Other', description: 'Anything else you want to share.' },
];

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

export default function FeedbackForm() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [didAutofillEmail, setDidAutofillEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!didAutofillEmail && session?.user?.email) {
      setContactEmail(session.user.email);
      setDidAutofillEmail(true);
    }
  }, [didAutofillEmail, session?.user?.email]);

  const trimmedLength = message.trim().length;
  const canSubmit = trimmedLength >= MIN_MESSAGE_LENGTH && trimmedLength <= MAX_MESSAGE_LENGTH && !isSubmitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const pagePath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/feedback';

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          contactEmail: contactEmail.trim() || null,
          pagePath,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Could not submit feedback.');
      }

      setIsSubmitted(true);
      setMessage('');
      setCategory('idea');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Feedback</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Help Us Improve</h1>
        <p className="mt-3 max-w-2xl text-text-secondary">
          Share bugs, feature ideas, or content requests. Specific details help us prioritize faster.
        </p>
      </header>

      <div className="rounded-2xl border border-border-subtle bg-surface-interactive/70 p-5 md:p-7">
        {isSubmitted ? (
          <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-4 text-sm text-text-primary">
            <p className="font-semibold text-foreground">Feedback received.</p>
            <p className="mt-1 text-text-secondary">Thanks. Your submission is logged for review.</p>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsSubmitted(false)}>
                Submit another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <div className="grid gap-2 md:grid-cols-2">
                {FEEDBACK_CATEGORIES.map((item) => {
                  const isActive = category === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value)}
                      className={`rounded-xl border p-3 text-left transition-all ${isActive
                        ? 'border-brand-green/60 bg-brand-green/10'
                        : 'border-border-subtle bg-surface-ambient/60 hover:border-border-interactive hover:bg-surface-dense/60'
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
                rows={8}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="What happened, what did you expect, and what should change?"
                className="w-full rounded-xl border border-border-subtle bg-surface-ambient px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
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
                className="w-full rounded-xl border border-border-subtle bg-surface-ambient px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button type="submit" variant="novice" disabled={!canSubmit}>
                {isSubmitting ? 'Sending...' : 'Send feedback'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
