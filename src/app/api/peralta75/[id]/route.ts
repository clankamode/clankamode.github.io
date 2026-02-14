import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('InterviewQuestions')
      .select('id, leetcode_number, name, difficulty, category, pattern, leetcode_url, prompt_full, starter_code, helper_code, test_cases, order_index, source')
      .eq('leetcode_number', id)
      .contains('source', ['PERALTA_75'])
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load question.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
