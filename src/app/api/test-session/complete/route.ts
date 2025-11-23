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

    // Get all answers for this session
    const { data: answers, error: answersError } = await supabase
      .from('TestAnswer')
      .select('id, question_number, user_answer')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers found for this session' },
        { status: 404 }
      );
    }

    // Get all question numbers
    const questionNumbers = answers.map(a => a.question_number);
    
    // Fetch question bank data
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

    // Calculate correctness and prepare updates
    let correctCount = 0;
    const incorrectAnswers = [];

    for (const answer of answers) {
      const question = questionsMap.get(answer.question_number);
      
      if (!question) {
        console.error(`Question ${answer.question_number} not found`);
        continue;
      }
      
      const isCorrect = answer.user_answer === question.correct_answer;
      
      if (isCorrect) {
        correctCount++;
      } else {
        incorrectAnswers.push({
          questionNumber: answer.question_number,
          question: question.question,
          options: question.options,
          userAnswer: answer.user_answer,
          correctAnswer: question.correct_answer,
          rationale: question.rationale,
        });
      }

      // Update is_correct for this answer
      await supabase
        .from('TestAnswer')
        .update({ is_correct: isCorrect })
        .eq('id', answer.id);
    }

    const totalQuestions = answers.length;
    const scorePercentage = (correctCount / totalQuestions) * 100;

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

