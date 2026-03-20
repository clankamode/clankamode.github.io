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

test('generated content index stays aligned with canonical source content', async () => {
  const [{ POSTS, TOPICS }, generatedRaw, feedXml, logsPage] = await Promise.all([
    loadSourceContent(),
    fs.readFile(path.join(ROOT, 'public/content-index.json'), 'utf8'),
    fs.readFile(path.join(ROOT, 'feed.xml'), 'utf8'),
    fs.readFile(path.join(ROOT, 'logs/index.html'), 'utf8'),
  ]);

  const generated = JSON.parse(generatedRaw);

  assert.equal(generated.posts.length, POSTS.length);
  assert.equal(generated.topics.length, TOPICS.length);
  assert.match(logsPage, /archive-search-input/);

  const slugSet = new Set();
  const numberSet = new Set();

  for (const post of POSTS) {
    assert.ok(post.summary.length > 0, `missing summary for ${post.slug}`);
    assert.ok(post.topics.length > 0, `missing topics for ${post.slug}`);
    assert.ok(!slugSet.has(post.slug), `duplicate slug ${post.slug}`);
    assert.ok(!numberSet.has(post.number), `duplicate number ${post.number}`);
    slugSet.add(post.slug);
    numberSet.add(post.number);

    const postFile = path.join(ROOT, post.canonicalPath.replace(/^\//, ''));
    await fs.access(postFile);

    if (post.audio) {
      await fs.access(path.join(ROOT, 'audio', `${post.slug}.mp3`));
    }

    assert.match(feedXml, new RegExp(post.canonicalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
  const { getTaskDisplay, normalizeTaskStatus, TASK_SKELETON_CARD_COUNT } = await loadTsModule('src/task-utils.ts');

  assert.equal(TASK_SKELETON_CARD_COUNT, 3);
  assert.equal(normalizeTaskStatus(undefined), 'todo');
  assert.equal(normalizeTaskStatus(' Doing '), 'doing');
  assert.equal(normalizeTaskStatus('blocked'), 'todo');

  assert.deepEqual(
    getTaskDisplay({
      status: 'Done',
      priority: 0,
    }),
    {
      statusClass: 'done',
      statusLabel: 'Done',
      title: 'untitled',
      assignee: 'unassigned',
      priority: '0',
    },
  );
});
