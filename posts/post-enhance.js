/* Post page enhancements — injected via <script> at end of each post */
(() => {
  const CONTENT_INDEX_URL = '/content-index.json';

  const injectStyles = () => {
    if (document.getElementById('post-enhance-styles')) return;

    const style = document.createElement('style');
    style.id = 'post-enhance-styles';
    style.textContent = `
      .post-topic-chips,
      .related-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .post-topic-chips {
        margin: -1.5rem 0 2rem;
      }
      .post-chip {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--dim);
        font-size: 11px;
        text-decoration: none;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .post-chip:hover {
        color: var(--accent);
        border-color: var(--accent);
      }
      .related-posts {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border);
      }
      .related-label {
        display: block;
        margin-bottom: 0.9rem;
        color: var(--dim);
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .related-link {
        display: block;
        flex: 1 1 200px;
        border: 1px solid var(--border);
        background: var(--surface);
        padding: 12px 14px;
        text-decoration: none;
      }
      .related-link-title {
        display: block;
        color: var(--strong);
        margin-bottom: 6px;
      }
      .related-link-summary {
        display: block;
        color: var(--dim);
        font-size: 12px;
      }
      .related-link:hover .related-link-title {
        color: var(--accent);
      }
      .post-nav-enhanced {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border);
        font-size: 13px;
      }
      .post-nav-enhanced a {
        color: var(--dim);
        text-decoration: none;
        letter-spacing: 0.04em;
      }
      .post-nav-enhanced a:hover {
        color: var(--accent);
      }
      .post-nav-spacer {
        visibility: hidden;
      }
    `;
    document.head.append(style);
  };

  // 1. Reading progress bar
  const bar = document.createElement('div');
  Object.assign(bar.style, {
    position: 'fixed', top: '0', left: '0', height: '2px', width: '0%',
    background: 'linear-gradient(90deg, #c8f542, rgba(200, 245, 66, 0.4))',
    zIndex: '9990', transition: 'width 60ms linear',
    boxShadow: '0 0 8px rgba(200, 245, 66, 0.4)',
  });
  document.body.prepend(bar);
  const updateBar = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? ((window.scrollY / h) * 100) + '%' : '0%';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  // 2. Estimated reading time
  const content = document.querySelector('.page');
  if (content) {
    const words = content.textContent?.split(/\s+/).length || 0;
    const mins = Math.max(1, Math.ceil(words / 220));
    const meta = document.querySelector('.meta');
    if (meta && !/\bmin read\b/i.test(meta.textContent || '')) {
      meta.innerHTML += ` &nbsp;·&nbsp; ${mins} min read`;
    }
  }

  // 3. Keyboard navigation: j/k for prev/next
  const navLinks = document.querySelectorAll('.post-nav a');
  const prev = navLinks[0]?.getAttribute('href');
  const next = navLinks.length > 1 ? navLinks[1].getAttribute('href') : null;
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'j' && next) window.location.href = next;
    if (e.key === 'k' && prev) window.location.href = prev;
  });

  // 4. Back to top on 't'
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 't') window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 5. Shared metadata-driven archive enhancements
  (async () => {
    injectStyles();

    const slug = window.location.pathname.split('/').pop()?.replace(/\.html$/, '');
    if (!slug) return;

    try {
      const response = await fetch(CONTENT_INDEX_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;

      const contentIndex = await response.json();
      const currentPost = Array.isArray(contentIndex.posts)
        ? contentIndex.posts.find((entry) => entry.slug === slug)
        : null;

      if (!currentPost) return;

      const meta = document.querySelector('.meta');
      if (meta && currentPost.audio && !/listen available/i.test(meta.textContent || '')) {
        meta.innerHTML += ' &nbsp;·&nbsp; listen available';
      }

      if (meta && Array.isArray(currentPost.topics) && currentPost.topics.length > 0) {
        const chipRow = document.createElement('div');
        chipRow.className = 'post-topic-chips';
        currentPost.topics.forEach((topic) => {
          const link = document.createElement('a');
          link.className = 'post-chip';
          link.href = `/topics/${topic.slug}/`;
          link.textContent = topic.name;
          chipRow.append(link);
        });
        meta.insertAdjacentElement('afterend', chipRow);
      }

      const footer = document.querySelector('.footer');
      if (footer && Array.isArray(currentPost.related) && currentPost.related.length > 0) {
        const related = document.createElement('section');
        related.className = 'related-posts';

        const label = document.createElement('span');
        label.className = 'related-label';
        label.textContent = 'related dispatches';

        const links = document.createElement('div');
        links.className = 'related-links';

        currentPost.related.forEach((post) => {
          const anchor = document.createElement('a');
          anchor.className = 'related-link';
          anchor.href = post.canonicalPath;

          const title = document.createElement('span');
          title.className = 'related-link-title';
          title.textContent = `${String(post.number).padStart(3, '0')}: ${post.title}`;

          const summary = document.createElement('span');
          summary.className = 'related-link-summary';
          summary.textContent = post.summary;

          anchor.append(title, summary);
          links.append(anchor);
        });

        related.append(label, links);
        footer.insertAdjacentElement('beforebegin', related);
      }

      const nav = document.querySelector('.post-nav') || document.querySelector('.post-nav-enhanced');
      const navigation = nav || document.createElement('div');
      navigation.className = 'post-nav post-nav-enhanced';
      navigation.innerHTML = '';

      const older = currentPost.previous;
      const newer = currentPost.next;

      if (older) {
        const olderLink = document.createElement('a');
        olderLink.href = older.canonicalPath;
        olderLink.textContent = `← older dispatch · ${String(older.number).padStart(3, '0')}`;
        navigation.append(olderLink);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'post-nav-spacer';
        spacer.textContent = ' ';
        navigation.append(spacer);
      }

      if (newer) {
        const newerLink = document.createElement('a');
        newerLink.href = newer.canonicalPath;
        newerLink.textContent = `newer dispatch · ${String(newer.number).padStart(3, '0')} →`;
        navigation.append(newerLink);
      }

      if (!nav && footer) {
        footer.insertAdjacentElement('beforebegin', navigation);
      }
    } catch {
      // Best-effort enhancement only.
    }
  })();
})();
