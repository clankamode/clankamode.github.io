'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AmaQuestion {
  id: string;
  created_at: string;
  author_name: string | null;
  question: string;
  status: 'unanswered' | 'answered';
  answer: string | null;
  answered_at: string | null;
  vote_count: number;
}

interface AmaResponse {
  questions: AmaQuestion[];
  total: number;
  page: number;
  limit: number;
}

interface AnswerDraft {
  id: string;
  question: string;
  currentAnswer: string | null;
}

// Web Speech API types
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Heights for 48 bars — repeated pattern gives a natural wave shape
const BAR_HEIGHTS = [3,5,9,6,12,8,14,7,11,5,13,6,10,4,12,8,6,14,5,9,7,13,4,11,6,10,8,14,5,12,7,9,4,13,6,11,8,5,14,7,10,3,12,6,9,5,13,8];

function Waveform({ active }: { active: boolean }) {
  return (
    <>
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.15); }
          to   { transform: scaleY(1); }
        }
      `}</style>
      <div className="flex flex-1 items-center gap-[2px]" style={{ height: '36px' }}>
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 origin-center ${
              active ? 'bg-red-400' : 'bg-white/10'
            }`}
            style={{
              height: active ? `${h}px` : '2px',
              animationName: active ? 'waveBar' : 'none',
              animationDuration: `${0.35 + (i % 5) * 0.12}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: `${(i % 7) * 0.05}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function AnswerModal({
  draft,
  onClose,
  onSaved,
}: {
  draft: AnswerDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [answerText, setAnswerText] = useState(draft.currentAnswer ?? '');
  const [interim, setInterim] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const committedRef = useRef(draft.currentAnswer ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Auto-scroll textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [answerText, interim]);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    committedRef.current = answerText;

    r.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (finalTranscript) {
        const base = committedRef.current;
        const joined = base ? `${base} ${finalTranscript.trim()}` : finalTranscript.trim();
        committedRef.current = joined;
        setAnswerText(joined);
        setInterim('');
      } else {
        setInterim(interimTranscript);
      }
    };

    r.onend = () => {
      setIsRecording(false);
      setInterim('');
    };

    r.onerror = () => {
      setIsRecording(false);
      setInterim('');
    };

    r.start();
    recognitionRef.current = r;
    setIsRecording(true);
  }, [answerText]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterim('');
  }, []);

  // Stop on unmount
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const handleSave = async () => {
    if (saving) return;
    stopRecording();
    setSaving(true);

    const res = await fetch('/api/admin/ama', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft.id, answer: answerText }),
    });

    if (res.ok) onSaved();
    setSaving(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswerText(e.target.value);
    committedRef.current = e.target.value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`relative w-full max-w-xl rounded-2xl border bg-[#09090b] p-6 shadow-2xl transition-all duration-300 ${
          isRecording
            ? 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.12)]'
            : 'border-border-subtle shadow-[0_0_40px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Answer question</h2>
          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-red-400">Live</span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="mb-4 rounded-xl border border-border-subtle bg-surface-workbench/60 px-4 py-3">
          <p className="text-sm leading-relaxed text-text-secondary">{draft.question}</p>
        </div>

        {/* Voice section — full width, between question and answer */}
        {supported ? (
          <div
            className={`mb-4 flex w-full items-center gap-4 rounded-xl border px-4 py-4 transition-all duration-300 ${
              isRecording
                ? 'border-red-500/40 bg-red-500/5 shadow-[0_0_24px_rgba(239,68,68,0.08)]'
                : 'border-border-subtle bg-surface-workbench/40'
            }`}
          >
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                isRecording
                  ? 'border-red-500/60 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                  : 'border-border-subtle bg-surface-interactive text-text-muted hover:border-border-interactive hover:text-foreground'
              }`}
            >
              {isRecording && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
              )}
              {isRecording ? (
                <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="3" y="3" width="10" height="10" rx="2" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1Z" />
                  <path d="M4 7.5a.75.75 0 0 0-1.5 0A5.5 5.5 0 0 0 7.25 12.9v1.35h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-1.5V12.9A5.5 5.5 0 0 0 13.5 7.5a.75.75 0 0 0-1.5 0 4 4 0 0 1-8 0Z" />
                </svg>
              )}
            </button>

            <Waveform active={isRecording} />

            <span className={`shrink-0 text-xs font-medium transition-colors duration-300 ${isRecording ? 'text-red-400' : 'text-text-muted'}`}>
              {isRecording ? 'Listening…' : 'Tap to speak'}
            </span>
          </div>
        ) : null}

        {/* Answer textarea */}
        <div
          className={`relative rounded-xl border transition-all duration-300 ${
            isRecording
              ? 'border-red-500/30'
              : 'border-border-subtle focus-within:border-border-interactive'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={answerText}
            onChange={handleTextChange}
            placeholder="Your answer will appear here…"
            rows={5}
            className="w-full resize-none rounded-xl bg-surface-workbench/60 px-4 py-3 text-sm leading-relaxed text-text-primary placeholder-text-muted outline-none"
          />
          {interim && (
            <div className="px-4 pb-3 -mt-1">
              <span className="text-sm italic leading-relaxed text-text-muted">{interim}</span>
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-red-400 align-middle" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !answerText.trim()}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save answer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AmaAdminTable() {
  const [data, setData] = useState<AmaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'answered'>('unanswered');
  const [page, setPage] = useState(1);
  const [answerDraft, setAnswerDraft] = useState<AnswerDraft | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusFilter });
    const res = await fetch(`/api/admin/ama?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleMarkUnanswered = async (id: string) => {
    await fetch('/api/admin/ama', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'unanswered', answer: '' }),
    });
    fetchQuestions();
  };

  const totalPages = data ? Math.ceil(data.total / (data.limit || 50)) : 1;

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">{data ? `${data.total} total` : ''}</p>
          <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-interactive/40 p-1">
            {(['all', 'unanswered', 'answered'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? 'bg-surface-dense text-foreground' : 'text-text-muted hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-surface-workbench/40" />
            ))}
          </div>
        ) : !data || data.questions.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-workbench/40 px-6 py-12 text-center">
            <p className="text-text-secondary">No questions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.questions.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  q.status === 'answered'
                    ? 'border-emerald-500/20 bg-surface-workbench/40'
                    : 'border-border-subtle bg-surface-workbench/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-border-subtle px-2.5 py-2 text-text-muted">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3L2 10h3v3h6v-3h3L8 3z" />
                    </svg>
                    <span className="text-xs font-semibold tabular-nums leading-none">{q.vote_count}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">{q.author_name ?? 'Anonymous'}</span>
                      <span className="text-xs text-text-muted">{timeAgo(q.created_at)}</span>
                      {q.status === 'answered' && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          Answered
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-text-primary">{q.question}</p>
                    {q.answer && (
                      <p className="mt-1 text-sm italic text-text-secondary line-clamp-2">{q.answer}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswerDraft({ id: q.id, question: q.question, currentAnswer: q.answer })}
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground"
                    >
                      {q.status === 'answered' ? 'Edit answer' : 'Answer'}
                    </button>
                    {q.status === 'answered' && (
                      <button
                        type="button"
                        onClick={() => handleMarkUnanswered(q.id)}
                        className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-500/30 hover:text-red-400"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary transition-colors disabled:opacity-40 hover:border-border-interactive hover:text-foreground"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary transition-colors disabled:opacity-40 hover:border-border-interactive hover:text-foreground"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {answerDraft && (
        <AnswerModal
          draft={answerDraft}
          onClose={() => setAnswerDraft(null)}
          onSaved={() => {
            setAnswerDraft(null);
            fetchQuestions();
          }}
        />
      )}
    </>
  );
}
