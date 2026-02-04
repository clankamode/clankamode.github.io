import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getBookmarkStatus, getUserBookmarks } from '@/lib/progress';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

const BOOKMARKS_TABLE = 'UserBookmarks';

export async function GET(req: NextRequest) {
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

    const articleId = req.nextUrl.searchParams.get('articleId');
    if (articleId) {
      const status = await getBookmarkStatus(userId, articleId);
      return NextResponse.json(status);
    }

    const bookmarks = await getUserBookmarks(userId);
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error in GET /api/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      .from(BOOKMARKS_TABLE)
      .upsert(
        {
          user_id: userId,
          article_id: articleId,
        },
        { onConflict: 'user_id,article_id' }
      );

    if (error) {
      console.error('Error saving bookmark:', error);
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
    }

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error('Error in POST /api/bookmarks:', error);
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
      .from(BOOKMARKS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    if (error) {
      console.error('Error removing bookmark:', error);
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }

    return NextResponse.json({ bookmarked: false });
  } catch (error) {
    console.error('Error in DELETE /api/bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
