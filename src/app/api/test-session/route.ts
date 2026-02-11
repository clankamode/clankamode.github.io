import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken, type EffectiveIdentity } from '@/lib/auth-identity';

interface AllowedQuestionsResult {
  allowedQuestionNumbers: number[];
  isRetakeOfIncorrect: boolean;
}

async function getAllowedQuestions(identity: EffectiveIdentity): Promise<AllowedQuestionsResult> {
  const { data: previousSession, error: prevSessionError } = await supabase
    .from('TestSession')
    .select('id, completed_at')
    .or(buildUserIdentityOrFilter(identity))
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (prevSessionError && prevSessionError.code !== 'PGRST116') {
    throw prevSessionError;
  }

  if (previousSession) {
    const { data: incorrectAnswers, error: incorrectError } = await supabase
      .from('TestAnswer')
      .select('question_number')
      .eq('session_id', previousSession.id)
      .eq('is_correct', false)
      .order('question_number', { ascending: true });

    if (incorrectError) throw incorrectError;

    if (incorrectAnswers && incorrectAnswers.length > 0) {
      return {
        allowedQuestionNumbers: incorrectAnswers.map(a => a.question_number),
        isRetakeOfIncorrect: true,
      };
    }
  }

  const { data: allQuestions, error: allQuestionsError } = await supabase
    .from('QuestionBank')
    .select('question_number')
    .order('question_number', { ascending: true });

  if (allQuestionsError) throw allQuestionsError;

  return {
    allowedQuestionNumbers: allQuestions?.map(q => q.question_number) || [],
    isRetakeOfIncorrect: false,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingSession, error: sessionError } = await supabase
      .from('TestSession')
      .select('id, started_at, total_questions')
      .or(buildUserIdentityOrFilter(identity))
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    if (!existingSession) {
      return NextResponse.json({ sessionId: null }, { status: 200 });
    }

    const { data: answers, error: answersError } = await supabase
      .from('TestAnswer')
      .select('question_number')
      .eq('session_id', existingSession.id)
      .order('question_number', { ascending: true });

    if (answersError) throw answersError;

    const { allowedQuestionNumbers, isRetakeOfIncorrect } = await getAllowedQuestions(identity);

    return NextResponse.json({
      sessionId: existingSession.id,
      answeredQuestions: answers?.map(a => a.question_number) || [],
      totalQuestions: existingSession.total_questions,
      allowedQuestionNumbers,
      isRetakeOfIncorrect,
    });

  } catch (error) {
    console.error('Error in test-session GET:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: incompleteSessions, error: incompleteError } = await supabase
      .from('TestSession')
      .select('id, started_at')
      .or(buildUserIdentityOrFilter(identity))
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

    const { allowedQuestionNumbers, isRetakeOfIncorrect } = await getAllowedQuestions(identity);

    const { data: newSession, error: createError } = await supabase
      .from('TestSession')
      .insert({
        email: identity.email,
        google_id: identity.googleId ?? null,
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
