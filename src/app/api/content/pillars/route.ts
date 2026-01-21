import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PILLARS_TABLE = 'LearningPillars';
const TOPICS_TABLE = 'LearningTopics';
const ARTICLES_TABLE = 'LearningArticles';

export async function GET() {
  try {
    const { data: pillars, error: pillarsError } = await supabase
      .from(PILLARS_TABLE)
      .select('*')
      .order('order_index', { ascending: true });

    if (pillarsError) {
      console.error('Error fetching pillars:', pillarsError);
      return NextResponse.json({ error: 'Failed to fetch pillars' }, { status: 500 });
    }

    const { data: topics, error: topicsError } = await supabase
      .from(TOPICS_TABLE)
      .select('*')
      .order('order_index', { ascending: true });

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    const { data: articles, error: articlesError } = await supabase
      .from(ARTICLES_TABLE)
      .select('id, topic_id, is_published')
      .eq('is_published', true);

    if (articlesError) {
      console.error('Error fetching article counts:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    const articleCounts = (articles || []).reduce<Record<string, number>>((acc, article) => {
      acc[article.topic_id] = (acc[article.topic_id] || 0) + 1;
      return acc;
    }, {});

    const response = (pillars || []).map((pillar) => {
      const pillarTopics = (topics || [])
        .filter((topic) => topic.pillar_id === pillar.id)
        .map((topic) => ({
          ...topic,
          article_count: articleCounts[topic.id] || 0,
        }));

      return {
        ...pillar,
        topics: pillarTopics,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/content/pillars:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
