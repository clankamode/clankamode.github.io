import type { ContentPost, ContentPostSummary } from './content-index';

export { loadContentIndex, type ContentPost, type ContentTopic } from './content-index';

function safeHref(path: string): string {
  const trimmed = path.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    return '#';
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return '#';
}

function formatDispatchNumber(number: unknown): string {
  if (typeof number === 'number' && Number.isFinite(number) && number >= 0) {
    return String(Math.floor(number)).padStart(3, '0');
  }
  return '—';
}

function formatReadMinutes(minutes: unknown): string {
  if (typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0) {
    return `${Math.ceil(minutes)} min read`;
  }
  return 'quick read';
}

function createMetaBadge(label: string): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'archive-meta-badge';
  badge.textContent = label;
  return badge;
}

export function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  const safeValue = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  const resolvedPlural = plural === `${singular}s` && singular.endsWith('ch') ? `${singular}es` : plural;
  return `${safeValue} ${safeValue === 1 ? singular : resolvedPlural}`;
}

export function topicHref(topicSlug: string): string {
  return safeHref(`/topics/${topicSlug}/`);
}

export function createTopicChip(topic: { slug: string; name: string }): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'topic-chip';
  link.href = topicHref(topic.slug);
  link.textContent = topic.name;
  return link;
}

export function createArchiveCard(post: ContentPost): HTMLElement {
  const article = document.createElement('article');
  article.className = 'archive-card';

  const kicker = document.createElement('div');
  kicker.className = 'archive-card-kicker';
  kicker.textContent = `dispatch ${formatDispatchNumber(post.number)} · ${post.date}`;

  const title = document.createElement('h2');
  title.className = 'archive-card-title';
  const link = document.createElement('a');
  link.href = safeHref(post.canonicalPath);
  link.textContent = post.title;
  title.append(link);

  const summary = document.createElement('p');
  summary.className = 'archive-card-summary';
  summary.textContent = post.summary;

  const meta = document.createElement('div');
  meta.className = 'archive-card-meta';
  meta.append(
    createMetaBadge(formatReadMinutes(post.estimatedReadMinutes)),
    createMetaBadge(post.audio ? 'listen available' : 'read only'),
  );

  const topics = document.createElement('div');
  topics.className = 'topic-chip-row';
  if (Array.isArray(post.topics)) {
    post.topics.forEach((topic) => {
      topics.append(createTopicChip(topic));
    });
  }

  article.append(kicker, title, summary, meta, topics);
  return article;
}

export function createCompactLogRow(post: ContentPostSummary): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row archive-preview-row';

  const left = document.createElement('div');
  left.className = 'archive-preview-main';

  const title = document.createElement('span');
  title.className = 'row-name';
  const link = document.createElement('a');
  link.href = safeHref(post.canonicalPath);
  link.textContent = `${formatDispatchNumber(post.number)}: ${post.title}`;
  title.append(link);

  const excerpt = document.createElement('span');
  excerpt.className = 'row-excerpt';
  excerpt.textContent = post.summary;

  left.append(title, excerpt);

  const meta = document.createElement('div');
  meta.className = 'archive-preview-meta';

  const date = document.createElement('span');
  date.className = 'row-meta';
  date.textContent = post.date;

  const format = document.createElement('span');
  format.className = 'row-meta';
  format.textContent = post.audio ? 'listen' : 'read';

  meta.append(date, format);
  row.append(left, meta);

  return row;
}

export function populateSelect(
  select: HTMLSelectElement,
  options: ReadonlyArray<{ value: string; label: string }>,
): void {
  select.textContent = '';
  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.append(element);
  });
}
