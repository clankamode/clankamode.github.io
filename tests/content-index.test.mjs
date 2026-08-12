import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import ts from 'typescript';

const ROOT = process.cwd();

async function loadTsModule(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const source = await fs.readFile(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: path.basename(relativePath),
  });

  const encoded = Buffer.from(transpiled.outputText).toString('base64');
  return import(`data:text/javascript;base64,${encoded}#${relativePath}-${Date.now()}`);
}

async function loadSourceContent() {
  return loadTsModule('src/content/posts.ts');
}

async function audioFileExists(slug) {
  try {
    await fs.access(path.join(ROOT, 'audio', `${slug}.mp3`));
    return true;
  } catch {
    return false;
  }
}

test('generated content index stays aligned with canonical source content', async () => {
  const [{ POSTS, TOPICS }, generatedRaw, feedXml, logsPage, topicPage, generatorSource] = await Promise.all([
    loadSourceContent(),
    fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
    fs.readFile(path.join(ROOT, 'feed.xml'), 'utf8'),
    fs.readFile(path.join(ROOT, 'logs/index.html'), 'utf8'),
    fs.readFile(path.join(ROOT, 'topics', 'systems', 'index.html'), 'utf8'),
    fs.readFile(path.join(ROOT, 'scripts/generate-site-content.mjs'), 'utf8'),
  ]);

  const generated = JSON.parse(generatedRaw);
  const generatedBySlug = new Map(generated.posts.map((post) => [post.slug, post]));

  assert.equal(generated.posts.length, POSTS.length);
  assert.equal(generated.topics.length, TOPICS.length);
  assert.match(logsPage, /archive-search-input/);
  assert.match(logsPage, /class="skip-link" href="#main-content"/);
  assert.match(logsPage, /<main id="main-content"/);
  assert.match(logsPage, /<button type="button" class="cmdk-hint"/);
  assert.match(topicPage, /class="skip-link" href="#main-content"/);
  assert.match(topicPage, /<main id="main-content"/);
  assert.match(topicPage, /<button type="button" class="cmdk-hint"/);
  assert.match(generatorSource, /post-enhance\.js/);

  const slugSet = new Set();
  const numberSet = new Set();
  const featuredPosts = POSTS.filter((post) => post.featured);
  const expectedFeaturedSlug = featuredPosts.length > 0
    ? [...featuredPosts].sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number)[0].slug
    : [...POSTS].sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number)[0].slug;

  assert.equal(generated.homepage.featured?.slug, expectedFeaturedSlug);

  for (const post of POSTS) {
    assert.ok(post.summary.length > 0, `missing summary for ${post.slug}`);
    assert.ok(post.topics.length > 0, `missing topics for ${post.slug}`);
    assert.ok(!slugSet.has(post.slug), `duplicate slug ${post.slug}`);
    assert.ok(!numberSet.has(post.number), `duplicate number ${post.number}`);
    slugSet.add(post.slug);
    numberSet.add(post.number);

    const expectedCanonicalPath = `/posts/${post.slug}.html`;
    assert.equal(post.canonicalPath, expectedCanonicalPath, `canonicalPath mismatch for ${post.slug}`);

    const postFile = path.join(ROOT, post.canonicalPath.replace(/^\//, ''));
    await fs.access(postFile);

    const hasAudio = await audioFileExists(post.slug);
    assert.equal(post.audio, hasAudio, `audio flag mismatch for ${post.slug}`);

    const indexedPost = generatedBySlug.get(post.slug);
    assert.ok(indexedPost, `missing generated post for ${post.slug}`);
    assert.equal(indexedPost.canonicalPath, expectedCanonicalPath);
    assert.equal(indexedPost.audio, hasAudio);
    assert.equal(indexedPost.title, post.title);
    assert.equal(indexedPost.number, post.number);
    assert.equal(indexedPost.date, post.date);
    assert.ok(
      indexedPost.topics.every((topic) => typeof topic.slug === 'string' && typeof topic.name === 'string'),
      `invalid topic refs on ${post.slug}`,
    );

    assert.match(feedXml, new RegExp(post.canonicalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const padded = String(post.number).padStart(3, '0');
    assert.match(
      feedXml,
      new RegExp(`<title>${padded}: ${post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`),
      `feed title mismatch for ${post.slug}`,
    );

    // HTML dispatch number/title must match the registry (catches renumber drift).
    const postHtml = await fs.readFile(postFile, 'utf8');
    const escapedTitle = post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(
      postHtml,
      new RegExp(`<title>${padded}: ${escapedTitle} // CLANKA</title>`),
      `HTML title number mismatch for ${post.slug}`,
    );
    const postNumber = postHtml.match(/class="post-number">([^<]+)</)?.[1]?.trim() ?? '';
    assert.ok(
      postNumber === padded || postNumber === `dispatch ${padded}`,
      `HTML post-number mismatch for ${post.slug}: got "${postNumber}"`,
    );
    assert.match(
      postHtml,
      new RegExp(`<h1>${escapedTitle}</h1>`),
      `HTML h1 mismatch for ${post.slug}`,
    );
  }

  for (const topic of TOPICS) {
    const topicPagePath = path.join(ROOT, 'topics', topic.slug, 'index.html');
    await fs.access(topicPagePath);
  }
});

test('loadContentIndex retries after a rejected fetch', async () => {
  const { loadContentIndex } = await loadTsModule('src/content-index.ts');
  const originalFetch = globalThis.fetch;
  const contentIndex = {
    generatedAt: '2026-03-18T00:00:00.000Z',
    homepage: {
      featured: null,
      recent: [],
      topics: [],
      counts: {
        posts: 0,
        audioPosts: 0,
        topics: 0,
      },
      years: [],
    },
    posts: [],
    topics: [],
  };

  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;

    if (attempts === 1) {
      throw new TypeError('Failed to fetch');
    }

    return {
      ok: true,
      async json() {
        return contentIndex;
      },
    };
  };

  try {
    await assert.rejects(loadContentIndex(), /Failed to fetch/);

    const result = await loadContentIndex();
    assert.deepEqual(result, contentIndex);
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('task display helpers normalize status and preserve labels', async () => {
  const {
    getTaskDisplay,
    normalizeTaskStatus,
    normalizeTasks,
    TASK_SKELETON_CARD_COUNT,
  } = await loadTsModule('src/task-utils.ts');

  assert.equal(TASK_SKELETON_CARD_COUNT, 3);
  assert.equal(normalizeTaskStatus(undefined), 'todo');
  assert.equal(normalizeTaskStatus(' Doing '), 'doing');
  assert.equal(normalizeTaskStatus('in-progress'), 'doing');
  assert.equal(normalizeTaskStatus('WIP'), 'doing');
  assert.equal(normalizeTaskStatus('completed'), 'done');
  assert.equal(normalizeTaskStatus('blocked'), 'blocked');

  assert.deepEqual(
    getTaskDisplay({
      status: 'Done',
      priority: 0,
    }),
    {
      statusClass: 'done',
      statusLabel: 'DONE',
      title: 'untitled',
      assignee: 'unassigned',
      priority: 'P0',
    },
  );

  assert.deepEqual(
    getTaskDisplay({
      status: 'blocked',
      title: 'Wait on review',
      priority: 'P1',
    }),
    {
      statusClass: 'blocked',
      statusLabel: 'BLOCKED',
      title: 'Wait on review',
      assignee: 'unassigned',
      priority: 'P1',
    },
  );

  assert.deepEqual(
    getTaskDisplay({
      status: 'in_progress',
      title: 'Ship it',
      priority: 'high',
    }),
    {
      statusClass: 'doing',
      statusLabel: 'DOING',
      title: 'Ship it',
      assignee: 'unassigned',
      priority: 'high',
    },
  );

  // Empty strings should use fallbacks (?? alone keeps '').
  assert.deepEqual(
    getTaskDisplay({
      status: '',
      title: '   ',
      assignee: '',
      priority: '',
    }),
    {
      statusClass: 'todo',
      statusLabel: 'TODO',
      title: 'untitled',
      assignee: 'unassigned',
      priority: '?',
    },
  );

  // Non-scalar fields must not stringify to "[object Object]".
  assert.deepEqual(
    getTaskDisplay({
      title: { text: 'nope' },
      assignee: ['a'],
      priority: { level: 1 },
    }),
    {
      statusClass: 'todo',
      statusLabel: 'TODO',
      title: 'untitled',
      assignee: 'unassigned',
      priority: '?',
    },
  );

  assert.deepEqual(
    normalizeTasks([
      null,
      'bad',
      { title: 'Keep me', status: 'in_progress' },
      [{ title: 'nested' }],
    ]),
    [{ title: 'Keep me', status: 'in_progress' }],
  );

  const a = getTaskDisplay(null);
  a.title = 'mutated';
  assert.equal(getTaskDisplay(null).title, 'untitled');
});

test('parseGithubEvents accepts wrapped and bare array payloads', async () => {
  const {
    parseGithubEvents,
    isGithubEventsPayload,
    isFleetSummaryPayload,
    isGithubStatsPayload,
  } = await loadTsModule('src/clanka-api.ts');
  const sample = {
    type: 'PushEvent',
    repo: 'clankamode/site',
    message: 'feat: test',
    timestamp: '2026-03-03T03:40:00.000Z',
  };

  assert.deepEqual(parseGithubEvents({ events: [sample] }), [sample]);
  assert.deepEqual(parseGithubEvents([sample]), [sample]);
  assert.deepEqual(parseGithubEvents({ events: 'invalid' }), []);
  assert.deepEqual(parseGithubEvents(null), []);
  assert.deepEqual(parseGithubEvents({ events: [sample, sample, { type: 1 }] }), [sample]);
  assert.deepEqual(parseGithubEvents([{ type: '', repo: 'x', message: 'm', timestamp: 't' }]), []);
  assert.deepEqual(parseGithubEvents([{ type: 'PushEvent', repo: 'x', message: 'm', timestamp: 'not-a-date' }]), []);

  assert.equal(isGithubEventsPayload({ events: [] }), true);
  assert.equal(isGithubEventsPayload([sample]), true);
  assert.equal(isGithubEventsPayload({ error: 'token expired' }), false);
  assert.equal(isGithubEventsPayload({ events: 'invalid' }), false);
  assert.equal(isGithubEventsPayload(null), false);

  assert.equal(isFleetSummaryPayload({ repos: [], totalRepos: 0 }), true);
  assert.equal(isFleetSummaryPayload({ fleet: [] }), true);
  assert.equal(isFleetSummaryPayload({ summary: { repos: [] } }), true);
  assert.equal(isFleetSummaryPayload({ message: 'no registry' }), false);
  assert.equal(isFleetSummaryPayload(null), false);

  assert.equal(isGithubStatsPayload({ repoCount: 0, totalStars: 0 }), true);
  assert.equal(isGithubStatsPayload({ lastPushedAt: '2026-08-02T02:03:12Z', lastPushedRepo: 'site' }), true);
  assert.equal(isGithubStatsPayload({ error: 'token expired' }), false);
  assert.equal(isGithubStatsPayload({ repoCount: null }), false);
  assert.equal(isGithubStatsPayload({}), false);
  assert.equal(isGithubStatsPayload(null), false);
});

test('parseNowPayload rejects invalid shapes and preserves optional fields', async () => {
  const { parseNowPayload } = await loadTsModule('src/clanka-api.ts');

  assert.equal(parseNowPayload(null), null);
  assert.equal(parseNowPayload({}), null);
  assert.equal(parseNowPayload({ current: 1 }), null);
  assert.equal(parseNowPayload({ current: '' }), null);
  assert.equal(parseNowPayload({ current: '   ', status: '  ' }), null);
  assert.equal(parseNowPayload({ tasks: 'nope' }), null);
  assert.equal(parseNowPayload({ team: [] }), null);

  // Whitespace-only fields are stripped; sibling signal still counts.
  assert.deepEqual(parseNowPayload({ current: '  building  ', status: '  ' }), {
    current: 'building',
  });
  assert.deepEqual(parseNowPayload({ current: '', status: 'active' }), {
    status: 'active',
  });

  // Malformed optional fields are stripped; good fields still apply.
  assert.deepEqual(
    parseNowPayload({
      current: 'building',
      status: 'active',
      agents_active: '7',
      history: 'bad',
      team: 'nope',
    }),
    {
      current: 'building',
      status: 'active',
      agents_active: 7,
    },
  );

  assert.deepEqual(parseNowPayload({ current: 'building', status: 'active' }), {
    current: 'building',
    status: 'active',
  });

  assert.deepEqual(
    parseNowPayload({
      current: 'building',
      status: 'active',
      tasks: [{ id: '1' }],
      team: { alpha: { status: 'active' } },
      agents_active: 2,
      history: [],
    }),
    {
      current: 'building',
      status: 'active',
      tasks: [{ id: '1' }],
      team: { alpha: { status: 'active' } },
      agents_active: 2,
      history: [],
    },
  );
});

test('event display helpers normalize types and blank messages', async () => {
  const { normalizeEventType, displayEventMessage } = await loadTsModule('src/event-display.ts');

  assert.equal(normalizeEventType('PUSH'), 'push');
  assert.equal(normalizeEventType('PushEvent'), 'push');
  assert.equal(normalizeEventType('PR'), 'pr');
  assert.equal(normalizeEventType('CREATE'), 'create');
  assert.equal(normalizeEventType(''), 'push');
  assert.equal(displayEventMessage('  feat: x  '), 'feat: x');
  assert.equal(displayEventMessage('   '), '—');
  assert.equal(displayEventMessage(''), '—');
});

test('withRetries eventually succeeds and withResultRetries stops on ok', async () => {
  const { withRetries, withResultRetries } = await loadTsModule('src/retry.ts');

  let attempts = 0;
  const value = await withRetries(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('fail');
    return 'ok';
  }, 3, 1);
  assert.equal(value, 'ok');
  assert.equal(attempts, 3);

  let resultAttempts = 0;
  const result = await withResultRetries(async () => {
    resultAttempts += 1;
    return resultAttempts === 2 ? { ok: true, n: resultAttempts } : { ok: false, n: resultAttempts };
  }, 3, 1);
  assert.deepEqual(result, { ok: true, n: 2 });
  assert.equal(resultAttempts, 2);
});

test('every post ships static prev/next nav matching content-index chronology', async () => {
  const [{ POSTS }, generatedRaw] = await Promise.all([
    loadSourceContent(),
    fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
  ]);

  const generated = JSON.parse(generatedRaw);
  const bySlug = new Map(generated.posts.map((post) => [post.slug, post]));

  assert.equal(generated.posts.length, POSTS.length);

  for (const post of POSTS) {
    const indexed = bySlug.get(post.slug);
    assert.ok(indexed, `missing generated post for ${post.slug}`);

    const postHtml = await fs.readFile(path.join(ROOT, 'posts', `${post.slug}.html`), 'utf8');
    const navMatch = postHtml.match(/<div class="post-nav\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(navMatch, `missing static .post-nav for ${post.slug}`);
    const nav = navMatch[1];

    if (indexed.previous) {
      assert.ok(nav.includes(`href="${indexed.previous.canonicalPath}"`), `static prev href for ${post.slug}`);
      assert.ok(nav.includes('data-nav="prev"'), `static prev data-nav for ${post.slug}`);
    } else {
      assert.equal(nav.includes('data-nav="prev"'), false, `unexpected static prev on ${post.slug}`);
    }

    if (indexed.next) {
      assert.ok(nav.includes(`href="${indexed.next.canonicalPath}"`), `static next href for ${post.slug}`);
      assert.ok(nav.includes('data-nav="next"'), `static next data-nav for ${post.slug}`);
    } else {
      assert.equal(nav.includes('data-nav="next"'), false, `unexpected static next on ${post.slug}`);
    }
  }
});

test('every post with topics ships static topic chips', async () => {
  const generated = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
  );

  for (const post of generated.posts) {
    const postHtml = await fs.readFile(path.join(ROOT, 'posts', `${post.slug}.html`), 'utf8');
    const topics = Array.isArray(post.topics) ? post.topics.filter(Boolean) : [];
    const chipsMatch = postHtml.match(
      /<div class="post-topic-chips\b[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );

    if (topics.length === 0) {
      assert.equal(chipsMatch, null, `unexpected topic chips on ${post.slug}`);
      continue;
    }

    assert.ok(chipsMatch, `missing topic chips on ${post.slug}`);
    for (const topic of topics) {
      assert.ok(
        chipsMatch[1].includes(`href="/topics/${topic.slug}/"`),
        `topic chip href missing for ${topic.slug} on ${post.slug}`,
      );
      assert.ok(
        chipsMatch[1].includes(topic.name),
        `topic chip label missing for ${topic.slug} on ${post.slug}`,
      );
    }
  }
});

test('post HTML meta and og descriptions stay aligned with posts.ts summaries', async () => {
  const { POSTS } = await loadSourceContent();

  const decode = (value) =>
    value
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&#x27;', "'")
      .replaceAll('&apos;', "'")
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&');

  for (const post of POSTS) {
    const postHtml = await fs.readFile(path.join(ROOT, 'posts', `${post.slug}.html`), 'utf8');
    const description = postHtml.match(
      /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=(["'])([\s\S]*?)\1/i,
    )?.[2];
    const ogDescription = postHtml.match(
      /<meta\b[^>]*\bproperty=["']og:description["'][^>]*\bcontent=(["'])([\s\S]*?)\1/i,
    )?.[2];

    assert.ok(description, `missing meta description for ${post.slug}`);
    assert.ok(ogDescription, `missing og:description for ${post.slug}`);
    assert.equal(decode(description), post.summary, `meta description drift for ${post.slug}`);
    assert.equal(decode(ogDescription), post.summary, `og:description drift for ${post.slug}`);
  }
});

test('RSS feed includes build date, permalink guids, categories, and audio enclosures', async () => {
  const [{ POSTS }, feedXml, generatedRaw] = await Promise.all([
    loadSourceContent(),
    fs.readFile(path.join(ROOT, 'feed.xml'), 'utf8'),
    fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
  ]);

  const generated = JSON.parse(generatedRaw);
  const generatedBySlug = new Map(generated.posts.map((post) => [post.slug, post]));

  assert.match(feedXml, /<lastBuildDate>[^<]+<\/lastBuildDate>/);

  const items = [...feedXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[0]);
  assert.equal(items.length, POSTS.length);

  for (const post of POSTS) {
    const permalink = `https://clankamode.github.io${post.canonicalPath}`;
    const item = items.find((entry) => entry.includes(`<link>${permalink}</link>`));
    assert.ok(item, `missing feed item for ${post.slug}`);

    assert.ok(
      item.includes(`<guid isPermaLink="true">${permalink}</guid>`),
      `missing permalink guid for ${post.slug}`,
    );
    assert.ok(
      item.includes(`<pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`),
      `pubDate mismatch for ${post.slug}`,
    );

    const indexed = generatedBySlug.get(post.slug);
    assert.ok(indexed, `missing generated post for ${post.slug}`);
    for (const topic of indexed.topics) {
      assert.ok(
        item.includes(`<category>${topic.name}</category>`),
        `missing category ${topic.name} for ${post.slug}`,
      );
    }

    if (post.audio) {
      const audioPath = path.join(ROOT, 'audio', `${post.slug}.mp3`);
      const size = (await fs.stat(audioPath)).size;
      assert.ok(
        item.includes(
          `<enclosure url="https://clankamode.github.io/audio/${post.slug}.mp3" length="${size}" type="audio/mpeg" />`,
        ),
        `missing audio enclosure for ${post.slug}`,
      );
    } else {
      assert.equal(item.includes('<enclosure'), false, `unexpected enclosure for ${post.slug}`);
    }
  }
});

test('every post with related dispatches ships a static related-posts section', async () => {
  const generated = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
  );

  for (const post of generated.posts) {
    const postHtml = await fs.readFile(path.join(ROOT, 'posts', `${post.slug}.html`), 'utf8');
    const related = Array.isArray(post.related) ? post.related : [];
    const sectionMatch = postHtml.match(
      /<section class="related-posts\b[^"]*"[^>]*>([\s\S]*?)<\/section>/,
    );

    if (related.length === 0) {
      assert.equal(sectionMatch, null, `unexpected related-posts on ${post.slug}`);
      continue;
    }

    assert.ok(sectionMatch, `missing related-posts on ${post.slug}`);
    for (const entry of related) {
      assert.ok(
        sectionMatch[1].includes(`href="${entry.canonicalPath}"`),
        `related link missing for ${entry.slug} on ${post.slug}`,
      );
    }
  }
});

test('post dates are valid YYYY-MM-DD and generator validates dates and audio timings', async () => {
  const [{ POSTS }, generatorSource] = await Promise.all([
    loadSourceContent(),
    fs.readFile(path.join(ROOT, 'scripts/generate-site-content.mjs'), 'utf8'),
  ]);

  assert.match(generatorSource, /isValidPostDate/);
  assert.match(generatorSource, /parseAudioTimingsJson/);

  for (const post of POSTS) {
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/, `date shape for ${post.slug}`);
    const parsed = Date.parse(`${post.date}T00:00:00Z`);
    assert.ok(Number.isFinite(parsed), `date parse for ${post.slug}`);
    const utc = new Date(parsed);
    const yyyy = String(utc.getUTCFullYear()).padStart(4, '0');
    const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utc.getUTCDate()).padStart(2, '0');
    assert.equal(`${yyyy}-${mm}-${dd}`, post.date, `date round-trip for ${post.slug}`);
  }
});

test('loadContentIndex rejects malformed topic entries', async () => {
  const { loadContentIndex } = await loadTsModule('src/content-index.ts');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        generatedAt: '2026-03-18T00:00:00.000Z',
        homepage: {
          featured: null,
          recent: [],
          topics: [{ slug: 'ops' }],
          counts: { posts: 0, audioPosts: 0, topics: 1 },
          years: [],
        },
        posts: [],
        topics: [{ slug: 'ops' }],
      };
    },
  });

  try {
    await assert.rejects(loadContentIndex(), /invalid content index payload/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchGithubEvents treats all-invalid items as offline and dedupes', async () => {
  const { fetchGithubEvents, parseGithubEvents } = await loadTsModule('src/clanka-api.ts');
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  const sample = {
    type: 'PushEvent',
    repo: 'clankamode/site',
    message: 'feat: test',
    timestamp: '2026-03-03T03:40:00.000Z',
  };

  globalThis.fetch = async () => {
    attempts += 1;
    // Exhaust the shared retry budget (3) on unusable items, then recover.
    if (attempts <= 3) {
      return {
        ok: true,
        async json() {
          return { events: [{ type: '', repo: 'x', message: 'm', timestamp: 't' }, { bad: true }] };
        },
      };
    }
    return {
      ok: true,
      async json() {
        return { events: [sample, sample] };
      },
    };
  };

  try {
    const offline = await fetchGithubEvents();
    assert.deepEqual(offline, { ok: false, reason: 'offline' });

    const recovered = await fetchGithubEvents();
    assert.equal(recovered.ok, true);
    if (recovered.ok) {
      assert.deepEqual(recovered.events, [sample]);
    }
    assert.equal(attempts, 4);
    assert.deepEqual(parseGithubEvents({ events: [sample, { ...sample }, sample] }), [sample]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchGithubEvents coalesces concurrent callers through one retry chain', async () => {
  const { fetchGithubEvents } = await loadTsModule('src/clanka-api.ts');
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    return {
      ok: false,
      status: 503,
      async json() {
        return { error: 'unavailable' };
      },
    };
  };

  try {
    const first = fetchGithubEvents();
    const second = fetchGithubEvents();
    const third = fetchGithubEvents();
    const results = await Promise.all([first, second, third]);

    for (const result of results) {
      assert.deepEqual(result, { ok: false, reason: 'offline' });
    }
    // Default withResultRetries budget is 3 — shared, not 3× callers.
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchNow invalidates cache after rejecting a malformed payload', async () => {
  const { fetchNow } = await loadTsModule('src/clanka-api.ts');
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        ok: true,
        async json() {
          return {};
        },
      };
    }
    return {
      ok: true,
      async json() {
        return { current: 'recovered', status: 'active' };
      },
    };
  };

  try {
    await assert.rejects(fetchNow(), /Invalid \/now payload/);
    const recovered = await fetchNow();
    assert.deepEqual(recovered, { current: 'recovered', status: 'active' });
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchGithubStats invalidates cache after rejecting a malformed payload', async () => {
  const { fetchGithubStats } = await loadTsModule('src/clanka-api.ts');
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        ok: true,
        async json() {
          return { error: 'token expired' };
        },
      };
    }
    return {
      ok: true,
      async json() {
        return { repoCount: 8, totalStars: 0 };
      },
    };
  };

  try {
    await assert.rejects(fetchGithubStats(), /Invalid \/github\/stats payload/);
    const recovered = await fetchGithubStats();
    assert.deepEqual(recovered, { repoCount: 8, totalStars: 0 });
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
