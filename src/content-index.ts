export type ContentTopicRef = {
  slug: string;
  name: string;
  description: string;
};

export type ContentPostSummary = {
  slug: string;
  number: number;
  title: string;
  date: string;
  summary: string;
  topics: ContentTopicRef[];
  featured: boolean;
  audio: boolean;
  canonicalPath: string;
  estimatedReadMinutes: number;
  series: string;
  year: number;
};

export type ContentPost = ContentPostSummary & {
  previous: ContentPostSummary | null;
  next: ContentPostSummary | null;
  related: ContentPostSummary[];
};

export type ContentTopic = ContentTopicRef & {
  count: number;
  latestDate: string | null;
  posts: ContentPostSummary[];
};

export type ContentIndex = {
  generatedAt: string;
  homepage: {
    featured: ContentPostSummary | null;
    recent: ContentPostSummary[];
    topics: ContentTopic[];
    counts: {
      posts: number;
      audioPosts: number;
      topics: number;
    };
    years: number[];
  };
  posts: ContentPost[];
  topics: ContentTopic[];
};

let contentIndexPromise: Promise<ContentIndex> | null = null;

function isTopicRef(value: unknown): value is ContentTopicRef {
  if (!value || typeof value !== 'object') return false;

  const topic = value as Partial<ContentTopicRef>;
  return (
    typeof topic.slug === 'string' &&
    typeof topic.name === 'string' &&
    typeof topic.description === 'string'
  );
}

function isPostSummary(value: unknown): value is ContentPostSummary {
  if (!value || typeof value !== 'object') return false;

  const post = value as Partial<ContentPostSummary>;
  return (
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    typeof post.date === 'string' &&
    typeof post.summary === 'string' &&
    typeof post.canonicalPath === 'string' &&
    typeof post.number === 'number' &&
    Number.isFinite(post.number) &&
    Array.isArray(post.topics) &&
    post.topics.every(isTopicRef)
  );
}

function isContentTopic(value: unknown): value is ContentTopic {
  if (!isTopicRef(value)) return false;

  const topic = value as Partial<ContentTopic>;
  return (
    typeof topic.count === 'number' &&
    Number.isFinite(topic.count) &&
    (topic.latestDate === null || typeof topic.latestDate === 'string') &&
    Array.isArray(topic.posts) &&
    topic.posts.every(isPostSummary)
  );
}

function isContentIndex(value: unknown): value is ContentIndex {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<ContentIndex>;
  const counts = candidate.homepage?.counts;
  const countsOk =
    !!counts &&
    typeof counts.posts === 'number' &&
    Number.isFinite(counts.posts) &&
    typeof counts.audioPosts === 'number' &&
    Number.isFinite(counts.audioPosts) &&
    typeof counts.topics === 'number' &&
    Number.isFinite(counts.topics);

  return (
    typeof candidate.generatedAt === 'string' &&
    Array.isArray(candidate.posts) &&
    candidate.posts.every(isPostSummary) &&
    Array.isArray(candidate.topics) &&
    candidate.topics.every(isContentTopic) &&
    !!candidate.homepage &&
    (candidate.homepage.featured === null ||
      candidate.homepage.featured === undefined ||
      isPostSummary(candidate.homepage.featured)) &&
    Array.isArray(candidate.homepage.recent) &&
    candidate.homepage.recent.every(isPostSummary) &&
    Array.isArray(candidate.homepage.topics) &&
    candidate.homepage.topics.every(isContentTopic) &&
    countsOk &&
    Array.isArray(candidate.homepage.years) &&
    candidate.homepage.years.every((year) => typeof year === 'number' && Number.isFinite(year))
  );
}

export async function loadContentIndex(): Promise<ContentIndex> {
  if (!contentIndexPromise) {
    contentIndexPromise = fetch('/content-index.json', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`content index ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        if (!isContentIndex(data)) {
          throw new Error('invalid content index payload');
        }

        return data;
      })
      .catch((error) => {
        contentIndexPromise = null;
        throw error;
      });
  }

  return contentIndexPromise;
}
