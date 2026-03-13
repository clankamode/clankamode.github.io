import { CONTENT_INDEX, createCompactLogRow, createTopicChip, formatCount } from './content-browser';

export function renderHomepageContent(): void {
  const featuredHost = document.getElementById('homepage-featured-log');
  const previewHost = document.getElementById('homepage-log-preview');
  const topicsHost = document.getElementById('homepage-topic-preview');
  const postsCount = document.getElementById('stat-posts');
  const audioCount = document.getElementById('stat-audio-posts');
  const archiveCta = document.getElementById('logs-archive-link-count');

  const { featured, recent, topics, counts } = CONTENT_INDEX.homepage;

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

    const snippet = document.createElement('span');
    snippet.className = 'featured-snippet';
    snippet.textContent = featured.summary;

    const read = document.createElement('span');
    read.className = 'featured-read';
    read.textContent = 'READ →';

    featuredLink.append(kicker, title, snippet, read);
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
    topics.forEach((topic) => {
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
