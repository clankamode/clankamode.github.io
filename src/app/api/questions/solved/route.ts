import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';

async function awardBadgesIfEarned(email: string, googleId?: string) {
  const [solvedResult, badgesResult, existingBadgesResult] = await Promise.all([
    supabase
      .from('UserQuestionSubmissions')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .eq('solved', true),
    supabase
      .from('Badges')
      .select('slug, criteria_type, criteria_value')
      .eq('criteria_type', 'questions_solved'),
    supabase
      .from('UserBadges')
      .select('badge_slug')
      .eq('email', email),
  ]);

  const solvedCount = solvedResult.count ?? 0;
  const badges = badgesResult.data ?? [];
  const earnedSlugs = new Set((existingBadgesResult.data ?? []).map((b) => b.badge_slug));

  const toAward = badges.filter(
    (b) => solvedCount >= b.criteria_value && !earnedSlugs.has(b.slug)
  );

  if (toAward.length > 0) {
    await supabase.from('UserBadges').insert(
      toAward.map((b) => ({
        email,
        google_id: googleId ?? null,
        badge_slug: b.slug,
      }))
    );
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identity = getEffectiveIdentityFromToken(token);
  if (!identity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('question_id');

  if (questionId) {
    const { data, error } = await supabase
      .from('UserQuestionSubmissions')
      .select('id, question_id, solved, source_code, created_at, updated_at')
      .eq('email', identity.email)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching submission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? null);
  }

  const { data, error } = await supabase
    .from('UserQuestionSubmissions')
    .select('id, question_id, solved, created_at, updated_at, InterviewQuestions(leetcode_number)')
    .eq('email', identity.email);

  if (error) {
    console.error('Error fetching solved questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identity = getEffectiveIdentityFromToken(token);
  if (!identity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Single question only (used when user passes all test cases in code execution)
  if (
    !body ||
    typeof body !== 'object' ||
    !('question_id' in body) ||
    typeof (body as { question_id: unknown }).question_id !== 'string'
  ) {
    return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
  }

  const { question_id, solved = true, source_code } = body as {
    question_id: string;
    solved?: boolean;
    source_code?: string | null;
  };

  const row = {
    email: identity.email,
    google_id: identity.googleId ?? null,
    question_id,
    solved: Boolean(solved),
    updated_at: new Date().toISOString(),
    ...(typeof source_code === 'string' && { source_code }),
  };

  const { data, error } = await supabase
    .from('UserQuestionSubmissions')
    .upsert(row, { onConflict: 'email,question_id' })
    .select('id, question_id, solved, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error upserting solved question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (solved) {
    await awardBadgesIfEarned(identity.email, identity.googleId);
  }

  return NextResponse.json(data);
}
