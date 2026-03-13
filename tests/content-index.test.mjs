import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import ts from 'typescript';

const ROOT = process.cwd();

async function loadSourceContent() {
  const filePath = path.join(ROOT, 'src/content/posts.ts');
  const source = await fs.readFile(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: 'posts.ts',
  });

  const encoded = Buffer.from(transpiled.outputText).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
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
