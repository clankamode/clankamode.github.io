import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: reviewId } = await params;
  const userId = token.sub as string;
  const admin = getSupabaseAdminClient();

  const { error: voteErr } = await admin
    .from('ResumeReviewVotes')
    .insert({ review_id: reviewId, user_id: userId });

  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }
    console.error('resume review vote insert error:', voteErr);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }

  const { data: newCount, error: rpcErr } = await admin
    .rpc('increment_resume_review_vote_count', { review_id: reviewId });

  if (rpcErr) {
    console.error('resume review vote increment error:', rpcErr);
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
  }

  return NextResponse.json({ vote_count: newCount });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: reviewId } = await params;
  const userId = token.sub as string;
  const admin = getSupabaseAdminClient();

  const { error: deleteErr, count: deletedCount } = await admin
    .from('ResumeReviewVotes')
    .delete({ count: 'exact' })
    .eq('review_id', reviewId)
    .eq('user_id', userId);

  if (deleteErr) {
    console.error('resume review vote delete error:', deleteErr);
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }

  if (!deletedCount || deletedCount === 0) {
    const { data: review } = await admin
      .from('ResumeReviews')
      .select('vote_count')
      .eq('id', reviewId)
      .single();
    return NextResponse.json({ vote_count: review?.vote_count ?? 0 });
  }

  const { data: newCount, error: rpcErr } = await admin
    .rpc('decrement_resume_review_vote_count', { review_id: reviewId });

  if (rpcErr) {
    console.error('resume review vote decrement error:', rpcErr);
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
  }

  return NextResponse.json({ vote_count: newCount });
}
