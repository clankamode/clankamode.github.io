'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

interface QuestionBankRow {
  question_number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  rationale: string;
}

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
}

interface SessionData {
  sessionId: string;
  answeredQuestions: number[];
  totalQuestions: number;
}

interface TestResults {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  incorrectAnswers: IncorrectAnswer[];
}

type TestState = 'loading' | 'answering' | 'completing' | 'results';

export default function PracticeTest() {
  const { status } = useSession();
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>('loading');
  
  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Answer tracking
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  
  // Results
  const [results, setResults] = useState<TestResults | null>(null);

  // Initialize session and load questions
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function initializeTest() {
      try {
        setLoading(true);
        
        // Fetch all questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('QuestionBank')
          .select('question_number, question, options, correct_answer, rationale')
          .order('question_number', { ascending: true });

        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
          setError('No questions found in the database.');
          return;
        }

        setQuestions(questionsData);

        // Get or create session
        const response = await fetch('/api/test-session');
        if (!response.ok) throw new Error('Failed to get session');
        
        const sessionData: SessionData = await response.json();
        setSessionId(sessionData.sessionId);
        setAnsweredQuestions(new Set(sessionData.answeredQuestions));

        // Find first unanswered question
        const answeredSet = new Set(sessionData.answeredQuestions);
        const firstUnanswered = questionsData.findIndex(
          q => !answeredSet.has(q.question_number)
        );
        
        setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
        setTestState('answering');
        questionStartTime.current = Date.now();

      } catch (err) {
        console.error('Error initializing test:', err);
        setError('Failed to load test. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    initializeTest();
  }, [status]);

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || !sessionId || submitting) return;

    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    try {
      setSubmitting(true);

      const response = await fetch('/api/test-session/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionNumber: currentQuestion.question_number,
          userAnswer: selectedAnswer,
          timeSpentSeconds: timeSpent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          // Answer already recorded, just move on
          console.log('Answer already recorded');
        } else {
          throw new Error(data.error || 'Failed to save answer');
        }
      }

      // Update local state
      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(currentQuestion.question_number);
      setAnsweredQuestions(newAnswered);

      // Check if this was the last question
      if (newAnswered.size === questions.length) {
        await completeTest();
      } else {
        // Move to next unanswered question
        const nextUnanswered = questions.findIndex(
          q => !newAnswered.has(q.question_number)
        );
        setCurrentQuestionIndex(nextUnanswered >= 0 ? nextUnanswered : currentQuestionIndex + 1);
        setSelectedAnswer(null);
        questionStartTime.current = Date.now();
      }

    } catch (err) {
      console.error('Error saving answer:', err);
      alert('Failed to save answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTest = async () => {
    if (!sessionId) return;

    try {
      setTestState('completing');

      const response = await fetch('/api/test-session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error('Failed to complete test');

      const resultsData: TestResults = await response.json();
      setResults(resultsData);
      setTestState('results');

    } catch (err) {
      console.error('Error completing test:', err);
      setError('Failed to complete test. Please try again.');
    }
  };

  const handleTakeTestAgain = async () => {
    try {
      setLoading(true);
      
      // Create new session
      const response = await fetch('/api/test-session', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create new session');

      const sessionData: SessionData = await response.json();
      setSessionId(sessionData.sessionId);
      setAnsweredQuestions(new Set());
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setResults(null);
      setTestState('answering');
      questionStartTime.current = Date.now();

    } catch (err) {
      console.error('Error creating new session:', err);
      setError('Failed to start new test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
            <p className="text-white text-lg">Loading test...</p>
          </div>
        </div>
      </div>
    );
  }

  // Completing state
  if (testState === 'completing') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
            <p className="text-white text-lg">Grading your test...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-400 mb-6">
              {error || 'No questions available.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  if (testState === 'results' && results) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Test Complete!
          </h1>
          
          {/* Score Summary */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#2cbb5d] mb-2">
                {results.correctAnswers}/{results.totalQuestions}
              </div>
              <div className="text-2xl text-white mb-4">
                {results.scorePercentage}%
              </div>
              <p className="text-gray-400">
                {results.scorePercentage >= 70 
                  ? 'Great job! You passed the practice test.' 
                  : 'Keep practicing! Review the material and try again.'}
              </p>
            </div>
          </div>

          {/* Incorrect Answers Review */}
          {results.incorrectAnswers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Review Incorrect Answers ({results.incorrectAnswers.length})
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
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-[#2cbb5d]">Explanation:</span> {item.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleTakeTestAgain}
            className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Take Test Again
          </button>
        </div>
      </div>
    );
  }

  // Answering state
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const questionsCompleted = answeredQuestions.size;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-[#282828] rounded-lg p-6 shadow-lg">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#2cbb5d] font-semibold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-[#1a1a1a] rounded-full h-2">
            <div
              className="bg-[#2cbb5d] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionsCompleted / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-white mb-6">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {Object.entries(currentQuestion.options).map(([letter, text]) => {
            const isSelected = selectedAnswer === letter;
            
            const optionClasses = `w-full text-left p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-[#2cbb5d] bg-[#2cbb5d]/10 text-white'
                : 'border-[#3e3e3e] bg-[#1a1a1a] text-white hover:border-[#2cbb5d]/50'
            }`;

            return (
              <button
                key={letter}
                onClick={() => handleAnswerSelect(letter)}
                disabled={submitting}
                className={optionClasses}
              >
                <span className="font-semibold">{letter}.</span> {text}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirmAnswer}
          disabled={!selectedAnswer || submitting}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
            selectedAnswer && !submitting
              ? 'bg-[#2cbb5d] hover:bg-[#25a352] text-white'
              : 'bg-[#3e3e3e] text-gray-500 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}
