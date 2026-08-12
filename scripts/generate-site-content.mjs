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
const POSTS_DIR = path.join(ROOT, 'posts');
const POST_ENHANCE_SCRIPT = '  <script src="post-enhance.js" defer></script>';

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

function isValidPostDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = parsePublishedAt(date);
  if (!Number.isFinite(parsed)) return false;

  const utc = new Date(parsed);
  const yyyy = String(utc.getUTCFullYear()).padStart(4, '0');
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` === date;
}

function formatPubDate(date) {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

function parseAudioTimingsJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') return null;
    const start = entry.start;
    const end = entry.end;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) return null;
    if (typeof end !== 'number' || !Number.isFinite(end) || end < start) return null;
  }

  return parsed;
}

function filePathFromCanonical(canonicalPath) {
  return path.join(ROOT, canonicalPath.replace(/^\//, ''));
}

async function audioFileExists(slug) {
  try {
    await fs.access(path.join(ROOT, 'audio', `${slug}.mp3`));
    return true;
  } catch {
    return false;
  }
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

    if (!isValidPostDate(post.date)) {
      throw new Error(`Invalid post date for ${post.slug}: expected YYYY-MM-DD, got ${post.date}`);
    }

    if (!Array.isArray(post.topics) || post.topics.length === 0) {
      throw new Error(`Missing topics for ${post.slug}`);
    }

    for (const topicSlug of post.topics) {
      if (!topicMap.has(topicSlug)) {
        throw new Error(`Unknown topic "${topicSlug}" on ${post.slug}`);
      }
    }

    const expectedCanonicalPath = `/posts/${post.slug}.html`;
    if (post.canonicalPath !== expectedCanonicalPath) {
      throw new Error(`canonicalPath mismatch for ${post.slug}: expected ${expectedCanonicalPath}, got ${post.canonicalPath}`);
    }

    const postFile = filePathFromCanonical(post.canonicalPath);
    await fs.access(postFile);

    const hasAudio = await audioFileExists(post.slug);
    if (post.audio !== hasAudio) {
      throw new Error(`audio flag mismatch for ${post.slug}: audio=${post.audio}, mp3 exists=${hasAudio}`);
    }

    const postHtml = await fs.readFile(postFile, 'utf8');
    if (!post.audio && postHtml.includes('Audio coming soon')) {
      throw new Error(
        `Misleading audio placeholder in ${post.slug}. Remove the "Audio coming soon" block or run scripts/strip-placeholder-audio.py.`,
      );
    }
    if (post.audio && !postHtml.includes('data-src=')) {
      throw new Error(`Missing audio data-src for ${post.slug} (audio=true in posts.ts)`);
    }
    if (post.audio && !/<script\b[^>]*\bid=["']audio-timings["']/.test(postHtml)) {
      throw new Error(
        `Missing #audio-timings for ${post.slug} (audio=true). Embed Whisper timings or run whisper_sync.py.`,
      );
    }
    if (post.audio) {
      const timingsMatch = postHtml.match(/<script\b[^>]*\bid=["']audio-timings["'][^>]*>([\s\S]*?)<\/script>/i);
      const timings = timingsMatch ? parseAudioTimingsJson(timingsMatch[1].trim()) : null;
      if (!timings) {
        throw new Error(
          `Invalid #audio-timings JSON for ${post.slug}: expected a non-empty array of {start,end} numbers.`,
        );
      }
    }
    if (!postHtml.includes('post-styles.css')) {
      throw new Error(`Missing shared post-styles.css for ${post.slug}`);
    }
    if (!/<meta\b[^>]*\bname=["']description["']/.test(postHtml)) {
      throw new Error(`Missing meta description for ${post.slug}`);
    }
    if (!postHtml.includes('property="og:title"') && !postHtml.includes("property='og:title'")) {
      throw new Error(`Missing og:title for ${post.slug}`);
    }
    if (!postHtml.includes('property="og:url"') && !postHtml.includes("property='og:url'")) {
      throw new Error(`Missing og:url for ${post.slug}`);
    }
    if (!postHtml.includes('application/rss+xml')) {
      throw new Error(`Missing RSS autodiscovery link for ${post.slug}`);
    }
    if (
      !/<a\b[^>]*\bclass=["']back["'][^>]*\bhref=["']\/["']/.test(postHtml)
      && !/<a\b[^>]*\bhref=["']\/["'][^>]*\bclass=["']back["']/.test(postHtml)
    ) {
      throw new Error(`Missing standardized back link (href="/") for ${post.slug}`);
    }
  }

  const registeredSlugs = new Set(posts.map((post) => post.slug));
  const postFiles = await fs.readdir(POSTS_DIR);

  for (const entry of postFiles) {
    if (!entry.endsWith('.html')) continue;

    const slug = entry.replace(/\.html$/, '');
    if (!registeredSlugs.has(slug)) {
      throw new Error(`Orphan post file "${entry}" is not registered in src/content/posts.ts`);
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
  const featuredPost = newestFirst.find((post) => post.featured) ?? newestFirst[0];
  const featured = summaryBySlug.get(featuredPost.slug);

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

async function buildFeedItem(post) {
  const permalink = `https://clankamode.github.io${post.canonicalPath}`;
  const categories = (Array.isArray(post.topics) ? post.topics : [])
    .map((topic) => `      <category>${escapeXml(topic.name)}</category>`)
    .join('\n');

  let enclosure = '';
  if (post.audio) {
    const audioPath = path.join(ROOT, 'audio', `${post.slug}.mp3`);
    let size;
    try {
      size = (await fs.stat(audioPath)).size;
    } catch {
      throw new Error(`RSS enclosure missing audio file for ${post.slug}: expected ${audioPath}`);
    }
    if (!Number.isFinite(size) || size <= 0) {
      throw new Error(`RSS enclosure has empty audio file for ${post.slug}`);
    }
    enclosure = `\n      <enclosure url="${escapeXml(`https://clankamode.github.io/audio/${post.slug}.mp3`)}" length="${size}" type="audio/mpeg" />`;
  }

  return `    <item>
      <title>${escapeXml(`${String(post.number).padStart(3, '0')}: ${post.title}`)}</title>
      <link>${escapeXml(permalink)}</link>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${formatPubDate(post.date)}</pubDate>
      <guid isPermaLink="true">${escapeXml(permalink)}</guid>
${categories}${enclosure}
    </item>`;
}

async function buildFeed(contentIndex) {
  const items = (await Promise.all(contentIndex.posts.map((post) => buildFeedItem(post)))).join('\n');
  const lastBuildDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>clanka</title>
    <link>https://clankamode.github.io</link>
    <description>Ghost in the shell. Systems, agents, building in public.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://clankamode.github.io/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

/** Compact dispatch template — shared stylesheet + enhancement scripts for future posts. */
function buildCompactPost({
  number,
  title,
  date,
  description,
  bodyHtml,
  audioSrc = null,
  slug = '',
}) {
  const audioBlock = audioSrc
    ? `    <div class="audio-player" data-src="${escapeHtml(audioSrc)}">
      <span class="ap-label">▶ Listen to this post</span>
    </div>\n\n`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(`${number}: ${title} // CLANKA`)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://clankamode.github.io/posts/${escapeHtml(slug)}.html" />
  <meta property="og:image" content="https://clankamode.github.io/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
  <title>${escapeHtml(`${number}: ${title} // CLANKA`)}</title>
  <link rel="stylesheet" href="post-styles.css" />
  <link rel="alternate" type="application/rss+xml" title="clanka" href="../feed.xml" />
</head>
<body>
  <div class="page">
    <a class="back" href="/">← clanka</a>
    <div class="post-number">dispatch ${escapeHtml(String(number).padStart(3, '0'))}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(date)}</div>

${audioBlock}${bodyHtml}

    <div class="footer">
      <a href="/">clankamode</a>
      <span>dispatch ${escapeHtml(String(number).padStart(3, '0'))} · ${escapeHtml(date)}</span>
    </div>
  </div>
  <script src="audio-player.js" defer></script>
${POST_ENHANCE_SCRIPT}
</body>
</html>
`;
}

async function validatePostEnhanceScripts() {
  const entries = await fs.readdir(POSTS_DIR);

  for (const entry of entries) {
    if (!entry.endsWith('.html')) continue;

    const postPath = path.join(POSTS_DIR, entry);
    const html = await fs.readFile(postPath, 'utf8');
    if (!html.includes('post-enhance.js')) {
      throw new Error(
        `Missing post-enhance.js in posts/${entry}. Add ${POST_ENHANCE_SCRIPT.trim()} before </body>, or run scripts/migrate-posts.py.`,
      );
    }
  }
}

function buildStaticPostNav(post) {
  const parts = [];

  if (post.previous) {
    const label = String(post.previous.number).padStart(3, '0');
    parts.push(
      `      <a href="${escapeHtml(post.previous.canonicalPath)}" data-nav="prev">← older dispatch · ${escapeHtml(label)}</a>`,
    );
  } else {
    parts.push('      <span class="post-nav-spacer" aria-hidden="true"> </span>');
  }

  if (post.next) {
    const label = String(post.next.number).padStart(3, '0');
    parts.push(
      `      <a href="${escapeHtml(post.next.canonicalPath)}" data-nav="next">newer dispatch · ${escapeHtml(label)} →</a>`,
    );
  }

  return `    <div class="post-nav">\n${parts.join('\n')}\n    </div>`;
}

async function syncStaticPostNavigation(contentIndex) {
  for (const post of contentIndex.posts) {
    const postPath = filePathFromCanonical(post.canonicalPath);
    const html = await fs.readFile(postPath, 'utf8');
    const navHtml = buildStaticPostNav(post);
    let nextHtml;

    if (/<div class="post-nav\b[^"]*"[^>]*>[\s\S]*?<\/div>/.test(html)) {
      nextHtml = html.replace(
        /[ \t]*<div class="post-nav\b[^"]*"[^>]*>[\s\S]*?<\/div>[ \t]*\n?/,
        `${navHtml}\n`,
      );
    } else if (/<div class="footer\b/.test(html)) {
      nextHtml = html.replace(/[ \t]*<div class="footer\b/, `${navHtml}\n\n    <div class="footer`);
    } else if (/\n<\/div>\s*\n\s*<script\b[\s\S]*post-enhance\.js/.test(html)) {
      // Legacy posts without a .footer still close .page before enhancement scripts.
      nextHtml = html.replace(
        /\n<\/div>(\s*\n\s*<script\b[\s\S]*post-enhance\.js)/,
        `\n${navHtml}\n</div>$1`,
      );
    } else {
      throw new Error(
        `Cannot sync static post-nav for ${post.slug}: missing .post-nav/.footer/page-close anchors.`,
      );
    }

    if (nextHtml !== html) {
      await fs.writeFile(postPath, nextHtml);
    }
  }
}

async function validateStaticPostNavigation(contentIndex) {
  for (const post of contentIndex.posts) {
    const html = await fs.readFile(filePathFromCanonical(post.canonicalPath), 'utf8');
    const navMatch = html.match(/<div class="post-nav\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (!navMatch) {
      throw new Error(`Missing static .post-nav for ${post.slug}`);
    }

    const nav = navMatch[1];
    if (post.previous) {
      const prevHref = `href="${post.previous.canonicalPath}"`;
      if (!nav.includes(prevHref) || !nav.includes('data-nav="prev"')) {
        throw new Error(
          `Static prev nav mismatch for ${post.slug}: expected ${post.previous.canonicalPath}`,
        );
      }
    } else if (nav.includes('data-nav="prev"')) {
      throw new Error(`Static prev nav should be absent for first post ${post.slug}`);
    }

    if (post.next) {
      const nextHref = `href="${post.next.canonicalPath}"`;
      if (!nav.includes(nextHref) || !nav.includes('data-nav="next"')) {
        throw new Error(
          `Static next nav mismatch for ${post.slug}: expected ${post.next.canonicalPath}`,
        );
      }
    } else if (nav.includes('data-nav="next"')) {
      throw new Error(`Static next nav should be absent for latest post ${post.slug}`);
    }
  }
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function readMetaContent(html, attribute, name) {
  const patterns = [
    new RegExp(
      `<meta\\b[^>]*\\b${attribute}=["']${name}["'][^>]*\\bcontent=(["'])([\\s\\S]*?)\\1`,
      'i',
    ),
    new RegExp(
      `<meta\\b[^>]*\\bcontent=(["'])([\\s\\S]*?)\\1[^>]*\\b${attribute}=["']${name}["']`,
      'i',
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[2]);
  }

  return null;
}

function replaceMetaContent(html, attribute, name, content) {
  const escaped = escapeHtml(content);
  const patterns = [
    new RegExp(
      `(<meta\\b[^>]*\\b${attribute}=["']${name}["'][^>]*\\bcontent=)(["'])[\\s\\S]*?\\2`,
      'i',
    ),
    new RegExp(
      `(<meta\\b[^>]*\\bcontent=)(["'])[\\s\\S]*?\\2([^>]*\\b${attribute}=["']${name}["'])`,
      'i',
    ),
  ];

  if (patterns[0].test(html)) {
    return html.replace(patterns[0], `$1$2${escaped}$2`);
  }

  if (patterns[1].test(html)) {
    return html.replace(patterns[1], `$1$2${escaped}$2$3`);
  }

  return null;
}

async function syncPostSummariesIntoHtml(posts) {
  for (const post of posts) {
    const postPath = filePathFromCanonical(post.canonicalPath);
    let html = await fs.readFile(postPath, 'utf8');
    const original = html;

    const withDescription = replaceMetaContent(html, 'name', 'description', post.summary);
    if (!withDescription) {
      throw new Error(`Missing meta description for ${post.slug}; cannot sync summary.`);
    }
    html = withDescription;

    const withOg = replaceMetaContent(html, 'property', 'og:description', post.summary);
    if (withOg) {
      html = withOg;
    } else {
      // Keep social cards aligned with the registry when older posts omit og:description.
      html = html.replace(
        /(<meta\b[^>]*\bname=["']description["'][^>]*\/?>)/i,
        `$1\n  <meta property="og:description" content="${escapeHtml(post.summary)}" />`,
      );
      if (!html.includes('property="og:description"') && !html.includes("property='og:description'")) {
        throw new Error(`Missing og:description for ${post.slug}; cannot sync summary.`);
      }
    }

    if (html !== original) {
      await fs.writeFile(postPath, html);
    }
  }
}

async function validatePostSummariesInHtml(posts) {
  for (const post of posts) {
    const html = await fs.readFile(filePathFromCanonical(post.canonicalPath), 'utf8');
    const description = readMetaContent(html, 'name', 'description');
    const ogDescription = readMetaContent(html, 'property', 'og:description');

    if (description !== post.summary) {
      throw new Error(
        `meta description drift for ${post.slug}: HTML does not match src/content/posts.ts summary.`,
      );
    }

    if (ogDescription !== post.summary) {
      throw new Error(
        `og:description drift for ${post.slug}: HTML does not match src/content/posts.ts summary.`,
      );
    }
  }
}

function buildStaticTopicChips(post) {
  const topics = Array.isArray(post.topics) ? post.topics.filter(Boolean) : [];
  if (topics.length === 0) return '';

  const chips = topics
    .map(
      (topic) =>
        `      <a class="post-chip" href="/topics/${escapeHtml(topic.slug)}/">${escapeHtml(topic.name)}</a>`,
    )
    .join('\n');

  return `    <div class="post-topic-chips" aria-label="Topics">
${chips}
    </div>`;
}

async function syncStaticTopicChips(contentIndex) {
  for (const post of contentIndex.posts) {
    const postPath = filePathFromCanonical(post.canonicalPath);
    const html = await fs.readFile(postPath, 'utf8');
    const chipsHtml = buildStaticTopicChips(post);
    let nextHtml = html;

    if (/<div class="post-topic-chips\b[^"]*"[^>]*>[\s\S]*?<\/div>/.test(html)) {
      if (chipsHtml) {
        nextHtml = html.replace(
          /[ \t]*<div class="post-topic-chips\b[^"]*"[^>]*>[\s\S]*?<\/div>[ \t]*\n?/,
          `${chipsHtml}\n`,
        );
      } else {
        nextHtml = html.replace(
          /[ \t]*<div class="post-topic-chips\b[^"]*"[^>]*>[\s\S]*?<\/div>[ \t]*\n?/,
          '',
        );
      }
    } else if (chipsHtml) {
      if (/<div class="meta\b[^"]*"[^>]*>[\s\S]*?<\/div>/.test(html)) {
        nextHtml = html.replace(
          /(<div class="meta\b[^"]*"[^>]*>[\s\S]*?<\/div>)([ \t]*\n?)/,
          `$1\n${chipsHtml}$2`,
        );
      } else {
        throw new Error(`Cannot sync static topic chips for ${post.slug}: missing .meta anchor.`);
      }
    }

    if (nextHtml !== html) {
      await fs.writeFile(postPath, nextHtml);
    }
  }
}

async function validateStaticTopicChips(contentIndex) {
  for (const post of contentIndex.posts) {
    const html = await fs.readFile(filePathFromCanonical(post.canonicalPath), 'utf8');
    const topics = Array.isArray(post.topics) ? post.topics.filter(Boolean) : [];
    const chipsMatch = html.match(/<div class="post-topic-chips\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);

    if (topics.length === 0) {
      if (chipsMatch) {
        throw new Error(`Unexpected static topic chips for ${post.slug}`);
      }
      continue;
    }

    if (!chipsMatch) {
      throw new Error(`Missing static topic chips for ${post.slug}`);
    }

    for (const topic of topics) {
      const href = `/topics/${topic.slug}/`;
      if (!chipsMatch[1].includes(`href="${href}"`) || !chipsMatch[1].includes(topic.name)) {
        throw new Error(`Static topic chip missing ${topic.slug} on ${post.slug}`);
      }
    }
  }
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
<a class="skip-link" href="#main-content">Skip to main content</a>
<div id="status-bar" role="status" aria-live="polite">
  <span id="status-left">CLANKA · ⚡ clankamode.github.io · <span id="status-date"></span></span>
  <span class="status-live">
    <span class="status-live-dot" id="status-live-dot"></span>
    <span id="status-live-label">SITE</span>
  </span>
</div>
<button id="theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="false">theme: dark</button>
<div class="grain-overlay" aria-hidden="true"></div>
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
<clanka-cmdk></clanka-cmdk>
<main id="main-content" class="content-page" tabindex="-1">
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
<button type="button" class="cmdk-hint" onclick="document.querySelector('clanka-cmdk')?.openPalette?.()" aria-label="Open command palette">
  <kbd class="cmdk-hint-keys">⌘K</kbd> navigate
</button>
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

function formatDispatchCount(count) {
  const safe = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  return `${safe} ${safe === 1 ? 'dispatch' : 'dispatches'}`;
}

function formatDurationMinutes(minutes, audio = false) {
  if (typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0) {
    return `${Math.ceil(minutes)} min ${audio ? 'listen' : 'read'}`;
  }
  return audio ? 'quick listen' : 'quick read';
}

function buildArchiveCardHtml(post, { featured = false } = {}) {
  const number =
    typeof post.number === 'number' && Number.isFinite(post.number) && post.number >= 0
      ? String(Math.floor(post.number)).padStart(3, '0')
      : '—';
  const topics = Array.isArray(post.topics) ? post.topics.filter(Boolean) : [];
  const topicChips = topics
    .map(
      (topic) =>
        `      <a class="topic-chip" href="/topics/${escapeHtml(topic.slug)}/">${escapeHtml(topic.name)}</a>`,
    )
    .join('\n');
  const featuredClass = featured ? ' archive-card--featured' : '';

  return `    <article class="archive-card${featuredClass}">
      <div class="archive-card-kicker">dispatch ${escapeHtml(number)} · ${escapeHtml(post.date)}</div>
      <h2 class="archive-card-title"><a href="${escapeHtml(post.canonicalPath)}">${escapeHtml(post.title)}</a></h2>
      <p class="archive-card-summary">${escapeHtml(post.summary)}</p>
      <div class="archive-card-meta">
        <span class="archive-meta-badge">${escapeHtml(formatDurationMinutes(post.estimatedReadMinutes, Boolean(post.audio)))}</span>
        <span class="archive-meta-badge">${post.audio ? 'listen available' : 'read only'}</span>
      </div>
      <div class="topic-chip-row">
${topicChips}
      </div>
    </article>`;
}

function buildTopicPostsHtml(topic) {
  const posts = Array.isArray(topic.posts) ? topic.posts : [];
  if (posts.length === 0) {
    return `    <p class="archive-empty" role="status">no dispatches for this topic</p>`;
  }

  return posts.map((post, index) => buildArchiveCardHtml(post, { featured: index === 0 })).join('\n');
}

function buildTopicPage(topic) {
  const countLabel = formatDispatchCount(topic.count);
  const latestLabel = topic.latestDate ? `last dispatch · ${topic.latestDate}` : 'last dispatch · n/a';

  return buildPageShell({
    title: `CLANKA // ${topic.name}`,
    description: topic.description,
    scriptPath: '/src/topic-page.ts',
    pageLabel: 'topics',
    heading: topic.name,
    kicker: `// ${topic.slug}`,
    bodyAttrs: `data-topic-slug="${escapeHtml(topic.slug)}"`,
    bodyContent: `  <section class="section-reveal" aria-labelledby="topic-summary-label">
    <div class="sec-header">
      <span id="topic-summary-label" class="sec-label">topic brief</span>
      <div class="sec-line"></div>
    </div>
    <div class="topic-summary-card">
      <p id="topic-description" class="topic-page-description">${escapeHtml(topic.description)}</p>
      <div class="topic-stats">
        <span id="topic-count">${escapeHtml(countLabel)}</span>
        <span class="stats-sep">·</span>
        <span id="topic-latest">${escapeHtml(latestLabel)}</span>
      </div>
    </div>
  </section>
  <section class="section-reveal" aria-labelledby="topic-posts-label">
    <div class="sec-header">
      <span id="topic-posts-label" class="sec-label">dispatches</span>
      <div class="sec-line"></div>
    </div>
    <div id="topic-posts" class="archive-results">
${buildTopicPostsHtml(topic)}
    </div>
  </section>`,
  });
}

async function writeOutputs(contentIndex) {
  await ensureDir(GENERATED_JSON_PATH);
  await fs.writeFile(GENERATED_JSON_PATH, `${JSON.stringify(contentIndex, null, 2)}\n`);

  await fs.writeFile(FEED_PATH, await buildFeed(contentIndex));

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
    const topicPath = path.join(TOPICS_DIR, topic.slug, 'index.html');
    await fs.access(topicPath);
    const html = await fs.readFile(topicPath, 'utf8');
    if (!html.includes(`id="topic-description"`) || !html.includes(topic.description)) {
      throw new Error(`Topic page missing static description for ${topic.slug}`);
    }
    if (!html.includes(`>${formatDispatchCount(topic.count)}<`)) {
      throw new Error(`Topic page missing static count for ${topic.slug}`);
    }
    for (const post of topic.posts) {
      if (!html.includes(`href="${post.canonicalPath}"`)) {
        throw new Error(`Topic page ${topic.slug} missing static card for ${post.slug}`);
      }
    }
  }
  await fs.access(FEED_PATH);

  const feedXml = await fs.readFile(FEED_PATH, 'utf8');
  if (!feedXml.includes('<lastBuildDate>')) {
    throw new Error('feed.xml missing <lastBuildDate>');
  }

  for (const post of contentIndex.posts) {
    const permalink = `https://clankamode.github.io${post.canonicalPath}`;
    if (!feedXml.includes(`<guid isPermaLink="true">${permalink}</guid>`)) {
      throw new Error(`feed.xml missing permalink guid for ${post.slug}`);
    }
    if (!feedXml.includes(`<pubDate>${formatPubDate(post.date)}</pubDate>`)) {
      throw new Error(`feed.xml pubDate mismatch for ${post.slug}`);
    }
    for (const topic of post.topics) {
      if (!feedXml.includes(`<category>${escapeXml(topic.name)}</category>`)) {
        throw new Error(`feed.xml missing category "${topic.name}" for ${post.slug}`);
      }
    }
    if (post.audio) {
      const enclosureUrl = `https://clankamode.github.io/audio/${post.slug}.mp3`;
      if (!feedXml.includes(`url="${enclosureUrl}"`) || !feedXml.includes('type="audio/mpeg"')) {
        throw new Error(`feed.xml missing audio enclosure for ${post.slug}`);
      }
    } else if (feedXml.includes(`/audio/${post.slug}.mp3`)) {
      throw new Error(`feed.xml has unexpected audio enclosure for non-audio post ${post.slug}`);
    }
  }
}

async function main() {
  const module = await loadPostsModule();
  const posts = [...module.POSTS];
  const topics = [...module.TOPICS];

  await validateInputs(posts, topics);
  await validatePostEnhanceScripts();
  await syncPostSummariesIntoHtml(posts);
  await validatePostSummariesInHtml(posts);

  const contentIndex = deriveContentIndex(posts, topics);

  await syncStaticPostNavigation(contentIndex);
  await validateStaticPostNavigation(contentIndex);
  await syncStaticTopicChips(contentIndex);
  await validateStaticTopicChips(contentIndex);

  await writeOutputs(contentIndex);
  await validateOutputs(contentIndex);

  process.stdout.write(`generated content index for ${contentIndex.posts.length} posts and ${contentIndex.topics.length} topics\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
