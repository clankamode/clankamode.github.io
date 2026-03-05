import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseMarkdownFile, runDoctorChecks } from './jp';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }),
  );
});

describe('runDoctorChecks', () => {
  it('returns all passing checks for a healthy local setup', async () => {
    const tempDir = await makeTempDir('jp-doctor-pass-');
    const envPath = path.join(tempDir, '.env.local');
    const anonKey = 'anon-test-key';

    await fs.writeFile(
      envPath,
      [
        'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321',
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
        'NEXTAUTH_SECRET=test-secret',
      ].join('\n'),
      'utf8',
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response('<html></html>', { status: 200 }));

    const checks = await runDoctorChecks({
      baseUrl: 'http://localhost:3000',
      envFilePath: envPath,
      fetchFn: fetchMock as unknown as typeof fetch,
      nodeVersion: '20.11.1',
    });

    expect(checks).toHaveLength(6);
    expect(checks.every((check) => check.ok)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [supabaseUrl, supabaseInit] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(supabaseUrl)).toBe('http://127.0.0.1:54321/rest/v1/');

    const headers = new Headers(supabaseInit?.headers);
    expect(headers.get('apikey')).toBe(anonKey);
    expect(headers.get('authorization')).toBe(`Bearer ${anonKey}`);
  });

  it('returns failed checks when node version is old and dev server is down', async () => {
    const tempDir = await makeTempDir('jp-doctor-fail-');
    const envPath = path.join(tempDir, '.env.local');

    await fs.writeFile(
      envPath,
      [
        'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key',
      ].join('\n'),
      'utf8',
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:3000'));

    const checks = await runDoctorChecks({
      baseUrl: 'http://localhost:3000',
      envFilePath: envPath,
      fetchFn: fetchMock as unknown as typeof fetch,
      nodeVersion: '18.19.0',
    });

    const nodeCheck = checks.find((check) => check.label === 'Node.js version >= 20');
    const nextCheck = checks.find((check) => check.label.startsWith('Next.js dev server is reachable at'));
    const nextAuthEnvCheck = checks.find((check) => check.label === '.env.local has NEXTAUTH_SECRET');

    expect(nodeCheck?.ok).toBe(false);
    expect(nextCheck?.ok).toBe(false);
    expect(nextAuthEnvCheck?.ok).toBe(false);
  });

  it('probes custom NEXT_PUBLIC_SUPABASE_URL instead of hardcoded localhost', async () => {
    const tempDir = await makeTempDir('jp-doctor-custom-sb-');
    const envPath = path.join(tempDir, '.env.local');
    const customUrl = 'https://my-project.supabase.co';
    const anonKey = 'custom-anon-key';

    await fs.writeFile(
      envPath,
      [
        `NEXT_PUBLIC_SUPABASE_URL=${customUrl}`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
        'NEXTAUTH_SECRET=test-secret',
      ].join('\n'),
      'utf8',
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response('<html></html>', { status: 200 }));

    const checks = await runDoctorChecks({
      baseUrl: 'http://localhost:3000',
      envFilePath: envPath,
      fetchFn: fetchMock as unknown as typeof fetch,
      nodeVersion: '22.0.0',
    });

    const [supabaseUrl] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(supabaseUrl)).toBe(`${customUrl}/rest/v1/`);

    const supabaseCheck = checks.find((check) => check.label.startsWith('Supabase'));
    expect(supabaseCheck?.ok).toBe(true);
  });
});

describe('parseMarkdownFile', () => {
  it('parses title, excerpt, body, and slug from markdown file', async () => {
    const tempDir = await makeTempDir('jp-content-');
    const markdownPath = path.join(tempDir, 'arrays.md');
    const markdown = [
      '# Arrays',
      '',
      'Arrays store items in contiguous memory.',
      'They are useful for indexed access.',
      '',
      '## Two Pointer Pattern',
      '',
      'Use two indices moving toward each other.',
    ].join('\n');

    await fs.writeFile(markdownPath, markdown, 'utf8');
    const parsed = await parseMarkdownFile(markdownPath);

    expect(parsed.slug).toBe('arrays');
    expect(parsed.title).toBe('Arrays');
    expect(parsed.excerpt).toBe('Arrays store items in contiguous memory.\nThey are useful for indexed access.');
    expect(parsed.body).toBe(markdown);
  });

  it('throws when markdown file has no H1 heading', async () => {
    const tempDir = await makeTempDir('jp-content-no-h1-');
    const markdownPath = path.join(tempDir, 'no-title.md');
    await fs.writeFile(markdownPath, 'Body text only\n## Section\nDetails', 'utf8');

    await expect(parseMarkdownFile(markdownPath)).rejects.toThrow('must include an H1 title');
  });
});
