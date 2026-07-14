import { loadContentIndex, createCompactLogRow, createTopicChip } from './content-browser';

function createFeaturedMeta(label: string): HTMLSpanElement {
  const item = document.createElement('span');
  item.className = 'featured-meta-badge';
  item.textContent = label;
  return item;
}

function showArchiveUnavailable(host: HTMLElement | null): void {
  if (!host) return;
  host.textContent = '';
  host.textContent = '// archive unavailable';
}

function applyHomepageCounts(
  counts: { posts: number; audioPosts: number } | null,
  unavailable = false,
): void {
  const postsCount = document.getElementById('stat-posts');
  const audioCount = document.getElementById('stat-audio-posts');
  const archiveCta = document.getElementById('logs-archive-link-count');

  if (unavailable || !counts) {
    if (postsCount) postsCount.textContent = 'archive unavailable';
    if (audioCount) audioCount.textContent = 'audio unavailable';
    if (archiveCta) archiveCta.textContent = 'archive unavailable';
    return;
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

/** Eagerly hydrate homepage post counts (not gated on logs-section scroll). */
export async function renderHomepageStats(): Promise<void> {
  try {
    const { counts } = (await loadContentIndex()).homepage;
    applyHomepageCounts(counts);
  } catch {
    applyHomepageCounts(null, true);
  }
}

export async function renderHomepageContent(): Promise<void> {
  const featuredHost = document.getElementById('homepage-featured-log');
  const previewHost = document.getElementById('homepage-log-preview');
  const topicsHost = document.getElementById('homepage-topic-preview');

  let featured;
  let recent;
  let topics;
  let counts;
  try {
    ({ featured, recent, topics, counts } = (await loadContentIndex()).homepage);
  } catch {
    showArchiveUnavailable(featuredHost);
    showArchiveUnavailable(previewHost);
    if (topicsHost) topicsHost.textContent = '';
    applyHomepageCounts(null, true);
    return;
  }

  applyHomepageCounts(counts);

  if (featuredHost) {
    featuredHost.textContent = '';
    if (!featured) {
      featuredHost.textContent = '// no featured dispatch';
    } else {
      try {
        const card = document.createElement('div');
        card.className = 'card';

        const featuredLink = document.createElement('a');
        featuredLink.className = 'featured-log';
        featuredLink.href = featured.canonicalPath;

        const kicker = document.createElement('span');
        kicker.className = 'featured-kicker';
        kicker.textContent = `latest dispatch · ${featured.date}`;

        const postNumber = typeof featured.number === 'number'
          ? String(featured.number).padStart(3, '0')
          : '---';
        const title = document.createElement('span');
        title.className = 'featured-title';
        title.textContent = `${postNumber}: ${featured.title}`;

        const featuredTopics = Array.isArray(featured.topics) ? featured.topics : [];
        const readMinutes = typeof featured.estimatedReadMinutes === 'number'
          ? featured.estimatedReadMinutes
          : null;

        const meta = document.createElement('div');
        meta.className = 'featured-meta';
        meta.append(
          createFeaturedMeta(readMinutes !== null ? `${readMinutes} min read` : 'read time unknown'),
          createFeaturedMeta(featured.audio ? 'audio available' : 'text only'),
          createFeaturedMeta(`${featuredTopics.length} topic lanes`),
        );

        const snippet = document.createElement('span');
        snippet.className = 'featured-snippet';
        snippet.textContent = featured.summary;

        const read = document.createElement('span');
        read.className = 'featured-read';
        read.textContent = 'open dispatch';

        featuredLink.append(kicker, title, meta, snippet, read);

        const topicRow = document.createElement('div');
        topicRow.className = 'topic-chip-row featured-topic-row';
        featuredTopics.slice(0, 3).forEach((topic) => {
          topicRow.append(createTopicChip(topic));
        });

        card.append(featuredLink, topicRow);
        featuredHost.append(card);
      } catch {
        showArchiveUnavailable(featuredHost);
      }
    }
  }

  if (previewHost) {
    try {
      previewHost.textContent = '';
      const sortedRecent = [...recent].sort((left, right) => right.date.localeCompare(left.date));
      sortedRecent.filter((post) => post.slug !== featured?.slug).slice(0, 5).forEach((post) => {
        previewHost.append(createCompactLogRow(post));
      });
    } catch {
      showArchiveUnavailable(previewHost);
    }
  }

  if (topicsHost) {
    try {
      topicsHost.textContent = '';
      const sortedTopics = [...topics].sort((left, right) => right.count - left.count);
      sortedTopics.slice(0, 6).forEach((topic) => {
        topicsHost.append(createTopicChip(topic));
      });
    } catch {
      topicsHost.textContent = '';
    }
  }
}
