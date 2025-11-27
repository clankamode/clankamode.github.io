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
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Verify session belongs to user and is completed
    const { data: session, error: sessionError } = await supabase
      .from('TestSession')
      .select('id, completed_at, correct_answers, total_questions, score_percentage')
      .eq('id', sessionId)
      .eq('email', userEmail)
      .not('completed_at', 'is', null) // Ensure it's a completed session
      .single();

    if (sessionError || !session) {
      console.error('Error fetching session or session not found/completed:', sessionError);
      return NextResponse.json({ error: 'Session not found or not completed' }, { status: 404 });
    }

    // Get ALL answers for this session
    const { data: allAnswersData, error: answersError } = await supabase
      .from('TestAnswer')
      .select('question_number, user_answer, is_correct')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    const incorrectAnswers = [];
    const unitBreakdown: Record<string, { correct: number; total: number }> = {};

    if (allAnswersData && allAnswersData.length > 0) {
      const allQuestionNumbers = allAnswersData.map(a => a.question_number);

      // Fetch question details for all answered questions
      const { data: questions, error: questionsError } = await supabase
        .from('QuestionBank')
        .select('question_number, correct_answer, question, options, rationale, unit, knowledge_area')
        .in('question_number', allQuestionNumbers);

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw questionsError;
      }

      const questionsMap = new Map(
        questions?.map(q => [q.question_number, q]) || []
      );

      // Build incorrect answers list and unit breakdown
      for (const answer of allAnswersData) {
        const question = questionsMap.get(answer.question_number);
        if (question) {
          const unit = question.unit || 'Unknown';
          
          // Initialize unit in breakdown if not exists
          if (!unitBreakdown[unit]) {
            unitBreakdown[unit] = { correct: 0, total: 0 };
          }
          
          // Update unit statistics
          unitBreakdown[unit].total += 1;
          if (answer.is_correct) {
            unitBreakdown[unit].correct += 1;
          }

          // Add to incorrect answers if wrong
          if (!answer.is_correct) {
            incorrectAnswers.push({
              questionNumber: answer.question_number,
              question: question.question,
              options: question.options,
              userAnswer: answer.user_answer,
              correctAnswer: question.correct_answer,
              rationale: question.rationale,
              unit: question.unit,
              knowledgeArea: question.knowledge_area,
            });
          }
        }
      }

      // Sort incorrect answers by question number
      incorrectAnswers.sort((a, b) => a.questionNumber - b.questionNumber);
    }

    // Convert unit breakdown to array and sort by unit name
    const unitBreakdownArray = Object.entries(unitBreakdown)
      .map(([unit, stats]) => ({
        unit,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => {
        // Sort by unit order (I, II, III, IV)
        const unitOrder = { 'Unit I': 1, 'Unit II': 2, 'Unit III': 3, 'Unit IV': 4 };
        return (unitOrder[a.unit as keyof typeof unitOrder] || 999) - (unitOrder[b.unit as keyof typeof unitOrder] || 999);
      });

    return NextResponse.json({
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      scorePercentage: Math.round(session.score_percentage),
      incorrectAnswers,
      unitBreakdown: unitBreakdownArray,
    });

  } catch (error) {
    console.error('Error in test-session/results GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session results' },
      { status: 500 }
    );
  }
}

