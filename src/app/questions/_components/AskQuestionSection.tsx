'use client';

import { useState, FormEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AskQuestionSection() {
  const { status } = useSession();
  const router = useRouter();
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      signIn('google');
      return;
    }

    if (!newQuestion.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/live-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newQuestion }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to submit question');
      }

      await response.json();
      setNewQuestion('');
      setIsAskModalOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Ask Question Section - Moved to bottom */}
      <section className="bg-[#1f1f1f] border border-[#3e3e3e]/50 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-300">Have a question?</h2>
          {!isAuthenticated && (
            <button
              onClick={() => signIn('google')}
              className="text-lg text-[#2cbb5d] hover:text-[#25a552] transition"
            >
              Sign in to participate
            </button>
          )}
        </div>
        <button
          onClick={() => setIsAskModalOpen(true)}
          disabled={!isAuthenticated}
          className="w-full px-4 py-3 bg-[#2cbb5d] text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#25a552] transition text-left"
        >
          {isAuthenticated ? 'Ask a Question' : 'Sign in to ask a question'}
        </button>
      </section>

      {/* Ask Question Modal */}
      {isAskModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsAskModalOpen(false)}>
          <div className="bg-[#282828] border border-[#3e3e3e] rounded-xl p-6 shadow-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Ask a question</h2>
              <button
                onClick={() => setIsAskModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-lg text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="What would you like to ask?"
                className="w-full rounded-lg bg-[#1f1f1f] border border-[#3e3e3e] p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
                rows={5}
                disabled={!isAuthenticated || isSubmitting}
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAuthenticated || isSubmitting || !newQuestion.trim()}
                  className="px-4 py-2 bg-[#2cbb5d] text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#25a552] transition"
                >
                  {isSubmitting ? 'Sending…' : 'Submit question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Ask Question Button */}
      {!isAskModalOpen && (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              signIn('google');
            } else {
              setIsAskModalOpen(true);
            }
          }}
          className="fixed bottom-6 right-6 bg-[#2cbb5d] text-black rounded-full shadow-xl hover:bg-[#25a552] transition-all hover:scale-105 flex items-center justify-center z-40 px-6 py-4 gap-2 font-semibold"
          title="Ask a question"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-lg">Ask Question</span>
        </button>
      )}
    </>
  );
}

