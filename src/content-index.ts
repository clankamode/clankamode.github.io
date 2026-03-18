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

function isContentIndex(value: unknown): value is ContentIndex {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<ContentIndex>;
  return (
    typeof candidate.generatedAt === 'string' &&
    Array.isArray(candidate.posts) &&
    Array.isArray(candidate.topics) &&
    !!candidate.homepage &&
    Array.isArray(candidate.homepage.recent) &&
    Array.isArray(candidate.homepage.topics) &&
    !!candidate.homepage.counts &&
    Array.isArray(candidate.homepage.years)
  );
}

export async function loadContentIndex(): Promise<ContentIndex> {
  if (!contentIndexPromise) {
    contentIndexPromise = fetch('/content-index.json', {
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
