import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: questionId } = await params;
  const userId = token.sub as string;
  const admin = getSupabaseAdminClient();

  // Insert vote (will fail on unique constraint if already voted)
  const { error: voteErr } = await admin
    .from('AmaVotes')
    .insert({ question_id: questionId, user_id: userId });

  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }
    console.error('ama vote insert error:', voteErr);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }

  // Atomically increment vote_count
  const { data: newCount, error: rpcErr } = await admin
    .rpc('increment_ama_vote_count', { question_id: questionId });

  if (rpcErr) {
    console.error('ama vote increment error:', rpcErr);
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
  }

  return NextResponse.json({ vote_count: newCount });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: questionId } = await params;
  const userId = token.sub as string;
  const admin = getSupabaseAdminClient();

  const { error: deleteErr, count: deletedCount } = await admin
    .from('AmaVotes')
    .delete({ count: 'exact' })
    .eq('question_id', questionId)
    .eq('user_id', userId);

  if (deleteErr) {
    console.error('ama vote delete error:', deleteErr);
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }

  // Only decrement if a vote row was actually deleted
  if (!deletedCount || deletedCount === 0) {
    const { data: question } = await admin
      .from('AmaQuestions')
      .select('vote_count')
      .eq('id', questionId)
      .single();
    return NextResponse.json({ vote_count: question?.vote_count ?? 0 });
  }

  // Atomically decrement vote_count (floored at 0)
  const { data: newCount, error: rpcErr } = await admin
    .rpc('decrement_ama_vote_count', { question_id: questionId });

  if (rpcErr) {
    console.error('ama vote decrement error:', rpcErr);
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
  }

  return NextResponse.json({ vote_count: newCount });
}
