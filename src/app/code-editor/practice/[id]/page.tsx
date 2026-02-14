import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PracticeEditor } from '../../_components/PracticeEditor';

interface InterviewQuestion {
  id: string;
  leetcode_number: number | null;
  name: string;
  difficulty: string;
  category: string | null;
  pattern: string | null;
  leetcode_url: string | null;
  prompt_full: string;
  starter_code: string;
  helper_code: string;
  test_cases: unknown;
  order_index: number | null;
  source: string[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    redirect('/peralta75');
  }

  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, leetcode_number, name, difficulty, category, pattern, leetcode_url, prompt_full, starter_code, helper_code, test_cases, order_index, source')
    .eq('leetcode_number', parseInt(id, 10))
    .contains('source', ['PERALTA_75'])
    .single();

  if (error || !data) {
    redirect('/peralta75');
  }

  const question = data as InterviewQuestion;

  return <PracticeEditor question={question} />;
}
