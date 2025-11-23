import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Get all answers for this session (already graded on-the-fly)
    const { data: allAnswers, error: answersError } = await supabase
      .from('TestAnswer')
      .select('question_number, user_answer, is_correct')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    if (!allAnswers || allAnswers.length === 0) {
      return NextResponse.json(
        { error: 'No answers found for this session' },
        { status: 404 }
      );
    }

    // Count correct/incorrect (already graded!)
    const correctCount = allAnswers.filter(a => a.is_correct).length;
    const totalQuestions = allAnswers.length;
    const scorePercentage = (correctCount / totalQuestions) * 100;

    // Get only incorrect answers for detailed feedback
    const incorrectAnswersList = allAnswers.filter(a => !a.is_correct);
    const incorrectAnswers = [];

    if (incorrectAnswersList.length > 0) {
      const incorrectQuestionNumbers = incorrectAnswersList.map(a => a.question_number);
      
      // Fetch question details for incorrect answers only
      const { data: questions, error: questionsError } = await supabase
        .from('QuestionBank')
        .select('question_number, correct_answer, question, options, rationale')
        .in('question_number', incorrectQuestionNumbers);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw questionsError;
      }

      // Create a map for quick lookup
      const questionsMap = new Map(
        questions?.map(q => [q.question_number, q]) || []
      );

      for (const answer of incorrectAnswersList) {
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

    // Update session with completion data
    const { error: updateError } = await supabase
      .from('TestSession')
      .update({
        completed_at: new Date().toISOString(),
        correct_answers: correctCount,
        score_percentage: scorePercentage,
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return NextResponse.json({
      totalQuestions,
      correctAnswers: correctCount,
      scorePercentage: Math.round(scorePercentage),
      incorrectAnswers,
    });

  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}

