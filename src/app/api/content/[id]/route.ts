import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole } from '@/types/roles';
import { requireAuth } from '@/lib/auth-helpers';
import { estimateReadingTimeMinutes } from '@/lib/reading-time';

const ARTICLES_TABLE = 'LearningArticles';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const includeDrafts = req.nextUrl.searchParams.get('includeDrafts') === 'true';

    if (includeDrafts) {
      const token = await requireAuth(req, UserRole.EDITOR);
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from(ARTICLES_TABLE).select('*');
    query = isUUID ? query.eq('id', id) : query.eq('slug', id);

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
    const token = await requireAuth(req, UserRole.EDITOR);

    if (!token) {
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
      practice_question_id: body.practice_question_id ?? null,
      reading_time_minutes: body.body
        ? estimateReadingTimeMinutes(body.body)
        : (body.reading_time_minutes ?? undefined),
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
    const token = await requireAuth(req, UserRole.ADMIN);

    if (!token) {
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
