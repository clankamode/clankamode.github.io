import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

const PROGRESS_TABLE = 'UserArticleProgress';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from(PROGRESS_TABLE)
      .upsert(
        {
          user_id: userId,
          article_id: articleId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,article_id' }
      );

    if (error) {
      console.error('Error saving completion:', error);
      return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 });
    }

    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error('Error in POST /api/progress/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from(PROGRESS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      console.error('Error removing completion:', error);
      return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 });
    }

    return NextResponse.json({ completed: false });
  } catch (error) {
    console.error('Error in DELETE /api/progress/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
