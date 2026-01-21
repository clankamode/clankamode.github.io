import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const PILLARS_TABLE = 'LearningPillars';
const TOPICS_TABLE = 'LearningTopics';
const ARTICLES_TABLE = 'LearningArticles';

function getReadingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function getTopicIdsByPillar(slug: string) {
  const { data: pillar, error: pillarError } = await supabase
    .from(PILLARS_TABLE)
    .select('id')
    .eq('slug', slug)
    .single();

  if (pillarError || !pillar?.id) {
    return [];
  }

  const { data: topics, error: topicsError } = await supabase
    .from(TOPICS_TABLE)
    .select('id')
    .eq('pillar_id', pillar.id);

  if (topicsError || !topics) {
    return [];
  }

  return topics.map((topic) => topic.id);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const includeDrafts = searchParams.get('includeDrafts') === 'true';
    const pillarSlug = searchParams.get('pillar');
    const topicSlug = searchParams.get('topic');
    const topicId = searchParams.get('topicId');

    let adminAllowed = false;
    if (includeDrafts) {
      const token = await getToken({ req });
      const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
      adminAllowed = !!token && hasRole(effectiveRole, UserRole.EDITOR);
      if (!adminAllowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let filterTopicIds: string[] = [];
    if (topicId) {
      filterTopicIds = [topicId];
    } else if (topicSlug) {
      const query = supabase
        .from(TOPICS_TABLE)
        .select('id')
        .eq('slug', topicSlug);

      if (pillarSlug) {
        const pillarTopicIds = await getTopicIdsByPillar(pillarSlug);
        if (!pillarTopicIds.length) {
          return NextResponse.json([]);
        }
        const { data } = await query.in('id', pillarTopicIds);
        filterTopicIds = (data || []).map((topic) => topic.id);
      } else {
        const { data } = await query;
        filterTopicIds = (data || []).map((topic) => topic.id);
      }
    } else if (pillarSlug) {
      filterTopicIds = await getTopicIdsByPillar(pillarSlug);
    }

    let articlesQuery = supabase
      .from(ARTICLES_TABLE)
      .select('*')
      .order('order_index', { ascending: true });

    if (filterTopicIds.length) {
      articlesQuery = articlesQuery.in('topic_id', filterTopicIds);
    }

    if (!includeDrafts) {
      articlesQuery = articlesQuery.eq('is_published', true);
    }

    const { data, error } = await articlesQuery;

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !hasRole(effectiveRole, UserRole.EDITOR)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic_id, slug, title, body: contentBody, excerpt, is_premium, is_published, order_index, reading_time_minutes } = body;

    if (!topic_id || !slug || !title || !contentBody) {
      return NextResponse.json(
        { error: 'topic_id, slug, title, and body are required' },
        { status: 400 }
      );
    }

    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug.trim())) {
      return NextResponse.json(
        { error: 'slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    const { data, error } = await adminClient
      .from(ARTICLES_TABLE)
      .insert({
        topic_id,
        slug: slug.trim(),
        title: title.trim(),
        body: contentBody,
        excerpt: excerpt?.trim() || null,
        is_premium: !!is_premium,
        is_published: !!is_published,
        order_index: order_index ?? 0,
        reading_time_minutes: reading_time_minutes ?? getReadingTimeMinutes(contentBody),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating article:', error);
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
