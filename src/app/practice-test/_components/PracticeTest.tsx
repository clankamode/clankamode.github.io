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

interface SessionListItem {
  id: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number | null;
  score_percentage: number | null;
}

interface SessionList {
  incomplete: SessionListItem[];
  completed: SessionListItem[];
}

type TestState = 'session-list' | 'loading' | 'answering' | 'completing' | 'results';

export default function PracticeTest() {
  const { status } = useSession();
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>('session-list');
  
  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionList, setSessionList] = useState<SessionList | null>(null);
  const [totalQuestionsInBank, setTotalQuestionsInBank] = useState<number>(0);
  
  // Answer tracking
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  
  // Results
  const [results, setResults] = useState<TestResults | null>(null);

  // Load sessions on mount
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function loadSessions() {
      try {
        setLoading(true);
        
        // Fetch total question count
        const { count, error: countError } = await supabase
          .from('QuestionBank')
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        setTotalQuestionsInBank(count || 0);

        const response = await fetch('/api/test-session/list');
        if (!response.ok) throw new Error('Failed to load sessions');
        
        const data: SessionList = await response.json();
        setSessionList(data);
        setTestState('session-list');
      } catch (err) {
        console.error('Error loading sessions:', err);
        setError('Failed to load sessions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [status]);

  const startNewTest = async () => {
    try {
      setLoading(true);
      setTestState('loading');
      
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

      // Create new session
      const response = await fetch('/api/test-session', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create session');
      
      const sessionData: SessionData = await response.json();
      setSessionId(sessionData.sessionId);
      setAnsweredQuestions(new Set());
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setTestState('answering');
      questionStartTime.current = Date.now();

    } catch (err) {
      console.error('Error starting test:', err);
      setError('Failed to start test. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const continueTest = async (session: SessionListItem) => {
    try {
      setLoading(true);
      setTestState('loading');
      
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

      // Get answers for this session
      const { data: answers, error: answersError } = await supabase
        .from('TestAnswer')
        .select('question_number')
        .eq('session_id', session.id)
        .order('question_number', { ascending: true });

      if (answersError) throw answersError;

      const answeredSet = new Set(answers?.map(a => a.question_number) || []);
      setSessionId(session.id);
      setAnsweredQuestions(answeredSet);

      // Check if all questions are answered
      if (answeredSet.size === questionsData.length) {
        // All questions answered, complete the test
        await completeTestForSession(session.id);
        return;
      }

      // Find first unanswered question
      const firstUnanswered = questionsData.findIndex(
        q => !answeredSet.has(q.question_number)
      );
      
      setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      setSelectedAnswer(null);
      setTestState('answering');
      questionStartTime.current = Date.now();

    } catch (err) {
      console.error('Error continuing test:', err);
      setError('Failed to continue test. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const completeTestForSession = async (sid: string) => {
    try {
      setTestState('completing');

      const response = await fetch('/api/test-session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      });

      if (!response.ok) throw new Error('Failed to complete test');

      const resultsData: TestResults = await response.json();
      setResults(resultsData);
      setTestState('results');

    } catch (err) {
      console.error('Error completing test:', err);
      setError('Failed to complete test. Please try again.');
      setTestState('session-list');
    }
  };

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
    setResults(null);
    await startNewTest();
  };

  const backToSessionList = async () => {
    try {
      setLoading(true);
      setTestState('loading');
      
      // Fetch total question count
      const { count, error: countError } = await supabase
        .from('QuestionBank')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalQuestionsInBank(count || 0);

      const response = await fetch('/api/test-session/list');
      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data: SessionList = await response.json();
      setSessionList(data);
      setTestState('session-list');
      setResults(null);
      setSessionId(null);
      setAnsweredQuestions(new Set());
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const viewPreviousResults = async (sessionId: string) => {
    try {
      setLoading(true);
      setTestState('loading');

      const response = await fetch(`/api/test-session/results?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch results');

      const resultsData: TestResults = await response.json();
      setResults(resultsData);
      setSessionId(sessionId);
      setTestState('results');
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Session list state
  if (testState === 'session-list' && sessionList) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6">Practice Tests</h1>
          
          {/* Incomplete Sessions */}
          {sessionList.incomplete.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#2cbb5d] mb-4">Continue Where You Left Off</h2>
              <div className="space-y-3">
                {sessionList.incomplete.map((session) => {
                  const isComplete = session.total_questions === totalQuestionsInBank && totalQuestionsInBank > 0;
                  
                  return (
                    <div key={session.id} className={`bg-[#1a1a1a] rounded-lg p-4 border-2 ${
                      isComplete ? 'border-blue-500/30' : 'border-[#2cbb5d]/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">
                            {isComplete ? 'Ready to Grade' : 'In Progress'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Started: {new Date(session.started_at).toLocaleDateString()} at{' '}
                            {new Date(session.started_at).toLocaleTimeString()}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {session.total_questions} question{session.total_questions !== 1 ? 's' : ''} answered
                            {isComplete && ' ✓'}
                          </p>
                        </div>
                        <button
                          onClick={() => continueTest(session)}
                          className={`font-semibold py-2 px-6 rounded-lg transition-colors ${
                            isComplete
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-[#2cbb5d] hover:bg-[#25a352] text-white'
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

          {/* Start New Test Button */}
          <button
            onClick={startNewTest}
            className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-4 px-6 rounded-lg transition-colors mb-8"
          >
            Start New Practice Test
          </button>

          {/* Completed Sessions */}
          {sessionList.completed.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Previous Tests</h2>
              <div className="space-y-3">
                {sessionList.completed.map((session) => (
                  <div key={session.id} className="bg-[#1a1a1a] rounded-lg p-4 border-2 border-[#3e3e3e] hover:border-[#2cbb5d]/50 transition-colors">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          Completed: {new Date(session.completed_at!).toLocaleDateString()} at{' '}
                          {new Date(session.completed_at!).toLocaleTimeString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {session.total_questions} questions
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#2cbb5d]">
                            {Math.round(session.score_percentage || 0)}%
                          </p>
                          <p className="text-gray-400 text-sm">
                            {session.correct_answers}/{session.total_questions} correct
                          </p>
                        </div>
                        <button
                          onClick={() => viewPreviousResults(session.id)}
                          className="bg-[#3e3e3e] hover:bg-[#2cbb5d] text-white font-semibold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
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

  // Loading state
  if (loading || status === 'loading' || testState === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
            <p className="text-white text-lg">Loading...</p>
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
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={backToSessionList}
              className="bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  if (testState === 'results' && results) {
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
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-[#2cbb5d]">Explanation:</span> {item.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleTakeTestAgain}
              className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Take Test Again
            </button>
            <button
              onClick={backToSessionList}
              className="w-full bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Tests
            </button>
          </div>
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
