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
  searchParams: Promise<{ source?: string; returnTo?: string; sessionQuestionId?: string }>;
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { source, returnTo, sessionQuestionId } = await searchParams;

  if (!id) {
    redirect('/peralta75');
  }

  const numericId = Number(id);
  const questionQuery = supabase
    .from('InterviewQuestions')
    .select('id, leetcode_number, name, difficulty, category, pattern, leetcode_url, prompt_full, starter_code, helper_code, test_cases, order_index, source');

  const { data, error } = Number.isFinite(numericId) && numericId > 0
    ? await questionQuery.eq('leetcode_number', numericId).maybeSingle()
    : await questionQuery.eq('id', id).maybeSingle();

  if (error || !data) {
    redirect('/peralta75');
  }

  const question = data as InterviewQuestion;
  const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : null;

  return (
    <PracticeEditor
      question={question}
      context={{
        isSession: source === 'session',
        returnTo: safeReturnTo,
        sessionQuestionId: sessionQuestionId || null,
      }}
    />
  );
}
