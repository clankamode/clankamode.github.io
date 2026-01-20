'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePracticeTest } from './usePracticeTest';
import { SessionListView } from './SessionListView';
import { QuestionView } from './QuestionView';
import { TestResultsView } from './TestResultsView';
import { LoadingView } from './LoadingView';
import { ErrorView } from './ErrorView';

export default function PracticeTest() {
  const { status } = useSession();
  const {
    questions,
    loading,
    error,
    testState,
    answeredQuestions,
    currentQuestionIndex,
    sessionList,
    totalQuestionsInBank,
    isRetakeOfIncorrect,
    retakeQuestionCount,
    selectedAnswer,
    submitting,
    results,
    loadSessionList,
    startNewTest,
    continueTest,
    handleAnswerSelect,
    handleConfirmAnswer,
    handleTakeTestAgain,
    backToSessionList,
    viewPreviousResults,
  } = usePracticeTest();

  // Load sessions on mount
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function loadSessions() {
      try {
        await loadSessionList();
      } catch (err) {
        console.error('Error loading sessions:', err);
      }
    }

    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Session list state
  if (testState === 'session-list' && sessionList) {
    return (
      <SessionListView
        sessionList={sessionList}
        totalQuestionsInBank={totalQuestionsInBank}
        error={error}
        onStartNewTest={startNewTest}
        onContinueTest={continueTest}
        onViewPreviousResults={viewPreviousResults}
      />
    );
  }

  // Loading state
  if (loading || status === 'loading' || testState === 'loading') {
    return <LoadingView />;
  }

  // Completing state
  if (testState === 'completing') {
    return <LoadingView message="Grading your test..." />;
  }

  // Error state
  if (error && testState !== 'answering' && testState !== 'results') {
    return <ErrorView error={error} onBack={backToSessionList} />;
  }

  // Results state
  if (testState === 'results' && results) {
    return (
      <TestResultsView
        results={results}
        onTakeTestAgain={handleTakeTestAgain}
        onBackToTests={backToSessionList}
      />
    );
  }

  // Answering state
  if (testState === 'answering' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const questionsCompleted = answeredQuestions.size;

    return (
      <QuestionView
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        questionsCompleted={questionsCompleted}
        selectedAnswer={selectedAnswer}
        submitting={submitting}
        isRetakeOfIncorrect={isRetakeOfIncorrect}
        retakeQuestionCount={retakeQuestionCount}
        onAnswerSelect={handleAnswerSelect}
        onConfirmAnswer={handleConfirmAnswer}
      />
    );
  }

  // Fallback loading state
  return <LoadingView />;
}
