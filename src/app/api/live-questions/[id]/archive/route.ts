import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { UserRole, hasRole } from '@/types/roles';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });

    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (use original role, not proxy role for admin actions)
    // originalRole is stored in the token when user first logs in
    const originalRole = (token.originalRole as UserRole) || (token.role as UserRole) || UserRole.USER;
    if (!hasRole(originalRole, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id: questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const videoUrl = typeof body?.videoUrl === 'string' ? body.videoUrl.trim() : '';

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Update the question's archived status and video URL
    const { data: question, error: updateError } = await supabase
      .from('LiveQuestions')
      .update({ 
        is_archived: true,
        video_url: videoUrl
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      console.error('Error updating question:', updateError);
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }

    // Get vote count
    const { count: voteCount, error: countError } = await supabase
      .from('LiveQuestionVotes')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId);

    if (countError) {
      console.error('Error counting votes:', countError);
    }

    return NextResponse.json({
      id: question.id,
      content: question.content,
      createdAt: question.created_at,
      isArchived: question.is_archived || false,
      videoUrl: question.video_url || null,
      voteCount: voteCount || 0,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/live-questions/[id]/archive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

