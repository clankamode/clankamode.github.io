import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    const effectiveEmail = (token?.proxyEmail as string | null) || token?.email;

    if (!effectiveEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = effectiveEmail;
    const body = await req.json();
    const { sessionId, questionNumber, userAnswer, timeSpentSeconds } = body;

    if (!sessionId || !questionNumber || !userAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure the session belongs to the effective user
    const { data: sessionOwner, error: sessionOwnerError } = await supabase
      .from('TestSession')
      .select('email')
      .eq('id', sessionId)
      .single();

    if (sessionOwnerError || !sessionOwner) {
      console.error('Error verifying session ownership:', sessionOwnerError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (sessionOwner.email !== userEmail) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch the correct answer from QuestionBank
    const { data: question, error: questionError } = await supabase
      .from('QuestionBank')
      .select('correct_answer')
      .eq('question_number', questionNumber)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Grade the answer immediately
    const isCorrect = userAnswer === question.correct_answer;

    // Insert answer with is_correct already set
    const { error: insertError } = await supabase
      .from('TestAnswer')
      .insert({
        session_id: sessionId,
        email: userEmail,
        question_number: questionNumber,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpentSeconds || null,
      });

    if (insertError) {
      // Check if it's a duplicate (unique constraint violation)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Answer already recorded for this question' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // Update total_questions count
    const { data: sessionData, error: sessionError } = await supabase
      .from('TestSession')
      .select('total_questions')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const { error: updateError } = await supabase
      .from('TestSession')
      .update({ total_questions: (sessionData.total_questions || 0) + 1 })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}

