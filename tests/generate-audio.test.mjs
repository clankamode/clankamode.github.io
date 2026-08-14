import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'generate-audio.sh');
const extractTextPath = path.join(repoRoot, 'scripts', 'extract-text.py');

function writeExecutable(filePath, contents) {
  fs.writeFileSync(filePath, contents, { mode: 0o755 });
}

function makeWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-audio-'));
  const binDir = path.join(root, 'bin');
  const scriptsDir = path.join(root, 'scripts');
  const postsDir = path.join(root, 'posts');
  const audioDir = path.join(root, 'audio');
  fs.mkdirSync(binDir);
  fs.mkdirSync(scriptsDir);
  fs.mkdirSync(postsDir);
  fs.mkdirSync(audioDir);

  fs.copyFileSync(scriptPath, path.join(scriptsDir, 'generate-audio.sh'));
  fs.copyFileSync(extractTextPath, path.join(scriptsDir, 'extract-text.py'));
  fs.chmodSync(path.join(scriptsDir, 'generate-audio.sh'), 0o755);

  const postPath = path.join(postsDir, '2026-01-01-honesty.html');
  fs.writeFileSync(
    postPath,
    `<!DOCTYPE html><html><body><article><p>${'honesty audio payload check. '.repeat(20)}</p></article></body></html>\n`,
  );

  return { root, binDir, scriptsDir, postsDir, audioDir, postPath };
}

function writeCurlStub(binDir, { httpCode, body }) {
  // Minimal curl stub that honors -o / -w %{http_code} used by generate-audio.sh.
  writeExecutable(
    path.join(binDir, 'curl'),
    `#!/usr/bin/env bash
set -euo pipefail
# Drain request body from generate-audio's \`curl ... -d @-\` pipe.
cat >/dev/null
out=""
write_fmt=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o)
      out="$2"
      shift 2
      ;;
    -w)
      write_fmt="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
if [ -n "$out" ]; then
  printf '%s' ${JSON.stringify(body)} > "$out"
fi
if [ "$write_fmt" = "%{http_code}" ]; then
  printf '%s' ${JSON.stringify(String(httpCode))}
fi
`,
  );
}

function runGenerateAudio({ root, binDir, postPath, env = {} }) {
  return spawnSync('bash', [path.join(root, 'scripts', 'generate-audio.sh'), postPath], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
      OPENAI_API_KEY: 'test-key',
      ...env,
    },
    encoding: 'utf8',
  });
}

test('generate-audio fails instead of Done when OpenAI returns HTTP error JSON', () => {
  const workspace = makeWorkspace();
  writeCurlStub(workspace.binDir, {
    httpCode: 401,
    body: '{"error":{"message":"invalid api key"}}',
  });

  const result = runGenerateAudio(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /OpenAI TTS failed.*HTTP 401/);
  assert.doesNotMatch(result.stdout, /\bDone:/);
  assert.equal(fs.existsSync(path.join(workspace.audioDir, '2026-01-01-honesty.mp3')), false);
});

test('generate-audio fails instead of Done when HTTP 200 body is JSON', () => {
  const workspace = makeWorkspace();
  writeCurlStub(workspace.binDir, {
    httpCode: 200,
    body: '{"error":"not audio"}',
  });

  const result = runGenerateAudio(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /non-audio payload/);
  assert.doesNotMatch(result.stdout, /\bDone:/);
  assert.equal(fs.existsSync(path.join(workspace.audioDir, '2026-01-01-honesty.mp3')), false);
});

test('generate-audio does not SKIP corrupt leftover JSON mp3 files', () => {
  const workspace = makeWorkspace();
  const corrupt = path.join(workspace.audioDir, '2026-01-01-honesty.mp3');
  fs.writeFileSync(corrupt, '{"error":"stale failure body"}');

  writeCurlStub(workspace.binDir, {
    httpCode: 500,
    body: '{"error":"still failing"}',
  });

  const result = runGenerateAudio(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /removing corrupt existing audio/);
  assert.doesNotMatch(result.stdout, /^SKIP:/m);
  assert.equal(fs.existsSync(corrupt), false);
});

test('generate-audio SKIP still works for a real mp3 payload', () => {
  const workspace = makeWorkspace();
  const existing = path.join(workspace.audioDir, '2026-01-01-honesty.mp3');
  // ID3v2 header is enough for the audio-payload probe.
  fs.writeFileSync(existing, Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

  writeCurlStub(workspace.binDir, {
    httpCode: 500,
    body: '{"error":"should not be called"}',
  });

  const result = runGenerateAudio(workspace);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^SKIP: 2026-01-01-honesty \(already exists\)$/m);
});
