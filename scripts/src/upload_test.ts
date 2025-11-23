// upload_test.ts
// Run: npx tsx scripts/src/upload_test.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
import { supabase } from '../../src/lib/supabase';
import questionBank from './test-questions/question-bank.json';

interface Question {
  question_number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  rationale: string;
}

async function uploadQuestions() {
  console.log(`Preparing to upload ${questionBank.length} questions...`);

  const chunkSize = 100;
  let totalUploaded = 0;

  for (let i = 0; i < questionBank.length; i += chunkSize) {
    const chunk = questionBank.slice(i, i + chunkSize) as Question[];
    console.log(`Upserting questions ${i + 1}-${Math.min(i + chunkSize, questionBank.length)}...`);

    const { error } = await supabase
      .from('QuestionBank')
      .upsert(chunk, { onConflict: 'question_number' });

    if (error) {
      console.error('Error upserting questions:', error);
      throw error;
    }

    totalUploaded += chunk.length;
    console.log(`Successfully upserted ${totalUploaded} questions so far.`);
    
    // Optional throttle to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`✅ Done! Uploaded ${totalUploaded} questions to Supabase.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  uploadQuestions().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

