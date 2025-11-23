'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Question {
  question: string;
  options: string[];
  answer: string;
  rationale: string;
}

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

type TestState = 'answering' | 'feedback' | 'results';

export default function PracticeTest() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [testState, setTestState] = useState<TestState>('answering');
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('QuestionBank')
          .select('question_number, question, options, correct_answer, rationale')
          .order('question_number', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setError('No questions found in the database.');
          return;
        }

        // Transform the data to match the expected format
        const transformedQuestions: Question[] = data.map((row: QuestionBankRow) => ({
          question: row.question,
          options: [
            `A. ${row.options.A}`,
            `B. ${row.options.B}`,
            `C. ${row.options.C}`,
            `D. ${row.options.D}`
          ],
          answer: row.correct_answer,
          rationale: row.rationale
        }));

        setQuestions(transformedQuestions);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  const handleAnswerSelect = (option: string) => {
    if (testState === 'answering') {
      setSelectedAnswer(option);
    }
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer || questions.length === 0) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
    setTestState('feedback');
  };

  const handleNextQuestion = () => {
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    if (isLastQuestion) {
      setTestState('results');
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTestState('answering');
    }
  };

  const handleRestartTest = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setTestState('answering');
    setIsCorrect(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
            <p className="text-white text-lg">Loading questions...</p>
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
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Questions</h2>
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

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  if (testState === 'results') {
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Test Complete! 🎉
          </h1>
          
          <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#2cbb5d] mb-2">
                {score}/{totalQuestions}
              </div>
              <div className="text-2xl text-white mb-4">
                {percentage}%
              </div>
              <p className="text-gray-400">
                {percentage >= 70 
                  ? 'Great job! You passed the practice test.' 
                  : 'Keep practicing! Review the material and try again.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRestartTest}
            className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Restart Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-[#282828] rounded-lg p-6 shadow-lg">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#2cbb5d] font-semibold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-gray-400">
              Score: {score}/{currentQuestionIndex + (testState === 'feedback' ? 1 : 0)}
            </span>
          </div>
          <div className="w-full bg-[#1a1a1a] rounded-full h-2">
            <div
              className="bg-[#2cbb5d] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-white mb-6">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const optionLetter = option.charAt(0); // "A", "B", "C", or "D"
            const isSelected = selectedAnswer === optionLetter;
            const isCorrectAnswer = optionLetter === currentQuestion.answer;
            
            let optionClasses = 'w-full text-left p-4 rounded-lg border-2 transition-all ';
            
            if (testState === 'answering') {
              optionClasses += isSelected
                ? 'border-[#2cbb5d] bg-[#2cbb5d]/10 text-white'
                : 'border-[#3e3e3e] bg-[#1a1a1a] text-white hover:border-[#2cbb5d]/50';
            } else if (testState === 'feedback') {
              if (isCorrectAnswer) {
                optionClasses += 'border-green-500 bg-green-500/10 text-white';
              } else if (isSelected && !isCorrect) {
                optionClasses += 'border-red-500 bg-red-500/10 text-white';
              } else {
                optionClasses += 'border-[#3e3e3e] bg-[#1a1a1a] text-gray-400';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(optionLetter)}
                disabled={testState === 'feedback'}
                className={optionClasses}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {testState === 'feedback' && (
          <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {isCorrect ? '✓' : '✗'}
              </span>
              <div>
                <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-white mb-2">
                    The correct answer is: <span className="font-semibold text-green-400">{currentQuestion.answer}</span>
                  </p>
                )}
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold">Explanation:</span> {currentQuestion.rationale}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {testState === 'answering' ? (
          <button
            onClick={handleConfirmAnswer}
            disabled={!selectedAnswer}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
              selectedAnswer
                ? 'bg-[#2cbb5d] hover:bg-[#25a352] text-white'
                : 'bg-[#3e3e3e] text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-[#2cbb5d] hover:bg-[#25a352] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLastQuestion ? 'View Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}

