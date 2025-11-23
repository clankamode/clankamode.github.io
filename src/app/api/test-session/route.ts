import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = token.email;

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

      return NextResponse.json({
        sessionId: existingSession.id,
        answeredQuestions: answers?.map(a => a.question_number) || [],
        totalQuestions: existingSession.total_questions,
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
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = token.email;

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
    console.error('Error in test-session POST:', error);
    return NextResponse.json(
      { error: 'Failed to create new session' },
      { status: 500 }
    );
  }
}

