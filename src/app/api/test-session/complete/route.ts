import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
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

    // Verify the session belongs to the effective user
    const { data: sessionOwner, error: sessionOwnerError } = await supabase
      .from('TestSession')
      .select('email, google_id')
      .eq('id', sessionId)
      .single();

    if (sessionOwnerError || !sessionOwner) {
      console.error('Error verifying session ownership:', sessionOwnerError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const ownsByEmail = sessionOwner.email === identity.email;
    const ownsByGoogle = !!identity.googleId && sessionOwner.google_id === identity.googleId;
    if (!ownsByEmail && !ownsByGoogle) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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

    // Get all question numbers
    const questionNumbers = allAnswers.map(a => a.question_number);
    
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

    let correctCount = 0;
    const totalQuestions = allAnswers.length;
    const incorrectAnswers = [];
    const unitBreakdown: Record<string, { correct: number; total: number }> = {};

    for (const answer of allAnswers) {
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
    }

    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

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
