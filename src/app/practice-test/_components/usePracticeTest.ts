import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type {
  QuestionBankRow,
  SessionData,
  NewSessionData,
  TestResults,
  SessionList,
  TestState,
} from './types';

export function usePracticeTest() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>('session-list');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionList, setSessionList] = useState<SessionList | null>(null);
  const [totalQuestionsInBank, setTotalQuestionsInBank] = useState<number>(0);
  const [isRetakeOfIncorrect, setIsRetakeOfIncorrect] = useState(false);
  const [retakeQuestionCount, setRetakeQuestionCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  const loadSessionList = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('QuestionBank')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalQuestionsInBank(count || 0);

      const response = await fetch('/api/test-session/list');
      if (!response.ok) throw new Error('Failed to load sessions');
      
      const data: SessionList = await response.json();
      setSessionList(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
      throw err;
    }
  };

  const startNewTest = async () => {
    try {
      setLoading(true);
      setTestState('loading');
      setError(null);

      const response = await fetch('/api/test-session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.incompleteSessionId) {
          setError(errorData.error || 'You have an incomplete session. Please complete it first.');
          setTestState('session-list');
          await loadSessionList();
          return;
        }
        throw new Error(errorData.error || 'Failed to create session');
      }
      
      const sessionData: NewSessionData = await response.json();
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('QuestionBank')
        .select('question_number, question, options, correct_answer, rationale')
        .in('question_number', sessionData.allowedQuestionNumbers)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        setError('No questions found in the database.');
        return;
      }

      setQuestions(questionsData);
      setSessionId(sessionData.sessionId);
      setAnsweredQuestions(new Set());
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsRetakeOfIncorrect(sessionData.isRetakeOfIncorrect);
      setRetakeQuestionCount(questionsData.length);
      setTestState('answering');
      questionStartTime.current = Date.now();

    } catch (err) {
      console.error('Error starting test:', err);
      setError('Failed to start test. Please try again later.');
      setTestState('session-list');
    } finally {
      setLoading(false);
    }
  };

  const continueTest = async () => {
    try {
      setLoading(true);
      setTestState('loading');
      setError(null);

      const response = await fetch('/api/test-session');
      if (!response.ok) throw new Error('Failed to get session data');
      
      const sessionData: SessionData = await response.json();
      const questionNumbersToFetch = sessionData.allowedQuestionNumbers || [];
      
      if (questionNumbersToFetch.length === 0) {
        setError('No questions found for this session.');
        return;
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('QuestionBank')
        .select('question_number, question, options, correct_answer, rationale')
        .in('question_number', questionNumbersToFetch)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        setError('No questions found in the database.');
        return;
      }

      setQuestions(questionsData);
      const answeredSet = new Set(sessionData.answeredQuestions);
      setSessionId(sessionData.sessionId);
      setAnsweredQuestions(answeredSet);
      setIsRetakeOfIncorrect(sessionData.isRetakeOfIncorrect || false);
      setRetakeQuestionCount(questionsData.length);

      if (answeredSet.size === questionsData.length) {
        await completeTestForSession(sessionData.sessionId);
        return;
      }

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
      setTestState('session-list');
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
        if (response.status !== 409) {
          throw new Error(data.error || 'Failed to save answer');
        }
      }

      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(currentQuestion.question_number);
      setAnsweredQuestions(newAnswered);

      if (newAnswered.size === questions.length) {
        await completeTest();
      } else {
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
      
      await loadSessionList();
      setTestState('session-list');
      setResults(null);
      setSessionId(null);
      setAnsweredQuestions(new Set());
      setError(null);
      setIsRetakeOfIncorrect(false);
      setRetakeQuestionCount(0);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const viewPreviousResults = (sid: string) => {
    router.push(`/practice-test/results?sessionId=${sid}`);
  };

  return {
    // State
    questions,
    loading,
    error,
    testState,
    sessionId,
    answeredQuestions,
    currentQuestionIndex,
    sessionList,
    totalQuestionsInBank,
    isRetakeOfIncorrect,
    retakeQuestionCount,
    selectedAnswer,
    submitting,
    results,
    // Actions
    loadSessionList,
    startNewTest,
    continueTest,
    handleAnswerSelect,
    handleConfirmAnswer,
    handleTakeTestAgain,
    backToSessionList,
    viewPreviousResults,
    setError,
  };
}
