import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const ARTICLES_TABLE = 'LearningArticles';

function getReadingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const includeDrafts = req.nextUrl.searchParams.get('includeDrafts') === 'true';

    if (includeDrafts) {
      const token = await getToken({ req });
      const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
      if (!token || !hasRole(effectiveRole, UserRole.EDITOR)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;
    let query = supabase
      .from(ARTICLES_TABLE)
      .select('*')
      .eq('id', id);

    if (!includeDrafts) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/content/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !hasRole(effectiveRole, UserRole.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = await params;

    if (!body.slug || !body.title || !body.body) {
      return NextResponse.json(
        { error: 'slug, title, and body are required' },
        { status: 400 }
      );
    }

    const update = {
      slug: body.slug.trim(),
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() ?? null,
      body: body.body,
      is_premium: body.is_premium ?? false,
      is_published: body.is_published ?? false,
      order_index: body.order_index ?? 0,
      reading_time_minutes: body.reading_time_minutes ?? (body.body ? getReadingTimeMinutes(body.body) : undefined),
      topic_id: body.topic_id,
    };

    const adminClient = getSupabaseAdminClient();

    const { data, error } = await adminClient
      .from(ARTICLES_TABLE)
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating article:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/content/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = getSupabaseAdminClient();

    const { error } = await adminClient
      .from(ARTICLES_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting article:', error);
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/content/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
