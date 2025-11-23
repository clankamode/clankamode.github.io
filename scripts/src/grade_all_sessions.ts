import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function gradeAllSessions() {
  try {
    console.log('🔍 Fetching answers that need grading...');

    // Fetch all answers where is_correct is null
    const { data: ungradedAnswers, error: answersError } = await supabase
      .from('TestAnswer')
      .select('id, question_number, user_answer')
      .is('is_correct', null);

    if (answersError) {
      console.error('❌ Error fetching answers:', answersError);
      throw answersError;
    }

    if (!ungradedAnswers || ungradedAnswers.length === 0) {
      console.log('✅ All answers are already graded!');
      return;
    }

    console.log(`📝 Found ${ungradedAnswers.length} answers to grade`);

    // Get unique question numbers
    const questionNumbers = [...new Set(ungradedAnswers.map(a => a.question_number))];
    console.log(`📚 Fetching ${questionNumbers.length} unique questions from QuestionBank...`);

    // Fetch all needed questions from QuestionBank
    const { data: questions, error: questionsError } = await supabase
      .from('QuestionBank')
      .select('question_number, correct_answer')
      .in('question_number', questionNumbers);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      throw questionsError;
    }

    // Create a map for quick lookup
    const questionsMap = new Map(
      questions?.map(q => [q.question_number, q]) || []
    );

    // Grade answers and group by correctness
    const correctAnswerIds: string[] = [];
    const incorrectAnswerIds: string[] = [];
    let skippedCount = 0;

    for (const answer of ungradedAnswers) {
      const question = questionsMap.get(answer.question_number);
      
      if (!question) {
        console.warn(`⚠️  Question ${answer.question_number} not found in QuestionBank`);
        skippedCount++;
        continue;
      }
      
      const isCorrect = answer.user_answer === question.correct_answer;
      
      if (isCorrect) {
        correctAnswerIds.push(answer.id);
      } else {
        incorrectAnswerIds.push(answer.id);
      }
    }

    console.log(`\n📊 Grading Summary:`);
    console.log(`   ✅ Correct answers: ${correctAnswerIds.length}`);
    console.log(`   ❌ Incorrect answers: ${incorrectAnswerIds.length}`);
    console.log(`   ⚠️  Skipped (question not found): ${skippedCount}`);

    // Batch update correct answers
    if (correctAnswerIds.length > 0) {
      console.log(`\n🔄 Updating ${correctAnswerIds.length} correct answers...`);
      const { error: correctError } = await supabase
        .from('TestAnswer')
        .update({ is_correct: true })
        .in('id', correctAnswerIds);

      if (correctError) {
        console.error('❌ Error updating correct answers:', correctError);
        throw correctError;
      }
      console.log('✅ Correct answers updated');
    }

    // Batch update incorrect answers
    if (incorrectAnswerIds.length > 0) {
      console.log(`🔄 Updating ${incorrectAnswerIds.length} incorrect answers...`);
      const { error: incorrectError } = await supabase
        .from('TestAnswer')
        .update({ is_correct: false })
        .in('id', incorrectAnswerIds);

      if (incorrectError) {
        console.error('❌ Error updating incorrect answers:', incorrectError);
        throw incorrectError;
      }
      console.log('✅ Incorrect answers updated');
    }

    console.log('\n🎉 Backfill complete!');
    console.log(`   Total graded: ${correctAnswerIds.length + incorrectAnswerIds.length}`);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting TestAnswer backfill script...\n');
gradeAllSessions()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

  

