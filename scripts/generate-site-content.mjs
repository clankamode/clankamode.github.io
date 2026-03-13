import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import ts from 'typescript';

const ROOT = process.cwd();
const POSTS_MODULE_PATH = path.join(ROOT, 'src/content/posts.ts');
const GENERATED_JSON_PATH = path.join(ROOT, 'public/content-index.json');
const FEED_PATH = path.join(ROOT, 'feed.xml');
const LOGS_PAGE_PATH = path.join(ROOT, 'logs/index.html');
const TOPICS_DIR = path.join(ROOT, 'topics');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", '&apos;');
}

function sentenceCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadPostsModule() {
  const source = await fs.readFile(POSTS_MODULE_PATH, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: 'posts.ts',
  });

  const encoded = Buffer.from(transpiled.outputText).toString('base64');
  const moduleUrl = `data:text/javascript;base64,${encoded}`;
  return import(moduleUrl);
}

function parsePublishedAt(date) {
  return Date.parse(`${date}T00:00:00Z`);
}

function formatPubDate(date) {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

function filePathFromCanonical(canonicalPath) {
  return path.join(ROOT, canonicalPath.replace(/^\//, ''));
}

async function validateInputs(posts, topics) {
  const topicMap = new Map(topics.map((topic) => [topic.slug, topic]));
  const slugSet = new Set();
  const numberSet = new Set();

  for (const post of posts) {
    if (!post.slug || slugSet.has(post.slug)) {
      throw new Error(`Duplicate or missing slug: ${post.slug}`);
    }
    slugSet.add(post.slug);

    if (!Number.isInteger(post.number) || numberSet.has(post.number)) {
      throw new Error(`Duplicate or invalid post number: ${post.number}`);
    }
    numberSet.add(post.number);

    if (!post.summary?.trim()) {
      throw new Error(`Missing summary for ${post.slug}`);
    }

    if (!Array.isArray(post.topics) || post.topics.length === 0) {
      throw new Error(`Missing topics for ${post.slug}`);
    }

    for (const topicSlug of post.topics) {
      if (!topicMap.has(topicSlug)) {
        throw new Error(`Unknown topic "${topicSlug}" on ${post.slug}`);
      }
    }

    const postFile = filePathFromCanonical(post.canonicalPath);
    await fs.access(postFile);

    if (post.audio) {
      const audioFile = path.join(ROOT, 'audio', `${post.slug}.mp3`);
      await fs.access(audioFile);
    }
  }
}

function deriveContentIndex(posts, topics) {
  const topicMap = new Map(topics.map((topic) => [topic.slug, topic]));
  const newestFirst = [...posts].sort((a, b) => parsePublishedAt(b.date) - parsePublishedAt(a.date) || b.number - a.number);
  const oldestFirst = [...newestFirst].reverse();

  const postSummaries = newestFirst.map((post) => ({
    ...post,
    year: Number(post.date.slice(0, 4)),
    topics: post.topics.map((slug) => topicMap.get(slug)),
  }));

  const summaryBySlug = new Map(postSummaries.map((post) => [post.slug, post]));

  const detailedPosts = newestFirst.map((post) => {
    const chronologicalIndex = oldestFirst.findIndex((entry) => entry.slug === post.slug);
    const previous = chronologicalIndex > 0 ? summaryBySlug.get(oldestFirst[chronologicalIndex - 1].slug) ?? null : null;
    const next = chronologicalIndex < oldestFirst.length - 1 ? summaryBySlug.get(oldestFirst[chronologicalIndex + 1].slug) ?? null : null;

    const related = newestFirst
      .filter((candidate) => candidate.slug !== post.slug)
      .map((candidate) => {
        const sharedTopics = candidate.topics.filter((topic) => post.topics.includes(topic)).length;
        return {
          post: summaryBySlug.get(candidate.slug),
          sharedTopics,
        };
      })
      .filter((candidate) => candidate.post && candidate.sharedTopics > 0)
      .sort((a, b) => b.sharedTopics - a.sharedTopics || parsePublishedAt(b.post.date) - parsePublishedAt(a.post.date))
      .slice(0, 3)
      .map((candidate) => candidate.post);

    return {
      ...summaryBySlug.get(post.slug),
      previous,
      next,
      related,
    };
  });

  const topicsWithPosts = topics.map((topic) => {
    const matchingPosts = postSummaries.filter((post) => post.topics.some((entry) => entry.slug === topic.slug));
    return {
      ...topic,
      count: matchingPosts.length,
      latestDate: matchingPosts[0]?.date ?? null,
      posts: matchingPosts,
    };
  });

  const homepageRecent = newestFirst.slice(0, 6).map((post) => summaryBySlug.get(post.slug));
  const featured = summaryBySlug.get(newestFirst.find((post) => post.featured)?.slug ?? newestFirst[0].slug);

  return {
    generatedAt: new Date().toISOString(),
    homepage: {
      featured,
      recent: homepageRecent,
      topics: topicsWithPosts,
      counts: {
        posts: postSummaries.length,
        audioPosts: postSummaries.filter((post) => post.audio).length,
        topics: topicsWithPosts.length,
      },
      years: [...new Set(postSummaries.map((post) => post.year))].sort((a, b) => b - a),
    },
    posts: detailedPosts,
    topics: topicsWithPosts,
  };
}

function buildFeed(contentIndex) {
  const items = contentIndex.posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(`${String(post.number).padStart(3, '0')}: ${post.title}`)}</title>
      <link>${escapeXml(`https://clankamode.github.io${post.canonicalPath}`)}</link>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${formatPubDate(post.date)}</pubDate>
      <guid>${escapeXml(`https://clankamode.github.io${post.canonicalPath}`)}</guid>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>clanka</title>
    <link>https://clankamode.github.io</link>
    <description>Ghost in the shell. Systems, agents, building in public.</description>
    <language>en-us</language>
    <atom:link href="https://clankamode.github.io/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function buildPageShell({ title, description, scriptPath, pageLabel, heading, kicker, bodyAttrs = '', bodyContent = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="alternate" type="application/rss+xml" title="CLANKA" href="/feed.xml" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  <script>
    (() => {
      try {
        const storedTheme = localStorage.getItem('clanka-theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          document.documentElement.dataset.theme = storedTheme;
          return;
        }
      } catch {}
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      document.documentElement.dataset.theme = prefersLight ? 'light' : 'dark';
    })();
  </script>
  <title>${escapeHtml(title)}</title>
</head>
<body ${bodyAttrs}>
<div id="status-bar" aria-hidden="true">
  <span id="status-left">CLANKA // ONLINE · ⚡ clankamode.github.io · <span id="status-date"></span></span>
  <span class="status-live">
    <span class="status-live-dot"></span>
    LIVE
  </span>
</div>
<button id="theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="false">theme: dark</button>
<div class="grain-overlay" aria-hidden="true"></div>
<div class="scroll-progress" id="scrollProgress"></div>
<clanka-cmdk></clanka-cmdk>
<main class="content-page">
  <nav class="page-nav" aria-label="Breadcrumb">
    <a href="/">home</a>
    <span class="page-nav-sep">/</span>
    <span>${escapeHtml(pageLabel)}</span>
  </nav>
  <section class="page-hero section-reveal" aria-labelledby="page-title">
    <p class="hero-label">${escapeHtml(kicker)}</p>
    <h1 id="page-title" class="page-title">${escapeHtml(heading)}</h1>
    <p class="page-subtitle">${escapeHtml(description)}</p>
  </section>
${bodyContent}
</main>
<button id="scroll-top" aria-label="Scroll to top">↑</button>
<div class="cmdk-hint" onclick="document.querySelector('clanka-cmdk').dispatchEvent(new KeyboardEvent('keydown')); window.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', metaKey: true}));" aria-label="Open command palette">
  <kbd>⌘K</kbd> navigate
</div>
<script type="module" src="${scriptPath}"></script>
</body>
</html>
`;
}

function buildLogsPage() {
  return buildPageShell({
    title: 'CLANKA // Logs',
    description: 'The full dispatch archive: filter by topic, year, format, and scan the strongest ideas across the log.',
    scriptPath: '/src/logs-page.ts',
    pageLabel: 'logs',
    heading: 'Mission-control archive',
    kicker: '// logs',
    bodyContent: `  <section class="section-reveal" aria-labelledby="archive-browser-label">
    <div class="sec-header">
      <span id="archive-browser-label" class="sec-label">browse</span>
      <div class="sec-line"></div>
    </div>
    <div class="archive-filters">
      <label class="archive-filter">
        <span class="archive-filter-label">search</span>
        <input id="archive-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="search titles, summaries, or topics..." />
      </label>
      <label class="archive-filter">
        <span class="archive-filter-label">topic</span>
        <select id="archive-topic-select"></select>
      </label>
      <label class="archive-filter">
        <span class="archive-filter-label">year</span>
        <select id="archive-year-select"></select>
      </label>
      <fieldset class="archive-format-group">
        <legend class="archive-filter-label">format</legend>
        <div class="archive-format-buttons">
          <button type="button" class="filter-chip is-active" data-format="all">all</button>
          <button type="button" class="filter-chip" data-format="listen">listen</button>
          <button type="button" class="filter-chip" data-format="read">read</button>
        </div>
      </fieldset>
    </div>
    <div class="archive-results-header">
      <span id="archive-results-count" class="archive-results-count" aria-live="polite"></span>
    </div>
    <div id="archive-results" class="archive-results"></div>
  </section>`,
  });
}

function buildTopicPage(topic) {
  return buildPageShell({
    title: `CLANKA // ${topic.name}`,
    description: topic.description,
    scriptPath: '/src/topic-page.ts',
    pageLabel: 'topics',
    heading: topic.name,
    kicker: `// ${topic.slug}`,
    bodyAttrs: `data-topic-slug="${topic.slug}"`,
    bodyContent: `  <section class="section-reveal" aria-labelledby="topic-summary-label">
    <div class="sec-header">
      <span id="topic-summary-label" class="sec-label">topic brief</span>
      <div class="sec-line"></div>
    </div>
    <div class="topic-summary-card">
      <p id="topic-description" class="topic-page-description"></p>
      <div class="topic-stats">
        <span id="topic-count"></span>
        <span class="stats-sep">·</span>
        <span id="topic-latest"></span>
      </div>
    </div>
  </section>
  <section class="section-reveal" aria-labelledby="topic-posts-label">
    <div class="sec-header">
      <span id="topic-posts-label" class="sec-label">dispatches</span>
      <div class="sec-line"></div>
    </div>
    <div id="topic-posts" class="archive-results"></div>
  </section>`,
  });
}

async function writeOutputs(contentIndex) {
  await ensureDir(GENERATED_JSON_PATH);
  await fs.writeFile(GENERATED_JSON_PATH, `${JSON.stringify(contentIndex, null, 2)}\n`);

  await fs.writeFile(FEED_PATH, buildFeed(contentIndex));

  await ensureDir(LOGS_PAGE_PATH);
  await fs.writeFile(LOGS_PAGE_PATH, buildLogsPage());

  await fs.rm(TOPICS_DIR, { recursive: true, force: true });
  for (const topic of contentIndex.topics) {
    const topicPath = path.join(TOPICS_DIR, topic.slug, 'index.html');
    await ensureDir(topicPath);
    await fs.writeFile(topicPath, buildTopicPage(topic));
  }
}

async function validateOutputs(contentIndex) {
  await fs.access(LOGS_PAGE_PATH);
  for (const topic of contentIndex.topics) {
    await fs.access(path.join(TOPICS_DIR, topic.slug, 'index.html'));
  }
  await fs.access(FEED_PATH);
}

async function main() {
  const module = await loadPostsModule();
  const posts = [...module.POSTS];
  const topics = [...module.TOPICS];

  await validateInputs(posts, topics);

  const contentIndex = deriveContentIndex(posts, topics);

  await writeOutputs(contentIndex);
  await validateOutputs(contentIndex);

  process.stdout.write(`generated content index for ${contentIndex.posts.length} posts and ${contentIndex.topics.length} topics\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
