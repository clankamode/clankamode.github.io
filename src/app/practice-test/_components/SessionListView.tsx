import type { SessionList } from './types';

interface SessionListViewProps {
  sessionList: SessionList;
  totalQuestionsInBank: number;
  error: string | null;
  onStartNewTest: () => void;
  onContinueTest: () => void;
  onViewPreviousResults: (sessionId: string) => void;
}

export function SessionListView({
  sessionList,
  totalQuestionsInBank,
  error,
  onStartNewTest,
  onContinueTest,
  onViewPreviousResults,
}: SessionListViewProps) {
  const hasIncompleteSession = sessionList.incomplete.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="frame bg-surface-workbench p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-foreground mb-6">Practice Tests</h1>
        
        {error && (
          <div className="mb-6 bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}
        
        {sessionList.incomplete.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Continue Where You Left Off</h2>
            <div className="space-y-3">
              {sessionList.incomplete.map((session) => {
                const isComplete = session.total_questions === totalQuestionsInBank && totalQuestionsInBank > 0;
                
                return (
                  <div key={session.id} className={`bg-surface-interactive rounded-lg p-4 border-2 ${
                    isComplete ? 'border-blue-500/30' : 'border-brand-green/30'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-foreground font-medium">
                          {isComplete ? 'Ready to Grade' : 'In Progress'}
                        </p>
                        <p className="text-muted-foreground text-base">
                          Started: {new Date(session.started_at).toLocaleDateString()} at{' '}
                          {new Date(session.started_at).toLocaleTimeString()}
                        </p>
                        <p className="text-muted-foreground text-base">
                          {session.total_questions} question{session.total_questions !== 1 ? 's' : ''} answered
                          {isComplete && ' ✓'}
                        </p>
                      </div>
                      <button
                        onClick={onContinueTest}
                        className={`font-semibold py-2 px-6 rounded-lg transition-colors ${
                          isComplete
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-brand-green hover:bg-brand-green/90 text-black'
                        }`}
                      >
                        {isComplete ? 'View Results' : 'Continue'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasIncompleteSession && (
          <div className="mb-4 bg-orange-500/10 border-2 border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-400 font-medium text-center">
              Complete your current test before starting a new one
            </p>
          </div>
        )}

        <button
          onClick={onStartNewTest}
          disabled={hasIncompleteSession}
          className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors mb-8 ${
            hasIncompleteSession
              ? 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
              : 'bg-brand-green hover:bg-brand-green/90 text-black'
          }`}
        >
          Start New Practice Test
        </button>

        {sessionList.completed.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Previous Tests</h2>
            <div className="space-y-3">
              {sessionList.completed.map((session) => (
                <div key={session.id} className="bg-surface-interactive rounded-lg p-4 border-2 border-border-subtle hover:border-border-interactive transition-colors">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="text-foreground font-medium">
                        Completed: {new Date(session.completed_at!).toLocaleDateString()} at{' '}
                        {new Date(session.completed_at!).toLocaleTimeString()}
                      </p>
                      <p className="text-muted-foreground text-base">
                        {session.total_questions} questions
                      </p>
                      <div className="mt-2">
                        <p className="text-3xl font-bold text-brand-green">
                          {session.score_percentage}%
                        </p>
                        <p className="text-muted-foreground text-base">
                          {session.correct_answers}/{session.total_questions} correct
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewPreviousResults(session.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
