'use client';

interface ArticleData {
  id: string;
  topic_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  is_premium: boolean;
  is_published: boolean;
}

interface PillarTopic {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface ArticleFormProps {
  article: ArticleData;
  pillars: PillarTopic[];
  onChange: (next: ArticleData) => void;
}

export default function ArticleForm({ article, pillars, onChange }: ArticleFormProps) {
  const topicOptions = pillars.flatMap((pillar) =>
    pillar.topics.map((topic) => ({
      id: topic.id,
      label: `${pillar.name} / ${topic.name}`,
    }))
  );

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-interactive/70 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</label>
          <input
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary"
            value={article.title}
            onChange={(event) => onChange({ ...article, title: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Slug</label>
          <input
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary"
            value={article.slug}
            onChange={(event) => onChange({ ...article, slug: event.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Excerpt</label>
          <textarea
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary"
            rows={3}
            value={article.excerpt ?? ''}
            onChange={(event) => onChange({ ...article, excerpt: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Topic</label>
          <select
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary"
            value={article.topic_id}
            onChange={(event) => onChange({ ...article, topic_id: event.target.value })}
          >
            {topicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={article.is_premium}
              onChange={(event) => onChange({ ...article, is_premium: event.target.checked })}
            />
            Premium content
          </label>
        </div>
      </div>
    </div>
  );
}
