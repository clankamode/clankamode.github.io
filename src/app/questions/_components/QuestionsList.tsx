'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import { useRouter } from 'next/navigation';

// Extract YouTube video ID from various URL formats
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

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Video Card Component
const VideoCard = ({ videoId, videoUrl }: { videoId: string; videoUrl: string }) => {
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(true);
  const thumbnailUrl = getYouTubeThumbnail(videoId);

  useEffect(() => {
    // Fetch video title from YouTube oEmbed API (no API key required)
    const fetchTitle = async () => {
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
        if (response.ok) {
          const data = await response.json();
          setVideoTitle(data.title);
        }
      } catch (error) {
        console.error('Error fetching video title:', error);
      } finally {
        setIsLoadingTitle(false);
      }
    };

    fetchTitle();
  }, [videoUrl]);

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-[#3e3e3e] hover:border-[#2cbb5d] transition-all bg-[#1f1f1f]">
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
          <div className="w-12 h-12 bg-[#2cbb5d] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
          {isLoadingTitle ? (
            <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-white text-sm font-semibold line-clamp-2">
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
    // Filter by active tab
    const filtered = questions.filter((question) => {
      if (initialTab === 'answered') {
        return question.isArchived;
      } else {
        return !question.isArchived;
      }
    });

    // Sort by vote count (descending), then by creation date (ascending)
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

  // Fetch user-specific vote data on mount
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

    // Prevent double-clicks by checking if this question is already being voted on
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

      // Clear the input for this question
      setVideoUrlInputs((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });

      // Refresh to update the list
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
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {filteredAndSortedQuestions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#3e3e3e] bg-[#232323] p-6 text-center text-gray-400">
          {initialTab === 'answered' 
            ? 'No answered questions yet.' 
            : 'No questions yet. Be the first to ask!'}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredAndSortedQuestions.map((question) => (
            <li
              key={question.id}
              className={`rounded-lg border p-5 flex gap-4 items-start shadow-md transition-all hover:shadow-lg ${
                question.isArchived
                  ? 'border-[#3e3e3e]/50 bg-[#1f1f1f]/80 opacity-90'
                  : 'border-[#3e3e3e] bg-[#1f1f1f] hover:border-[#3e3e3e]/80'
              }`}
            >
              <button
                onClick={() => toggleVote(question.id)}
                disabled={votingQuestionId === question.id || question.isArchived}
                className={`flex flex-col items-center rounded-lg border px-3 py-2 transition shadow-sm ${
                  question.hasVoted
                    ? 'bg-[#2cbb5d]/10 border-[#2cbb5d] text-[#2cbb5d]'
                    : 'bg-[#1f1f1f] border-[#3e3e3e] text-white hover:border-[#2cbb5d]'
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
                <span className="mt-1 text-sm font-semibold">{question.voteCount}</span>
              </button>
              <div className="flex-1 space-y-3">
                <h3 className={`text-xl font-bold leading-snug ${question.isArchived ? 'text-gray-400' : 'text-white'}`}>
                  {question.content}
                </h3>
                {question.isArchived && question.videoUrl && (() => {
                  const videoId = extractYouTubeVideoId(question.videoUrl);
                  if (videoId) {
                    return (
                      <div className="mt-3">
                        <VideoCard videoId={videoId} videoUrl={question.videoUrl} />
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2">
                      <a
                        href={question.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-2 bg-blue-600/20 text-blue-400 rounded text-sm font-semibold hover:bg-blue-600/30 transition underline"
                      >
                        Watch Answer
                      </a>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between gap-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    {question.isArchived && (
                      <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-xs font-semibold">
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
                        className="px-2 py-1 text-xs rounded bg-[#1f1f1f] border border-[#3e3e3e] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2cbb5d] w-36"
                        disabled={submittingQuestionId === question.id}
                      />
                      <button
                        onClick={() => markAsAnswered(question.id, videoUrlInputs[question.id] || '')}
                        disabled={submittingQuestionId === question.id || !videoUrlInputs[question.id]?.trim()}
                        className="px-2 py-1 text-xs font-semibold rounded transition bg-blue-600/20 text-blue-400 border border-blue-600/40 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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

