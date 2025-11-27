import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    const effectiveEmail = (token?.proxyEmail as string | null) || token?.email;

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = effectiveEmail;

    // Check for existing incomplete session by email
    const { data: existingSession, error: sessionError } = await supabase
      .from('TestSession')
      .select('id, started_at, total_questions')
      .eq('email', userEmail)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    if (existingSession) {
      // Get answered question numbers
      const { data: answers, error: answersError } = await supabase
        .from('TestAnswer')
        .select('question_number')
        .eq('session_id', existingSession.id)
        .order('question_number', { ascending: true });

      if (answersError) throw answersError;

      // Calculate which questions should be in this session
      // Find the most recent completed session
      const { data: previousSession, error: prevSessionError } = await supabase
        .from('TestSession')
        .select('id, completed_at')
        .eq('email', userEmail)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (prevSessionError && prevSessionError.code !== 'PGRST116') {
        throw prevSessionError;
      }

      let allowedQuestionNumbers: number[] = [];
      let isRetakeOfIncorrect = false;

      if (previousSession) {
        // Get incorrect answers from the previous session
        const { data: incorrectAnswers, error: incorrectError } = await supabase
          .from('TestAnswer')
          .select('question_number')
          .eq('session_id', previousSession.id)
          .eq('is_correct', false)
          .order('question_number', { ascending: true });

        if (incorrectError) throw incorrectError;

        if (incorrectAnswers && incorrectAnswers.length > 0) {
          allowedQuestionNumbers = incorrectAnswers.map(a => a.question_number);
          isRetakeOfIncorrect = true;
        } else {
          // Perfect score - all questions
          const { data: allQuestions, error: allQuestionsError } = await supabase
            .from('QuestionBank')
            .select('question_number')
            .order('question_number', { ascending: true });

          if (allQuestionsError) throw allQuestionsError;
          allowedQuestionNumbers = allQuestions?.map(q => q.question_number) || [];
        }
      } else {
        // First session - all questions
        const { data: allQuestions, error: allQuestionsError } = await supabase
          .from('QuestionBank')
          .select('question_number')
          .order('question_number', { ascending: true });

        if (allQuestionsError) throw allQuestionsError;
        allowedQuestionNumbers = allQuestions?.map(q => q.question_number) || [];
      }

      return NextResponse.json({
        sessionId: existingSession.id,
        answeredQuestions: answers?.map(a => a.question_number) || [],
        totalQuestions: existingSession.total_questions,
        allowedQuestionNumbers,
        isRetakeOfIncorrect,
      });
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('TestSession')
      .insert({
        email: userEmail,
        total_questions: 0,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return NextResponse.json({
      sessionId: newSession.id,
      answeredQuestions: [],
      totalQuestions: 0,
    });

  } catch (error) {
    console.error('Error in test-session GET:', error);
    return NextResponse.json(
      { error: 'Failed to get or create session' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    const effectiveEmail = (token?.proxyEmail as string | null) || token?.email;

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = effectiveEmail;

    // Check for existing incomplete sessions
    const { data: incompleteSessions, error: incompleteError } = await supabase
      .from('TestSession')
      .select('id, started_at')
      .eq('email', userEmail)
      .is('completed_at', null)
      .limit(1);

    if (incompleteError) throw incompleteError;

    if (incompleteSessions && incompleteSessions.length > 0) {
      return NextResponse.json(
        { 
          error: 'You have an incomplete session. Please complete or view it before starting a new test.',
          incompleteSessionId: incompleteSessions[0].id
        },
        { status: 400 }
      );
    }

    // Get the most recent completed session
    const { data: lastCompletedSession, error: lastSessionError } = await supabase
      .from('TestSession')
      .select('id')
      .eq('email', userEmail)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (lastSessionError && lastSessionError.code !== 'PGRST116') {
      throw lastSessionError;
    }

    let allowedQuestionNumbers: number[] = [];
    let isRetakeOfIncorrect = false;

    if (lastCompletedSession) {
      // Get all incorrect answers from the last completed session
      const { data: incorrectAnswers, error: incorrectError } = await supabase
        .from('TestAnswer')
        .select('question_number')
        .eq('session_id', lastCompletedSession.id)
        .eq('is_correct', false)
        .order('question_number', { ascending: true });

      if (incorrectError) throw incorrectError;

      if (incorrectAnswers && incorrectAnswers.length > 0) {
        // User got some questions wrong - only show those
        allowedQuestionNumbers = incorrectAnswers.map(a => a.question_number);
        isRetakeOfIncorrect = true;
      } else {
        // Perfect score or no answers recorded - show all questions
        const { data: allQuestions, error: allQuestionsError } = await supabase
          .from('QuestionBank')
          .select('question_number')
          .order('question_number', { ascending: true });

        if (allQuestionsError) throw allQuestionsError;
        allowedQuestionNumbers = allQuestions?.map(q => q.question_number) || [];
        isRetakeOfIncorrect = false;
      }
    } else {
      // First time user - show all questions
      const { data: allQuestions, error: allQuestionsError } = await supabase
        .from('QuestionBank')
        .select('question_number')
        .order('question_number', { ascending: true });

      if (allQuestionsError) throw allQuestionsError;
      allowedQuestionNumbers = allQuestions?.map(q => q.question_number) || [];
      isRetakeOfIncorrect = false;
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('TestSession')
      .insert({
        email: userEmail,
        total_questions: 0,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return NextResponse.json({
      sessionId: newSession.id,
      allowedQuestionNumbers,
      isRetakeOfIncorrect,
    });

  } catch (error) {
    console.error('Error in test-session POST:', error);
    return NextResponse.json(
      { error: 'Failed to create new session' },
      { status: 500 }
    );
  }
}

