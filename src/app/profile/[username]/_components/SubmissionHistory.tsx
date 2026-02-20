import Link from 'next/link';

interface Submission {
  question_id: string;
  question_name: string;
  difficulty: string;
  solved_at: string;
}

interface SubmissionHistoryProps {
  submissions: Submission[];
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    Medium: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
    Hard: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
  };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border ${colors[difficulty] ?? 'bg-muted text-muted-foreground border-transparent'}`}
    >
      {difficulty}
    </span>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SubmissionHistory({ submissions }: SubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Submissions</h2>
        <p className="text-sm text-muted-foreground">No questions solved yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Submissions</h2>
      <div className="space-y-1.5 sm:space-y-2">
        {submissions.map((sub) => (
          <Link
            key={sub.question_id}
            href={`/code-editor/practice/${sub.question_id}`}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-3 py-2.5 sm:py-2 rounded-lg hover:bg-surface-interactive transition-colors group touch-manipulation"
          >
            <span className="text-sm text-foreground group-hover:text-brand-green transition-colors truncate sm:pr-3">
              {sub.question_name}
            </span>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <DifficultyBadge difficulty={sub.difficulty} />
              <span className="text-xs text-muted-foreground">{formatDate(sub.solved_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
