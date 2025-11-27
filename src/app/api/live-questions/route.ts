import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

interface SupabaseQuestionRow {
  id: string;
  content: string;
  created_at: string;
  is_archived: boolean;
  video_url: string | null;
  LiveQuestionVotes?: Array<{ count: number }>;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    // Use proxyEmail if admin is proxying, otherwise use their own email
    const userEmail = (token?.proxyEmail as string) || token?.email;

    const { data: questions, error: questionsError } = await supabase
      .from('LiveQuestions')
      .select('id, content, created_at, is_archived, video_url, LiveQuestionVotes(count)')
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    let votedQuestionIds = new Set<string>();

    if (userEmail) {
      const { data: userVotes, error: votesError } = await supabase
        .from('LiveQuestionVotes')
        .select('question_id')
        .eq('user_email', userEmail);

      if (votesError) {
        console.error('Error fetching user votes:', votesError);
        return NextResponse.json({ error: 'Failed to fetch user votes' }, { status: 500 });
      }

      votedQuestionIds = new Set((userVotes || []).map((vote) => vote.question_id));
    }

    const formatted = (questions || []).map((question: SupabaseQuestionRow) => ({
      id: question.id,
      content: question.content,
      createdAt: question.created_at,
      isArchived: question.is_archived || false,
      videoUrl: question.video_url || null,
      voteCount: question.LiveQuestionVotes?.[0]?.count || 0,
      hasVoted: votedQuestionIds.has(question.id),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Unexpected error in GET /api/live-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    // Use proxyEmail if admin is proxying, otherwise use their own email
    const userEmail = (token?.proxyEmail as string) || token?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Question content is required' }, { status: 400 });
    }

    // Use proxyName if available, otherwise use token name
    const userName = (token?.proxyName as string) || token?.name || null;

    const { data: question, error: insertError } = await supabase
      .from('LiveQuestions')
      .insert({
        content,
        user_email: userEmail,
        user_name: userName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating question:', insertError);
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }

    return NextResponse.json({
      id: question.id,
      content: question.content,
      createdAt: question.created_at,
      isArchived: question.is_archived || false,
      voteCount: 0,
      hasVoted: false,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/live-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
