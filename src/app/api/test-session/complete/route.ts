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
      .select('question_number, correct_answer, question, options, rationale, unit, knowledge_area')
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
    const unitBreakdown: Record<string, { correct: number; total: number }> = {};

    for (const answer of answers) {
      const question = questionsMap.get(answer.question_number);
      
      if (!question) {
        console.error(`Question ${answer.question_number} not found`);
        continue;
      }
      
      const isCorrect = answer.user_answer === question.correct_answer;
      const unit = question.unit || 'Unknown';
      
      // Initialize unit in breakdown if not exists
      if (!unitBreakdown[unit]) {
        unitBreakdown[unit] = { correct: 0, total: 0 };
      }
      
      // Update unit statistics
      unitBreakdown[unit].total += 1;
      
      if (isCorrect) {
        correctCount++;
        unitBreakdown[unit].correct += 1;
      } else {
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
      totalQuestions,
      correctAnswers: correctCount,
      scorePercentage: Math.round(scorePercentage),
      incorrectAnswers,
      unitBreakdown: unitBreakdownArray,
    });

  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}

