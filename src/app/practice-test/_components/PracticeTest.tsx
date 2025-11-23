'use client';

import { useState } from 'react';
import questionBank from './questions.json';

interface Question {
  question: string;
  options: string[];
  answer: string;
  rationale: string;
}

type TestState = 'answering' | 'feedback' | 'results';

export default function PracticeTest() {
  const questions: Question[] = questionBank;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [testState, setTestState] = useState<TestState>('answering');
  const [isCorrect, setIsCorrect] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswerSelect = (option: string) => {
    if (testState === 'answering') {
      setSelectedAnswer(option);
    }
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer) return;

    const correct = selectedAnswer === currentQuestion.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
    setTestState('feedback');
  };

  const handleNextQuestion = () => {
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

