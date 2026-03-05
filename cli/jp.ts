#!/usr/bin/env tsx

import { Command } from 'commander';
import { parse as parseDotEnv } from 'dotenv';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

interface SessionFile {
  cookies: Record<string, string>;
  baseUrl?: string;
  updatedAt: string;
}

interface GlobalOptions {
  baseUrl: string;
  json: boolean;
}

export interface DoctorCheckResult {
  label: string;
  ok: boolean;
  details: string;
}

interface DoctorRunOptions {
  baseUrl: string;
  envFilePath?: string;
  fetchFn?: typeof fetch;
  nodeVersion?: string;
  timeoutMs?: number;
}

export interface ParsedMarkdownContent {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';
const SESSION_FILE = path.join(os.homedir(), '.jp-session.json');
const ENV_FILE = path.resolve(process.cwd(), '.env.local');
const SUPABASE_LOCAL_REST_URL = 'http://127.0.0.1:54321/rest/v1/';
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET',
] as const;
const ANSI_GREEN = '\u001B[32m';
const ANSI_RED = '\u001B[31m';
const ANSI_RESET = '\u001B[0m';

function resolveGlobals(command: Command): GlobalOptions {
  let baseUrl = DEFAULT_BASE_URL;
  let json = false;
  let cursor: Command | undefined = command;

  while (cursor) {
    const opts = cursor.opts() as { baseUrl?: unknown; json?: unknown };
    if (typeof opts.baseUrl === 'string' && opts.baseUrl.trim().length > 0) {
      baseUrl = opts.baseUrl.trim();
    }
    if (typeof opts.json !== 'undefined') {
      json = Boolean(opts.json);
    }
    cursor = cursor.parent as unknown as Command | undefined;
  }

  const normalizedBaseUrl = baseUrl.trim().length > 0
    ? baseUrl.replace(/\/$/, '')
    : DEFAULT_BASE_URL;

  return {
    baseUrl: normalizedBaseUrl,
    json,
  };
}

async function loadSession(): Promise<SessionFile> {
  try {
    const raw = await fs.readFile(SESSION_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SessionFile>;

    if (!parsed || typeof parsed !== 'object' || typeof parsed.cookies !== 'object' || !parsed.cookies) {
      return { cookies: {}, updatedAt: new Date(0).toISOString() };
    }

    const cookies: Record<string, string> = {};
    for (const [name, value] of Object.entries(parsed.cookies)) {
      if (typeof name === 'string' && typeof value === 'string') {
        cookies[name] = value;
      }
    }

    return {
      cookies,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return { cookies: {}, updatedAt: new Date(0).toISOString() };
  }
}

async function saveSession(session: SessionFile): Promise<void> {
  await fs.writeFile(SESSION_FILE, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
}

function getCookieHeader(cookies: Record<string, string>): string | undefined {
  const entries = Object.entries(cookies).filter(([, value]) => value.length > 0);
  if (entries.length === 0) {
    return undefined;
  }

  return entries.map(([name, value]) => `${name}=${value}`).join('; ');
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const fallback = response.headers.get('set-cookie');
  return fallback ? [fallback] : [];
}

function applySetCookie(cookies: Record<string, string>, setCookieHeaders: string[]): void {
  for (const cookieLine of setCookieHeaders) {
    const [cookiePart] = cookieLine.split(';');
    if (!cookiePart) continue;

    const eqIndex = cookiePart.indexOf('=');
    if (eqIndex <= 0) continue;

    const name = cookiePart.slice(0, eqIndex).trim();
    const value = cookiePart.slice(eqIndex + 1).trim();
    if (!name) continue;

    if (!value || value.toLowerCase() === 'deleted') {
      delete cookies[name];
      continue;
    }

    cookies[name] = value;
  }
}

async function requestWithSession(
  baseUrl: string,
  pathname: string,
  init: RequestInit = {},
  session?: SessionFile,
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});

  if (session) {
    const cookieHeader = getCookieHeader(session.cookies);
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
  }

  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers,
  });

  if (session) {
    applySetCookie(session.cookies, getSetCookieHeaders(response));
    session.baseUrl = baseUrl;
    session.updatedAt = new Date().toISOString();
  }

  return response;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
}

function printUnknown(value: unknown, asJson: boolean): void {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }

  if (typeof value === 'string') {
    process.stdout.write(`${value}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function ensureOk(response: Response, body: unknown): void {
  if (response.ok) {
    return;
  }

  const message = typeof body === 'object' && body && 'error' in body
    ? String((body as { error: unknown }).error)
    : `Request failed with ${response.status}`;

  const error = new Error(message);
  (error as Error & { status?: number; body?: unknown }).status = response.status;
  (error as Error & { status?: number; body?: unknown }).body = body;
  throw error;
}

async function getAuthedSession(): Promise<SessionFile> {
  const session = await loadSession();
  if (Object.keys(session.cookies).length === 0) {
    throw new Error(`No stored session found at ${SESSION_FILE}. Run 'jp auth login' first.`);
  }
  return session;
}

function deriveSlugFromFilePath(filePath: string): string {
  const slug = path.parse(filePath).name.trim();
  if (!slug) {
    throw new Error(`Unable to derive slug from file path: ${filePath}`);
  }
  return slug;
}

export function parseMarkdownContent(markdown: string, filePath: string): ParsedMarkdownContent {
  const body = markdown.trim();
  if (!body) {
    throw new Error(`Markdown file is empty: ${filePath}`);
  }

  const h1Match = /^#\s+(.+)$/m.exec(body);
  if (!h1Match) {
    throw new Error(`Markdown file must include an H1 title: ${filePath}`);
  }

  const title = h1Match[1].trim();
  if (!title) {
    throw new Error(`H1 title cannot be empty: ${filePath}`);
  }

  const h1LineEnd = body.indexOf('\n', h1Match.index);
  const contentAfterH1 = h1LineEnd >= 0 ? body.slice(h1LineEnd + 1) : '';
  const h2Match = /^##\s+.+$/m.exec(contentAfterH1);
  const excerptSource = h2Match ? contentAfterH1.slice(0, h2Match.index) : contentAfterH1;
  const excerpt = excerptSource.trim();

  return {
    slug: deriveSlugFromFilePath(filePath),
    title,
    excerpt,
    body,
  };
}

export async function parseMarkdownFile(filePath: string): Promise<ParsedMarkdownContent> {
  const absolutePath = path.resolve(filePath);
  const markdown = await fs.readFile(absolutePath, 'utf8');
  return parseMarkdownContent(markdown, absolutePath);
}

async function loadEnvFile(envFilePath: string): Promise<{ values: Record<string, string>; loadError: string | null }> {
  try {
    const raw = await fs.readFile(envFilePath, 'utf8');
    return {
      values: parseDotEnv(raw),
      loadError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      values: {},
      loadError: message,
    };
  }
}

function parseNodeMajorVersion(nodeVersion: string): number {
  const [majorPart] = nodeVersion.split('.');
  const parsed = Number.parseInt(majorPart ?? '', 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchWithTimeout(
  fetchFn: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchFn(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function runDoctorChecks(options: DoctorRunOptions): Promise<DoctorCheckResult[]> {
  const envFilePath = options.envFilePath ?? ENV_FILE;
  const fetchFn = options.fetchFn ?? fetch;
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  const timeoutMs = options.timeoutMs ?? 3000;
  const normalizedBaseUrl = options.baseUrl.trim().replace(/\/$/, '') || DEFAULT_BASE_URL;
  const checks: DoctorCheckResult[] = [];
  const envFile = await loadEnvFile(envFilePath);
  const envValues = envFile.values;

  const nodeMajor = parseNodeMajorVersion(nodeVersion);
  checks.push({
    label: 'Node.js version >= 20',
    ok: nodeMajor >= 20,
    details: `found ${nodeVersion}`,
  });

  for (const key of REQUIRED_ENV_VARS) {
    const value = envValues[key];
    const hasValue = typeof value === 'string' && value.trim().length > 0;
    checks.push({
      label: `.env.local has ${key}`,
      ok: hasValue,
      details: hasValue
        ? 'set'
        : envFile.loadError
          ? `missing (${envFile.loadError})`
          : 'missing',
    });
  }

  const anonKey = envValues.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = envValues.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseRestUrl =
    typeof supabaseUrl === 'string' && supabaseUrl.trim().length > 0
      ? `${supabaseUrl.trim().replace(/\/$/, '')}/rest/v1/`
      : SUPABASE_LOCAL_REST_URL;
  if (typeof anonKey !== 'string' || anonKey.trim().length === 0) {
    checks.push({
      label: 'Supabase REST API is reachable',
      ok: false,
      details: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local',
    });
  } else {
    try {
      const response = await fetchWithTimeout(
        fetchFn,
        supabaseRestUrl,
        {
          method: 'GET',
          headers: {
            apikey: anonKey,
            authorization: `Bearer ${anonKey}`,
          },
        },
        timeoutMs,
      );

      checks.push({
        label: 'Supabase REST API is reachable',
        ok: response.ok,
        details: `HTTP ${response.status}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        label: 'Supabase REST API is reachable',
        ok: false,
        details: message,
      });
    }
  }

  try {
    const response = await fetchWithTimeout(
      fetchFn,
      `${normalizedBaseUrl}/`,
      { method: 'GET' },
      timeoutMs,
    );

    checks.push({
      label: `Next.js dev server is reachable at ${normalizedBaseUrl}`,
      ok: response.ok,
      details: `HTTP ${response.status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({
      label: `Next.js dev server is reachable at ${normalizedBaseUrl}`,
      ok: false,
      details: message,
    });
  }

  return checks;
}

function colorize(text: string, color: string): string {
  if (!process.stdout.isTTY) {
    return text;
  }
  return `${color}${text}${ANSI_RESET}`;
}

function printDoctorChecklist(checks: DoctorCheckResult[]): void {
  process.stdout.write('Health check results:\n');
  for (const check of checks) {
    const marker = check.ok ? colorize('✓', ANSI_GREEN) : colorize('✗', ANSI_RED);
    process.stdout.write(`${marker} ${check.label} (${check.details})\n`);
  }
}

const program = new Command();
program
  .name('jp')
  .description('Local development CLI for jamesperalta.com')
  .option('--base-url <url>', 'Base URL for API requests', DEFAULT_BASE_URL)
  .option('--json', 'Print raw JSON output');

const auth = program.command('auth').description('Authentication commands');

auth
  .command('login')
  .description('Login through NextAuth credentials and persist session cookie')
  .requiredOption('--email <email>', 'Email address')
  .requiredOption('--password <password>', 'Password')
  .action(async (options, command: Command) => {
    const globals = resolveGlobals(command);
    const session: SessionFile = {
      cookies: {},
      baseUrl: globals.baseUrl,
      updatedAt: new Date().toISOString(),
    };

    const csrfResponse = await requestWithSession(globals.baseUrl, '/api/auth/csrf', { method: 'GET' }, session);
    const csrfBody = await readResponseBody(csrfResponse);
    ensureOk(csrfResponse, csrfBody);

    const csrfToken = typeof csrfBody === 'object' && csrfBody && 'csrfToken' in csrfBody
      ? String((csrfBody as { csrfToken: unknown }).csrfToken)
      : '';

    if (!csrfToken) {
      throw new Error('Failed to retrieve CSRF token from /api/auth/csrf');
    }

    const form = new URLSearchParams({
      csrfToken,
      email: String(options.email).trim().toLowerCase(),
      password: String(options.password),
      callbackUrl: `${globals.baseUrl}/home`,
      json: 'true',
    });

    const loginResponse = await requestWithSession(
      globals.baseUrl,
      '/api/auth/callback/credentials?json=true',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        redirect: 'manual',
      },
      session,
    );

    const loginBody = await readResponseBody(loginResponse);

    if (loginResponse.status >= 400) {
      ensureOk(loginResponse, loginBody);
    }

    const whoamiResponse = await requestWithSession(globals.baseUrl, '/api/auth/session', { method: 'GET' }, session);
    const whoamiBody = await readResponseBody(whoamiResponse);
    ensureOk(whoamiResponse, whoamiBody);

    if (!whoamiBody || typeof whoamiBody !== 'object' || !('user' in whoamiBody)) {
      throw new Error('Login did not produce an authenticated session.');
    }

    await saveSession(session);

    if (globals.json) {
      printUnknown({
        ok: true,
        sessionFile: SESSION_FILE,
        user: (whoamiBody as { user: unknown }).user,
      }, true);
      return;
    }

    const user = (whoamiBody as { user?: { email?: string; role?: string; username?: string } }).user;
    process.stdout.write(`Logged in as ${user?.email ?? 'unknown'} (${user?.role ?? 'unknown'})\n`);
    process.stdout.write(`Session saved to ${SESSION_FILE}\n`);
  });

auth
  .command('whoami')
  .description('Show current session info')
  .action(async (_options, command: Command) => {
    const globals = resolveGlobals(command);
    const session = await getAuthedSession();

    const response = await requestWithSession(globals.baseUrl, '/api/auth/session', { method: 'GET' }, session);
    const body = await readResponseBody(response);
    ensureOk(response, body);

    await saveSession(session);

    if (globals.json) {
      printUnknown(body, true);
      return;
    }

    const user = (body as { user?: { email?: string; role?: string; username?: string } }).user;
    if (!user) {
      process.stdout.write('No active authenticated session.\n');
      return;
    }

    process.stdout.write(`${user.email ?? 'unknown'}\n`);
    process.stdout.write(`role: ${user.role ?? 'unknown'}\n`);
    process.stdout.write(`username: ${user.username ?? 'unknown'}\n`);
  });

program
  .command('doctor')
  .description('Check local development environment health')
  .action(async (_options, command: Command) => {
    const globals = resolveGlobals(command);
    const checks = await runDoctorChecks({ baseUrl: globals.baseUrl });
    const allPassed = checks.every((check) => check.ok);

    if (globals.json) {
      printUnknown({ ok: allPassed, checks }, true);
    } else {
      printDoctorChecklist(checks);
      process.stdout.write(allPassed ? `${colorize('✓', ANSI_GREEN)} All checks passed.\n` : `${colorize('✗', ANSI_RED)} Checks failed.\n`);
    }

    if (!allPassed) {
      process.exitCode = 1;
    }
  });

const questions = program.command('questions').description('Question lookup commands');

questions
  .command('list')
  .description('List available question articles')
  .option('--topic <topic>', 'Filter by topic slug')
  .option('--limit <n>', 'Max number of rows', (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('--limit must be a positive integer');
    }
    return parsed;
  })
  .action(async (options, command: Command) => {
    const globals = resolveGlobals(command);
    const params = new URLSearchParams();

    if (typeof options.topic === 'string' && options.topic.trim().length > 0) {
      params.set('topic', options.topic.trim());
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    const response = await requestWithSession(globals.baseUrl, `/api/content${suffix}`, { method: 'GET' });
    const body = await readResponseBody(response);
    ensureOk(response, body);

    const rows = Array.isArray(body) ? body : [];
    const limit = typeof options.limit === 'number' ? options.limit : rows.length;
    const limited = rows.slice(0, limit);

    if (globals.json) {
      printUnknown(limited, true);
      return;
    }

    if (limited.length === 0) {
      process.stdout.write('No questions found.\n');
      return;
    }

    for (const row of limited) {
      const item = row as { slug?: string; title?: string; topic_id?: string };
      process.stdout.write(`${item.slug ?? 'unknown-slug'}\t${item.title ?? 'Untitled'}\t${item.topic_id ?? '-'}\n`);
    }

    process.stdout.write(`\nTotal: ${limited.length}\n`);
  });

questions
  .command('get <slug>')
  .description('Get a question/article by slug')
  .action(async (slug: string, _options: Record<string, unknown>, command: Command) => {
    const globals = resolveGlobals(command);
    const response = await requestWithSession(
      globals.baseUrl,
      `/api/content/${encodeURIComponent(slug)}`,
      { method: 'GET' },
    );

    const body = await readResponseBody(response);
    ensureOk(response, body);

    if (globals.json) {
      printUnknown(body, true);
      return;
    }

    const item = body as { slug?: string; title?: string; excerpt?: string; body?: string };
    process.stdout.write(`${item.slug ?? slug}\n`);
    process.stdout.write(`${item.title ?? ''}\n`);
    if (item.excerpt) {
      process.stdout.write(`${item.excerpt}\n`);
    }
    if (item.body) {
      process.stdout.write(`\n${item.body}\n`);
    }
  });

const content = questions.command('content').description('Content administration commands');

content
  .command('push')
  .description('Upsert an article from a local markdown file')
  .requiredOption('--file <path>', 'Path to local markdown file')
  .requiredOption('--topic-id <id>', 'Topic id to assign to the article')
  .action(async (options, command: Command) => {
    const globals = resolveGlobals(command);
    const session = await getAuthedSession();
    const absolutePath = path.resolve(process.cwd(), String(options.file));
    const fallbackSlug = deriveSlugFromFilePath(absolutePath);

    try {
      const parsed = await parseMarkdownFile(absolutePath);
      const response = await requestWithSession(
        globals.baseUrl,
        '/api/content',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            slug: parsed.slug,
            title: parsed.title,
            excerpt: parsed.excerpt,
            body: parsed.body,
            topicId: String(options.topicId),
          }),
        },
        session,
      );

      const body = await readResponseBody(response);
      ensureOk(response, body);
      await saveSession(session);

      if (globals.json) {
        printUnknown({ ok: true, slug: parsed.slug, data: body }, true);
        return;
      }

      process.stdout.write(`Pushed article '${parsed.slug}'.\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to push article '${fallbackSlug}': ${message}`);
    }
  });

const tutor = program.command('tutor').description('Tutor interactions');

tutor
  .command('hint')
  .description('Send a message to tutor for a question slug and stream response')
  .requiredOption('--question <slug>', 'Question/article slug')
  .requiredOption('--message <message>', 'Message to send to tutor')
  .action(async (options, command: Command) => {
    const globals = resolveGlobals(command);
    const session = await getAuthedSession();

    const response = await requestWithSession(
      globals.baseUrl,
      '/api/tutor',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify({
          articleSlug: String(options.question),
          message: String(options.message),
        }),
      },
      session,
    );

    if (!response.ok) {
      const body = await readResponseBody(response);
      ensureOk(response, body);
      return;
    }

    if (!response.body) {
      throw new Error('Tutor stream did not return a response body');
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    let buffer = '';
    let conversationId: number | null = null;
    let fullText = '';

    const processLine = (line: string): boolean => {
      if (!line.startsWith('data:')) {
        return false;
      }

      const payload = line.slice(5).trim();
      if (!payload) {
        return false;
      }

      if (payload === '[DONE]') {
        return true;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        return false;
      }

      if (typeof parsed === 'object' && parsed) {
        const asObj = parsed as { conversationId?: unknown; content?: unknown; error?: unknown };
        if (typeof asObj.error === 'string' && asObj.error.length > 0) {
          throw new Error(asObj.error);
        }

        if (typeof asObj.conversationId === 'number') {
          conversationId = asObj.conversationId;
        }

        if (typeof asObj.content === 'string' && asObj.content.length > 0) {
          fullText += asObj.content;
          if (!globals.json) {
            process.stdout.write(asObj.content);
          }
        }
      }

      return false;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf('\n');

      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        const isDone = processLine(line);
        if (isDone) {
          break;
        }
        newlineIndex = buffer.indexOf('\n');
      }
    }

    await saveSession(session);

    if (globals.json) {
      printUnknown({ conversationId, content: fullText }, true);
      return;
    }

    process.stdout.write('\n');
    if (conversationId) {
      process.stdout.write(`conversationId: ${conversationId}\n`);
    }
  });

const progress = program.command('progress').description('Progress APIs');

progress
  .command('get')
  .description('Get current user progress summary')
  .action(async (_options, command: Command) => {
    const globals = resolveGlobals(command);
    const session = await getAuthedSession();

    const response = await requestWithSession(globals.baseUrl, '/api/progress', { method: 'GET' }, session);
    const body = await readResponseBody(response);
    ensureOk(response, body);

    await saveSession(session);

    if (globals.json) {
      printUnknown(body, true);
      return;
    }

    printUnknown(body, false);
  });

export async function runCli(argv: string[] = process.argv): Promise<void> {
  await program.parseAsync(argv);
}

const isDirectInvocation = typeof process.argv[1] === 'string'
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  });
}
