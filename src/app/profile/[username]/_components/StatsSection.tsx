interface Stats {
  questionsSolved: number;
  totalQuestions: number;
  articlesRead: number;
}

interface StatsSectionProps {
  stats: Stats;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const solvedPercent =
    stats.totalQuestions > 0
      ? Math.round((stats.questionsSolved / stats.totalQuestions) * 100)
      : 0;

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stats</h2>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm text-muted-foreground truncate">Questions Solved</span>
            <span className="text-sm font-mono font-medium text-foreground flex-shrink-0">
              {stats.questionsSolved} / {stats.totalQuestions}
            </span>
          </div>
          <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-700"
              style={{ width: `${solvedPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{solvedPercent}% complete</p>
        </div>

        <div className="flex items-center justify-between gap-2 py-3 border-t border-border-subtle">
          <span className="text-sm text-muted-foreground truncate">Articles Read</span>
          <span className="text-sm font-mono font-medium text-foreground flex-shrink-0">{stats.articlesRead}</span>
        </div>
      </div>
    </div>
  );
}
