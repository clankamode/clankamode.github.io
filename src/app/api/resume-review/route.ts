import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { data: reviews, error } = await admin
    .from('ResumeReviews')
    .select('id, created_at, author_name, title, context, resume_url, resume_filename, status, review_notes, reviewed_at, vote_count')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('resume reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  const userId = token.sub as string;
  const { data: votes } = await admin
    .from('ResumeReviewVotes')
    .select('review_id')
    .eq('user_id', userId);

  const votedIds = new Set((votes ?? []).map((v: { review_id: string }) => v.review_id));

  const result = (reviews ?? []).map((r) => ({
    ...r,
    hasVoted: votedIds.has(r.id),
  }));

  return NextResponse.json({ reviews: result });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const title = (body.title as string)?.trim();
  const context = (body.context as string | null)?.trim() || null;
  const resumeUrl = body.resume_url as string;
  const resumeFilename = body.resume_filename as string;
  const anonymous = !!body.anonymous;

  if (!title || title.length < 3) {
    return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: 'Title must be under 100 characters' }, { status: 400 });
  }
  if (!resumeUrl || !resumeFilename) {
    return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const userId = token.sub as string;
  const authorName = anonymous ? null : (token.name as string) || null;

  const { data, error } = await admin
    .from('ResumeReviews')
    .insert({
      user_id: userId,
      author_name: authorName,
      title,
      context,
      resume_url: resumeUrl,
      resume_filename: resumeFilename,
    })
    .select('id, created_at, author_name, title, context, resume_url, resume_filename, status, review_notes, reviewed_at, vote_count')
    .single();

  if (error) {
    console.error('resume review insert error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }

  return NextResponse.json({ review: { ...data, hasVoted: false } }, { status: 201 });
}
