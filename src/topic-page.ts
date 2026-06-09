import './styles.css';
import { initUI } from './ui-scripts';
import './clanka-cmdk';
import { loadContentIndex, createArchiveCard, formatCount, type ContentPost } from './content-browser';

async function renderTopicPage(): Promise<void> {
  const slug = document.body.dataset.topicSlug;
  if (!slug) return;

  const description = document.getElementById('topic-description');
  const count = document.getElementById('topic-count');
  const latest = document.getElementById('topic-latest');
  const postsHost = document.getElementById('topic-posts');

  if (!description || !count || !latest || !postsHost) {
    return;
  }

  let contentIndex;
  try {
    contentIndex = await loadContentIndex();
  } catch {
    description.textContent = 'archive unavailable';
    count.textContent = '';
    latest.textContent = '';
    postsHost.textContent = '';
    return;
  }

  const topic = contentIndex.topics.find((entry) => entry.slug === slug);
  if (!topic) {
    description.textContent = 'unknown topic';
    count.textContent = '';
    latest.textContent = '';
    postsHost.textContent = '';
    return;
  }

  description.textContent = topic.description;
  count.textContent = formatCount(topic.count, 'dispatch');
  latest.textContent = topic.latestDate ? `last dispatch · ${topic.latestDate}` : 'last dispatch · n/a';

  postsHost.textContent = '';
  topic.posts.forEach((post, index) => {
    const detailed = contentIndex.posts.find((entry) => entry.slug === post.slug) ?? post;
    const card = createArchiveCard(detailed as ContentPost);
    if (index === 0) {
      card.classList.add('archive-card--featured');
    }
    postsHost.append(card);
  });
}

initUI();
void renderTopicPage();