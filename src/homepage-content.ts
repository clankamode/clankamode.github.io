import { loadContentIndex, createCompactLogRow, createTopicChip } from './content-browser';

function createFeaturedMeta(label: string): HTMLSpanElement {
  const item = document.createElement('span');
  item.className = 'featured-meta-badge';
  item.textContent = label;
  return item;
}

export async function renderHomepageContent(): Promise<void> {
  const featuredHost = document.getElementById('homepage-featured-log');
  const previewHost = document.getElementById('homepage-log-preview');
  const topicsHost = document.getElementById('homepage-topic-preview');
  const postsCount = document.getElementById('stat-posts');
  const audioCount = document.getElementById('stat-audio-posts');
  const archiveCta = document.getElementById('logs-archive-link-count');

  const { featured, recent, topics, counts } = (await loadContentIndex()).homepage;

  if (featuredHost && featured) {
    featuredHost.textContent = '';
    const featuredLink = document.createElement('a');
    featuredLink.className = 'featured-log';
    featuredLink.href = featured.canonicalPath;

    const kicker = document.createElement('span');
    kicker.className = 'featured-kicker';
    kicker.textContent = `latest dispatch · ${featured.date}`;

    const title = document.createElement('span');
    title.className = 'featured-title';
    title.textContent = `${String(featured.number).padStart(3, '0')}: ${featured.title}`;

    const meta = document.createElement('div');
    meta.className = 'featured-meta';
    meta.append(
      createFeaturedMeta(`${featured.estimatedReadMinutes} min read`),
      createFeaturedMeta(featured.audio ? 'audio available' : 'text only'),
      createFeaturedMeta(`${featured.topics.length} topic lanes`),
    );

    const snippet = document.createElement('span');
    snippet.className = 'featured-snippet';
    snippet.textContent = featured.summary;

    const topics = document.createElement('div');
    topics.className = 'topic-chip-row featured-topic-row';
    featured.topics.slice(0, 3).forEach((topic) => {
      topics.append(createTopicChip(topic));
    });

    const read = document.createElement('span');
    read.className = 'featured-read';
    read.textContent = 'open dispatch';

    featuredLink.append(kicker, title, meta, snippet, topics, read);
    featuredHost.append(featuredLink);
  }

  if (previewHost) {
    previewHost.textContent = '';
    recent.filter((post) => post.slug !== featured?.slug).slice(0, 5).forEach((post) => {
      previewHost.append(createCompactLogRow(post));
    });
  }

  if (topicsHost) {
    topicsHost.textContent = '';
    topics.slice(0, 6).forEach((topic) => {
      topicsHost.append(createTopicChip(topic));
    });
  }

  if (postsCount) {
    postsCount.textContent = `${String(counts.posts).padStart(3, '0')} posts`;
  }

  if (audioCount) {
    audioCount.textContent = `${String(counts.audioPosts).padStart(3, '0')} with audio`;
  }

  if (archiveCta) {
    archiveCta.textContent = `browse all ${counts.posts} dispatches`;
  }
}
