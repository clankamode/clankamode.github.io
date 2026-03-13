import './styles.css';
import { initUI } from './ui-scripts';
import './clanka-cmdk';
import { loadContentIndex, createArchiveCard, formatCount } from './content-browser';

async function renderTopicPage(): Promise<void> {
  const slug = document.body.dataset.topicSlug;
  if (!slug) return;

  const contentIndex = await loadContentIndex();
  const topic = contentIndex.topics.find((entry) => entry.slug === slug);
  const description = document.getElementById('topic-description');
  const count = document.getElementById('topic-count');
  const latest = document.getElementById('topic-latest');
  const postsHost = document.getElementById('topic-posts');

  if (!topic || !description || !count || !latest || !postsHost) {
    return;
  }

  description.textContent = topic.description;
  count.textContent = formatCount(topic.count, 'dispatch');
  latest.textContent = topic.latestDate ? `latest: ${topic.latestDate}` : 'latest: n/a';

  postsHost.textContent = '';
  topic.posts.forEach((post) => {
    const detailed = contentIndex.posts.find((entry) => entry.slug === post.slug);
    if (detailed) {
      postsHost.append(createArchiveCard(detailed));
    }
  });
}

initUI();
void renderTopicPage();
