import type { TestResults } from './types';

interface TestResultsViewProps {
  results: TestResults;
  onTakeTestAgain: () => void;
  onBackToTests: () => void;
}

export function TestResultsView({
  results,
  onTakeTestAgain,
  onBackToTests,
}: TestResultsViewProps) {
  const incorrectCount = results.incorrectAnswers.length;
  const passingScore = 70;
  const passed = results.scorePercentage >= passingScore;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="frame bg-surface-workbench p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="text-7xl mb-3">
            {passed ? '🎉' : '📚'}
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {passed ? 'Congratulations!' : 'Test Complete'}
          </h1>
          <p className="text-muted-foreground">
            {passed 
              ? 'You passed the practice test!' 
              : 'Keep studying and try again!'}
          </p>
        </div>
        
        <div className="bg-surface-interactive rounded-lg p-6 mb-6 border-2 border-brand-green/30">
          <div className="text-center mb-4">
            <div className="text-7xl font-bold text-brand-green mb-2">
              {results.scorePercentage}%
            </div>
            <p className="text-2xl text-foreground font-semibold">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </p>
          </div>

          <div className="w-full bg-surface-dense rounded-full h-4 mb-4">
            <div
              className="bg-brand-green h-4 rounded-full transition-all duration-500"
              style={{ width: `${results.scorePercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-surface-dense rounded-lg p-4 text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">
                {results.correctAnswers}
              </div>
              <p className="text-muted-foreground text-base">Correct Answers</p>
            </div>
            <div className="bg-surface-dense rounded-lg p-4 text-center">
              <div className="text-4xl font-bold text-red-400 mb-1">
                {incorrectCount}
              </div>
              <p className="text-muted-foreground text-base">Incorrect Answers</p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg text-center ${
            passed 
              ? 'bg-green-500/10 border-2 border-green-500/30' 
              : 'bg-orange-500/10 border-2 border-orange-500/30'
          }`}>
            <p className={`font-semibold ${passed ? 'text-green-400' : 'text-orange-400'}`}>
              {passed 
                ? `✓ Passed (${passingScore}% required)` 
                : `Need ${passingScore}% to pass (${passingScore - results.scorePercentage}% short)`}
            </p>
          </div>
        </div>

        {results.unitBreakdown && results.unitBreakdown.length > 0 && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-4">📊 Performance by Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.unitBreakdown.map((unitStats) => (
                <div key={unitStats.unit} className="bg-surface-interactive rounded-lg p-5 border-2 border-border-subtle">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{unitStats.unit}</h3>
                      <p className="text-muted-foreground text-base">
                        {unitStats.correct}/{unitStats.total} correct
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${
                      unitStats.percentage >= 70 ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {unitStats.percentage}%
                    </div>
                  </div>
                  <div className="w-full bg-surface-dense rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        unitStats.percentage >= 70 ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${unitStats.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.incorrectAnswers.length === 0 && (
          <div className="mb-6 bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 text-center">
            <div className="text-5xl mb-2">✨</div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">Perfect Score!</h2>
            <p className="text-muted-foreground">You answered all questions correctly. Excellent work!</p>
          </div>
        )}

        {results.incorrectAnswers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              📝 Review Incorrect Answers ({results.incorrectAnswers.length})
            </h2>
            <div className="space-y-4">
              {results.incorrectAnswers.map((item, index) => (
                <div key={index} className="bg-surface-interactive rounded-lg p-6 border-2 border-red-500/30">
                  <div className="mb-3">
                    <span className="text-red-400 font-semibold">Question {item.questionNumber}</span>
                    <h3 className="text-foreground font-medium mt-2">{item.question}</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {Object.entries(item.options).map(([letter, text]) => {
                      const isUserAnswer = letter === item.userAnswer;
                      const isCorrectAnswer = letter === item.correctAnswer;
                      
                      let classes = 'p-3 rounded border-2 ';
                      if (isCorrectAnswer) {
                        classes += 'border-green-500 bg-green-500/10 text-white';
                      } else if (isUserAnswer) {
                        classes += 'border-red-500 bg-red-500/10 text-white';
                      } else {
                        classes += 'border-border-subtle bg-surface-dense text-muted-foreground';
                      }
                      
                      return (
                        <div key={letter} className={classes}>
                          <span className="font-semibold">{letter}.</span> {text}
                          {isCorrectAnswer && <span className="ml-2 text-green-400">✓ Correct Answer</span>}
                          {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-red-400">✗ Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-surface-dense p-4 rounded border-l-4 border-brand-green">
                    <div className="mb-3 pb-3 border-b border-border-subtle">
                      <p className="text-sm font-semibold text-blue-400 mb-1">{item.unit}</p>
                      <p className="text-sm text-muted-foreground">{item.knowledgeArea}</p>
                    </div>
                    <p className="text-muted-foreground text-base">
                      <span className="font-semibold text-brand-green">Explanation:</span> {item.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onTakeTestAgain}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Take Test Again
          </button>
          <button
            onClick={onBackToTests}
            className="w-full bg-surface-interactive hover:bg-surface-dense text-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
}
