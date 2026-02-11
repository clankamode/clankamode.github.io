'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import { useRouter } from 'next/navigation';

const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const oEmbedTitleCache = new Map<string, string>();
const oEmbedInFlightCache = new Map<string, Promise<string | null>>();

async function fetchYouTubeTitle(videoUrl: string): Promise<string | null> {
  const cached = oEmbedTitleCache.get(videoUrl);
  if (cached) return cached;

  const inFlight = oEmbedInFlightCache.get(videoUrl);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (!response.ok) return null;
      const data = await response.json();
      const title = typeof data.title === 'string' ? data.title : null;
      if (title) {
        oEmbedTitleCache.set(videoUrl, title);
      }
      return title;
    } catch {
      return null;
    } finally {
      oEmbedInFlightCache.delete(videoUrl);
    }
  })();

  oEmbedInFlightCache.set(videoUrl, request);
  return request;
}

const VideoAnswerPreview = ({ videoId, videoUrl }: { videoId: string; videoUrl: string }) => {
  const [videoTitle, setVideoTitle] = useState<string | null>(() => oEmbedTitleCache.get(videoUrl) || null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [shouldLoadTitle, setShouldLoadTitle] = useState(false);
  const thumbnailUrl = getYouTubeThumbnail(videoId);

  useEffect(() => {
    if (!shouldLoadTitle || videoTitle) return;

    let isActive = true;
    setIsLoadingTitle(true);

    fetchYouTubeTitle(videoUrl)
      .then((title) => {
        if (isActive && title) {
          setVideoTitle(title);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTitle(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [shouldLoadTitle, videoTitle, videoUrl]);

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      onMouseEnter={() => setShouldLoadTitle(true)}
      onFocus={() => setShouldLoadTitle(true)}
      onTouchStart={() => setShouldLoadTitle(true)}
    >
      <div className="frame relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-surface-interactive transition-all">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={videoTitle || 'Video thumbnail'}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.includes('maxresdefault')) {
              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
          {isLoadingTitle ? (
            <div className="h-4 bg-surface-interactive rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-foreground text-base font-semibold line-clamp-2">
              {videoTitle || 'Watch Answer'}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

interface LiveQuestion {
  id: string;
  content: string;
  createdAt: string;
  isArchived: boolean;
  videoUrl: string | null;
  voteCount: number;
  hasVoted: boolean;
}

interface QuestionsListProps {
  initialQuestions: Omit<LiveQuestion, 'hasVoted'>[];
  initialTab: 'answered' | 'unanswered';
}

export default function QuestionsList({ initialQuestions, initialTab }: QuestionsListProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState<LiveQuestion[]>(() => 
    initialQuestions.map(q => ({ ...q, hasVoted: false }))
  );
  const [votingQuestionId, setVotingQuestionId] = useState<string | null>(null);
  const [videoUrlInputs, setVideoUrlInputs] = useState<Record<string, string>>({});
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const originalRole = (session?.originalUser?.role as UserRole) || effectiveRole;
  const isAdmin = hasRole(originalRole, UserRole.ADMIN);

  const filteredAndSortedQuestions = useMemo(() => {
    const filtered = questions.filter((question) => {
      if (initialTab === 'answered') {
        return question.isArchived;
      } else {
        return !question.isArchived;
      }
    });

    return filtered.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [questions, initialTab]);

  const fetchQuestions = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/live-questions');

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuestions();
    }
  }, [isAuthenticated, fetchQuestions]);

  const toggleVote = async (questionId: string) => {
    if (!isAuthenticated) {
      signIn('google');
      return;
    }

    if (votingQuestionId === questionId) {
      return;
    }

    setVotingQuestionId(questionId);

    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              voteCount: question.voteCount + (question.hasVoted ? -1 : 1),
              hasVoted: !question.hasVoted,
            }
          : question
      )
    );

    try {
      const response = await fetch(`/api/live-questions/${questionId}/vote`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Unable to record vote');
      }

      const payload = await response.json();

      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, hasVoted: payload.hasVoted, voteCount: payload.voteCount }
            : question
        )
      );
    } catch (err) {
      setError((err as Error).message);
      await fetchQuestions();
    } finally {
      setVotingQuestionId(null);
    }
  };

  const markAsAnswered = async (questionId: string, videoUrl: string) => {
    if (!isAdmin) {
      return;
    }

    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setSubmittingQuestionId(questionId);

    try {
      const response = await fetch(`/api/live-questions/${questionId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Unable to mark question as answered');
      }

      const payload = await response.json();

      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, isArchived: payload.isArchived, videoUrl: payload.videoUrl }
            : question
        )
      );

      setVideoUrlInputs((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });

      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingQuestionId(null);
    }
  };

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-base text-red-200">
          {error}
        </div>
      )}
      {filteredAndSortedQuestions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle bg-surface-workbench p-6 text-center text-muted-foreground">
          {initialTab === 'answered' 
            ? 'No answered questions yet.' 
            : 'No questions yet. Be the first to ask!'}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredAndSortedQuestions.map((question) => (
            <li
              key={question.id}
              className={`frame p-5 flex gap-4 items-start transition-all ${
                question.isArchived
                  ? 'bg-surface-workbench/80 opacity-90'
                  : 'bg-surface-workbench hover:bg-surface-interactive/80'
              }`}
            >
              <button
                onClick={() => toggleVote(question.id)}
                disabled={votingQuestionId === question.id || question.isArchived}
                className={`flex flex-col items-center rounded-lg border px-3 py-2 transition shadow-sm ${
                  question.hasVoted
                    ? 'bg-brand-green/10 border-brand-green text-foreground'
                    : 'bg-surface-interactive border-border-subtle text-foreground hover:border-border-interactive'
                } ${votingQuestionId === question.id || question.isArchived ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                >
                  <path d="M12 4l-7 8h4v6h6v-6h4z" />
                </svg>
                <span className="mt-1 text-base font-semibold">{question.voteCount}</span>
              </button>
              <div className="flex-1 space-y-3">
                <h3 className={`text-2xl font-bold leading-snug ${question.isArchived ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {question.content}
                </h3>
                {question.isArchived && question.videoUrl && (() => {
                  const videoId = extractYouTubeVideoId(question.videoUrl);
                  if (videoId) {
                    return (
                      <div className="mt-3">
                        <VideoAnswerPreview videoId={videoId} videoUrl={question.videoUrl} />
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2">
                      <a
                        href={question.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-2 bg-surface-interactive text-foreground border border-border-subtle rounded text-base font-semibold hover:bg-surface-dense transition"
                      >
                        Watch Answer
                      </a>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between gap-2 text-base text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {question.isArchived && (
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-sm font-semibold">
                        Answered
                      </span>
                    )}
                    <span>{new Date(question.createdAt).toLocaleString()}</span>
                  </div>
                  {isAdmin && !question.isArchived && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={videoUrlInputs[question.id] || ''}
                        onChange={(e) =>
                          setVideoUrlInputs((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Video URL"
                        className="px-2 py-1 text-sm rounded bg-surface-interactive border border-border-subtle text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-green/40 w-36"
                        disabled={submittingQuestionId === question.id}
                      />
                      <button
                        onClick={() => markAsAnswered(question.id, videoUrlInputs[question.id] || '')}
                        disabled={submittingQuestionId === question.id || !videoUrlInputs[question.id]?.trim()}
                        className="px-2 py-1 text-sm font-semibold rounded transition bg-surface-interactive text-foreground border border-border-subtle hover:bg-surface-dense disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Mark as answered with video URL"
                      >
                        {submittingQuestionId === question.id ? 'Saving...' : 'Mark Answered'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
