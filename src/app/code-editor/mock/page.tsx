import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MockInterviewEditor } from '../_components/MockInterviewEditor';

interface InterviewQuestion {
  id: string;
  name: string;
  leetcode_number: number | null;
  difficulty: string;
  prompt_full: string;
  starter_code: string;
  helper_code: string;
  test_cases: unknown;
  video_ids: string[] | null;
}

interface PageProps {
  searchParams: Promise<{ q1?: string; q2?: string }>;
}

export default async function MockInterviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q1, q2 } = params;

  if (!q1 || !q2) {
    redirect('/assessment');
  }

  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name, leetcode_number, difficulty, prompt_full, starter_code, helper_code, test_cases, video_ids')
    .in('id', [q1, q2]);

  if (error || !data || data.length < 2) {
    redirect('/assessment');
  }

  const question1 = data.find((q: InterviewQuestion) => q.id === q1) as InterviewQuestion;
  const question2 = data.find((q: InterviewQuestion) => q.id === q2) as InterviewQuestion;

  if (!question1 || !question2) {
    redirect('/assessment');
  }

  return <MockInterviewEditor questions={[question1, question2]} />;
}
