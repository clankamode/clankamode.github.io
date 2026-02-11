export interface LearningPillar {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  order_index: number;
  created_at: string;
}

export interface LearningTopic {
  id: string;
  pillar_id: string;
  slug: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface LearningArticle {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  reading_time_minutes: number | null;
  is_premium: boolean;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  concept_tags: string[];
  primary_concept: string | null;
}

export interface LearningTopicWithArticles extends LearningTopic {
  articles: LearningArticle[];
}

export interface LearningPillarWithTopics extends LearningPillar {
  topics: LearningTopicWithArticles[];
}
