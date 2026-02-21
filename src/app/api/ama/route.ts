import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { data: questions, error } = await admin
    .from('AmaQuestions')
    .select('id, created_at, author_name, question, status, answer, answered_at, vote_count')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('ama questions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Fetch the current user's votes
  const userId = token.sub as string;
  const { data: votes } = await admin
    .from('AmaVotes')
    .select('question_id')
    .eq('user_id', userId);

  const votedIds = new Set((votes ?? []).map((v: { question_id: string }) => v.question_id));

  const result = (questions ?? []).map((q) => ({
    ...q,
    hasVoted: votedIds.has(q.id),
  }));

  return NextResponse.json({ questions: result });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const question = (body.question as string)?.trim();
  const anonymous = !!body.anonymous;

  if (!question || question.length < 5) {
    return NextResponse.json({ error: 'Question must be at least 5 characters' }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: 'Question must be under 500 characters' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const userId = token.sub as string;
  const authorName = anonymous ? null : (token.name as string) || null;

  const { data, error } = await admin
    .from('AmaQuestions')
    .insert({ user_id: userId, author_name: authorName, question })
    .select('id, created_at, author_name, question, status, vote_count')
    .single();

  if (error) {
    console.error('ama question insert error:', error);
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
  }

  return NextResponse.json({ question: { ...data, hasVoted: false } }, { status: 201 });
}
