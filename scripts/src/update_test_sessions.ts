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

async function updateTestSessions() {
  try {
    console.log('🔍 Fetching test sessions that need completion data...');

    // Fetch all sessions where completed_at is null but they have answers
    const { data: sessions, error: sessionsError } = await supabase
      .from('TestSession')
      .select('id, total_questions')
      .is('completed_at', null);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      console.log('✅ No sessions need updating!');
      return;
    }

    console.log(`📝 Found ${sessions.length} sessions to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const session of sessions) {
      console.log(`Processing session ${session.id}...`);

      // Get all answers for this session
      const { data: answers, error: answersError } = await supabase
        .from('TestAnswer')
        .select('is_correct')
        .eq('session_id', session.id);

      if (answersError) {
        console.error(`  ❌ Error fetching answers for session ${session.id}:`, answersError);
        skippedCount++;
        continue;
      }

      // Skip if no answers
      if (!answers || answers.length === 0) {
        console.log(`  ⚠️  No answers found - skipping`);
        skippedCount++;
        continue;
      }

      // Skip if answers aren't graded yet
      const ungradedAnswers = answers.filter(a => a.is_correct === null);
      if (ungradedAnswers.length > 0) {
        console.log(`  ⚠️  Has ${ungradedAnswers.length} ungraded answers - skipping (run grade_sessions first)`);
        skippedCount++;
        continue;
      }

      // Calculate statistics
      const correctCount = answers.filter(a => a.is_correct === true).length;
      const totalQuestions = answers.length;
      const scorePercentage = (correctCount / totalQuestions) * 100;

      // Update the session
      const { error: updateError } = await supabase
        .from('TestSession')
        .update({
          completed_at: new Date().toISOString(),
          correct_answers: correctCount,
          score_percentage: scorePercentage,
        })
        .eq('id', session.id);

      if (updateError) {
        console.error(`  ❌ Error updating session ${session.id}:`, updateError);
        skippedCount++;
        continue;
      }

      console.log(`  ✅ Updated: ${correctCount}/${totalQuestions} correct (${Math.round(scorePercentage)}%)`);
      updatedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Sessions updated: ${updatedCount}`);
    console.log(`   ⚠️  Sessions skipped: ${skippedCount}`);
    console.log(`\n🎉 Backfill complete!`);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting TestSession backfill script...\n');
updateTestSessions()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

