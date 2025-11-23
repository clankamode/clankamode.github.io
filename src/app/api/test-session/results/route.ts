import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('TestSession')
      .select('id, email, completed_at, correct_answers, score_percentage, total_questions')
      .eq('id', sessionId)
      .eq('email', token.email)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.completed_at) {
      return NextResponse.json(
        { error: 'Session not completed yet' },
        { status: 400 }
      );
    }

    // Get all answers for this session (only incorrect ones need full details)
    const { data: answers, error: answersError } = await supabase
      .from('TestAnswer')
      .select('id, question_number, user_answer, is_correct')
      .eq('session_id', sessionId)
      .eq('is_correct', false);  // Only fetch incorrect answers

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    // If there are incorrect answers, fetch the question details
    const incorrectAnswers = [];
    if (answers && answers.length > 0) {
      const questionNumbers = answers.map(a => a.question_number);
      
      const { data: questions, error: questionsError } = await supabase
        .from('QuestionBank')
        .select('question_number, correct_answer, question, options, rationale')
        .in('question_number', questionNumbers);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw questionsError;
      }

      // Create a map for quick lookup
      const questionsMap = new Map(
        questions?.map(q => [q.question_number, q]) || []
      );

      for (const answer of answers) {
        const question = questionsMap.get(answer.question_number);
        
        if (question) {
          incorrectAnswers.push({
            questionNumber: answer.question_number,
            question: question.question,
            options: question.options,
            userAnswer: answer.user_answer,
            correctAnswer: question.correct_answer,
            rationale: question.rationale,
          });
        }
      }
    }

    return NextResponse.json({
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      scorePercentage: Math.round(session.score_percentage || 0),
      incorrectAnswers,
    });

  } catch (error) {
    console.error('Error fetching session results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session results' },
      { status: 500 }
    );
  }
}

