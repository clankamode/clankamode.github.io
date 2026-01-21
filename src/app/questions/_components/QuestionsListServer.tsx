import { Question } from '@/lib/questions';

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

interface QuestionsListServerProps {
  questions: Question[];
  tab: 'answered' | 'unanswered';
}

export default function QuestionsListServer({ questions, tab }: QuestionsListServerProps) {
  // Filter by tab
  const filtered = questions.filter((question) => {
    if (tab === 'answered') {
      return question.isArchived;
    } else {
      return !question.isArchived;
    }
  });

  // Sort by vote count (descending), then by creation date (ascending)
  const sorted = [...filtered].sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-subtle bg-surface-workbench p-6 text-center text-muted-foreground">
        {tab === 'answered' 
          ? 'No answered questions yet.' 
          : 'No questions yet. Be the first to ask!'}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sorted.map((question) => {
        const videoId = question.videoUrl ? extractYouTubeVideoId(question.videoUrl) : null;
        const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId) : null;

        return (
          <li
            key={question.id}
            className={`frame p-5 flex gap-4 items-start transition-all ${
              question.isArchived
                ? 'bg-surface-workbench/80 opacity-90'
                : 'bg-surface-workbench hover:bg-surface-interactive/80'
            }`}
          >
            <div className="flex flex-col items-center rounded-lg border px-3 py-2 bg-surface-interactive border-border-subtle text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="h-6 w-6"
              >
                <path d="M12 4l-7 8h4v6h6v-6h4z" />
              </svg>
              <span className="mt-1 text-base font-semibold">{question.voteCount}</span>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className={`text-2xl font-bold leading-snug ${question.isArchived ? 'text-muted-foreground' : 'text-foreground'}`}>
                {question.content}
              </h3>
              {question.isArchived && question.videoUrl && videoId && thumbnailUrl && (
                <div className="mt-3">
                  <a
                    href={question.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="frame relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-surface-interactive transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl}
                        alt={`Video answer for: ${question.content}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  {question.isArchived && (
                    <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-sm font-semibold">
                      Answered
                    </span>
                  )}
                  <time dateTime={question.createdAt}>
                    {new Date(question.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

