'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface IncorrectAnswer {
  questionNumber: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userAnswer: string;
  correctAnswer: string;
  rationale: string;
  unit: string;
  knowledgeArea: string;
}

interface UnitBreakdown {
  unit: string;
  correct: number;
  total: number;
  percentage: number;
}

interface TestResults {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  incorrectAnswers: IncorrectAnswer[];
  unitBreakdown: UnitBreakdown[];
}

export default function ResultsPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');
  
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    async function fetchResults() {
      try {
        setLoading(true);
        const response = await fetch(`/api/test-session/results?sessionId=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load results');
        }

        const resultsData: TestResults = await response.json();
        setResults(resultsData);
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load test results. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [status, sessionId]);

  const handleBackToTests = () => {
    router.push('/practice-test');
  };

  const handleTakeTestAgain = () => {
    router.push('/practice-test');
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
            <p className="text-white text-lg">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !results) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-400 mb-6">
              {error || 'No results found'}
            </p>
            <button
              onClick={handleBackToTests}
              className="bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results display
  const incorrectCount = results.incorrectAnswers.length;
  const passingScore = 70;
  const passed = results.scorePercentage >= passingScore;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
        {/* Header with emoji */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">
            {passed ? '🎉' : '📚'}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {passed ? 'Congratulations!' : 'Test Complete'}
          </h1>
          <p className="text-gray-400">
            {passed 
              ? 'You passed the practice test!' 
              : 'Keep studying and try again!'}
          </p>
        </div>
        
        {/* Score Summary */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border-2 border-[#2cbb5d]/30">
          <div className="text-center mb-4">
            <div className="text-6xl font-bold text-[#2cbb5d] mb-2">
              {results.scorePercentage}%
            </div>
            <p className="text-xl text-white font-semibold">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#0a0a0a] rounded-full h-4 mb-4">
            <div
              className="bg-[#2cbb5d] h-4 rounded-full transition-all duration-500"
              style={{ width: `${results.scorePercentage}%` }}
            />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {results.correctAnswers}
              </div>
              <p className="text-gray-400 text-sm">Correct Answers</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {incorrectCount}
              </div>
              <p className="text-gray-400 text-sm">Incorrect Answers</p>
            </div>
          </div>

          {/* Pass/Fail Indicator */}
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

        {/* Unit Breakdown */}
        {results.unitBreakdown && results.unitBreakdown.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Performance by Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.unitBreakdown.map((unitStats) => (
                <div key={unitStats.unit} className="bg-[#1a1a1a] rounded-lg p-5 border-2 border-[#3e3e3e]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{unitStats.unit}</h3>
                      <p className="text-gray-400 text-sm">
                        {unitStats.correct}/{unitStats.total} correct
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${
                      unitStats.percentage >= 70 ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {unitStats.percentage}%
                    </div>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-3">
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

        {/* Perfect Score Message */}
        {results.incorrectAnswers.length === 0 && (
          <div className="mb-6 bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✨</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Perfect Score!</h2>
            <p className="text-gray-300">You answered all questions correctly. Excellent work!</p>
          </div>
        )}

        {/* Incorrect Answers Review */}
        {results.incorrectAnswers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              📝 Review Incorrect Answers ({results.incorrectAnswers.length})
            </h2>
            <div className="space-y-4">
              {results.incorrectAnswers.map((item, index) => (
                <div key={index} className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-red-500/30">
                  <div className="mb-3">
                    <span className="text-red-400 font-semibold">Question {item.questionNumber}</span>
                    <h3 className="text-white font-medium mt-2">{item.question}</h3>
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
                        classes += 'border-[#3e3e3e] bg-[#0a0a0a] text-gray-400';
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
                  
                  <div className="bg-[#0a0a0a] p-4 rounded border-l-4 border-[#2cbb5d]">
                    <div className="mb-3 pb-3 border-b border-gray-700">
                      <p className="text-xs font-semibold text-blue-400 mb-1">{item.unit}</p>
                      <p className="text-xs text-gray-400">{item.knowledgeArea}</p>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-[#2cbb5d]">Explanation:</span> {item.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleTakeTestAgain}
            className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Take Test Again
          </button>
          <button
            onClick={handleBackToTests}
            className="w-full bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
}

