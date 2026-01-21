import { supabase } from '@/lib/supabase';
import type {
  LearningArticle,
  LearningPillar,
  LearningPillarWithTopics,
  LearningTopic,
  LearningTopicWithArticles,
} from '@/types/content';

const PILLARS_TABLE = 'LearningPillars';
const TOPICS_TABLE = 'LearningTopics';
const ARTICLES_TABLE = 'LearningArticles';

export async function getLearningPillars(): Promise<LearningPillar[]> {
  const { data, error } = await supabase
    .from(PILLARS_TABLE)
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as LearningPillar[];
}

export async function getLearningPillarBySlug(slug: string): Promise<LearningPillar | null> {
  const { data, error } = await supabase
    .from(PILLARS_TABLE)
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    return null;
  }

  return data as LearningPillar;
}

export async function getLearningTopicsByPillar(pillarId: string): Promise<LearningTopic[]> {
  const { data, error } = await supabase
    .from(TOPICS_TABLE)
    .select('*')
    .eq('pillar_id', pillarId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as LearningTopic[];
}

export async function getLearningArticlesByTopic(
  topicId: string,
  includeDrafts: boolean
): Promise<LearningArticle[]> {
  const query = supabase
    .from(ARTICLES_TABLE)
    .select('*')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: true });

  const { data, error } = includeDrafts ? await query : await query.eq('is_published', true);

  if (error) {
    throw error;
  }

  return (data || []) as LearningArticle[];
}

export async function getLearningArticleBySlug(
  topicId: string,
  slug: string,
  includeDrafts: boolean
): Promise<LearningArticle | null> {
  let query = supabase
    .from(ARTICLES_TABLE)
    .select('*')
    .eq('topic_id', topicId)
    .eq('slug', slug);

  if (!includeDrafts) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query.single();

  if (error) {
    return null;
  }

  return data as LearningArticle;
}

export async function getLearningArticleById(id: string): Promise<LearningArticle | null> {
  const { data, error } = await supabase
    .from(ARTICLES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as LearningArticle;
}

export async function getLearningPillarTree(
  pillarId: string,
  includeDrafts: boolean
): Promise<LearningTopicWithArticles[]> {
  const topics = await getLearningTopicsByPillar(pillarId);

  const topicTrees = await Promise.all(
    topics.map(async (topic) => {
      const articles = await getLearningArticlesByTopic(topic.id, includeDrafts);
      return {
        ...topic,
        articles,
      };
    })
  );

  return topicTrees;
}

export async function getLearningLibrary(
  includeDrafts: boolean
): Promise<LearningPillarWithTopics[]> {
  const pillars = await getLearningPillars();

  const trees = await Promise.all(
    pillars.map(async (pillar) => {
      const topics = await getLearningPillarTree(pillar.id, includeDrafts);
      return {
        ...pillar,
        topics,
      };
    })
  );

  return trees;
}

export interface FlatLearningArticle extends LearningArticle {
  topicName: string;
  topicSlug: string;
}

export function flattenArticles(topics: LearningTopicWithArticles[]): FlatLearningArticle[] {
  return topics.flatMap((topic) =>
    topic.articles.map((article) => ({
      ...article,
      topicName: topic.name,
      topicSlug: topic.slug,
    }))
  );
}

export function getAdjacentArticles(
  flatArticles: FlatLearningArticle[],
  currentSlug: string
): { prev: FlatLearningArticle | null; next: FlatLearningArticle | null } {
  const index = flatArticles.findIndex((article) => article.slug === currentSlug);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? flatArticles[index - 1] : null,
    next: index < flatArticles.length - 1 ? flatArticles[index + 1] : null,
  };
}
