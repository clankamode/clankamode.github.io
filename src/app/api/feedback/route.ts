import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

type FeedbackCategory = 'bug' | 'idea' | 'content' | 'other';

interface FeedbackAttachment {
  url: string;
  name?: string;
}

interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  pagePath: string | null;
  pageUrl: string | null;
  contactEmail: string | null;
  attachmentUrls: FeedbackAttachment[];
}

interface PageVotePayload {
  pageSlug: string;
  helpful: boolean;
}

type ParsedPayload =
  | { kind: 'long_form'; payload: FeedbackPayload }
  | { kind: 'page_vote'; payload: PageVotePayload };

const FEEDBACK_CATEGORIES = new Set<FeedbackCategory>(['bug', 'idea', 'content', 'other']);
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_PAGE_PATH_LENGTH = 512;
const MAX_PAGE_URL_LENGTH = 2048;
const MAX_PAGE_SLUG_LENGTH = 512;
const MAX_EMAIL_LENGTH = 254;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_URL_LENGTH = 1024;
const MAX_ATTACHMENT_NAME_LENGTH = 256;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const feedbackRequests = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const current = feedbackRequests.get(clientKey);

  if (!current || now > current.resetAt) {
    feedbackRequests.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  feedbackRequests.set(clientKey, { ...current, count: current.count + 1 });
  return false;
}

function parseOptionalEmail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const email = value.trim();
  if (!email) {
    return null;
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error('Contact email is too long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Contact email format is invalid.');
  }

  return email;
}

function parsePagePath(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const path = value.trim();
  if (!path) {
    return null;
  }

  if (path.length > MAX_PAGE_PATH_LENGTH) {
    throw new Error('Page path is too long.');
  }

  return path;
}

function parsePageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const url = value.trim();
  if (!url) {
    return null;
  }

  if (url.length > MAX_PAGE_URL_LENGTH) {
    throw new Error('Page URL is too long.');
  }

  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function parseAttachmentUrls(value: unknown): FeedbackAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: FeedbackAttachment[] = [];
  for (const item of value.slice(0, MAX_ATTACHMENTS)) {
    if (!item || typeof item !== 'object') continue;
    const url = (item as Record<string, unknown>).url;
    if (typeof url !== 'string' || !url.trim()) continue;
    if (url.length > MAX_ATTACHMENT_URL_LENGTH) continue;
    const name = (item as Record<string, unknown>).name;
    const nameStr = typeof name === 'string' ? name.slice(0, MAX_ATTACHMENT_NAME_LENGTH) : undefined;
    out.push({ url: url.trim(), name: nameStr || undefined });
  }
  return out;
}

function parseLongFormPayload(candidate: Record<string, unknown>): FeedbackPayload {
  const category = candidate.category;
  const messageRaw = candidate.message;

  if (typeof category !== 'string' || !FEEDBACK_CATEGORIES.has(category as FeedbackCategory)) {
    throw new Error('Feedback category is invalid.');
  }

  if (typeof messageRaw !== 'string') {
    throw new Error('Feedback message is required.');
  }

  const message = messageRaw.trim();
  if (message.length < MIN_MESSAGE_LENGTH) {
    throw new Error(`Feedback message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Feedback message must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  return {
    category: category as FeedbackCategory,
    message,
    pagePath: parsePagePath(candidate.pagePath),
    pageUrl: parsePageUrl(candidate.pageUrl),
    contactEmail: parseOptionalEmail(candidate.contactEmail),
    attachmentUrls: parseAttachmentUrls(candidate.attachmentUrls),
  };
}

function parsePageSlug(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Page slug is required.');
  }

  const pageSlug = value.trim();
  if (!pageSlug) {
    throw new Error('Page slug is required.');
  }

  if (pageSlug.length > MAX_PAGE_SLUG_LENGTH) {
    throw new Error(`Page slug must be at most ${MAX_PAGE_SLUG_LENGTH} characters.`);
  }

  return pageSlug;
}

function parseHelpful(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error('Helpful must be a boolean.');
  }

  return value;
}

function parsePageVotePayload(candidate: Record<string, unknown>): PageVotePayload {
  return {
    pageSlug: parsePageSlug(candidate.pageSlug),
    helpful: parseHelpful(candidate.helpful),
  };
}

function parsePayload(payload: unknown): ParsedPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request body.');
  }

  const candidate = payload as Record<string, unknown>;
  const isPageVotePayload = 'pageSlug' in candidate || 'helpful' in candidate;

  if (isPageVotePayload) {
    return { kind: 'page_vote', payload: parsePageVotePayload(candidate) };
  }

  return { kind: 'long_form', payload: parseLongFormPayload(candidate) };
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many feedback requests. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const raw = await req.json();
    const payload = parsePayload(raw);
    const client = getSupabaseAdminClient();

    if (payload.kind === 'page_vote') {
      const { error } = await client.from('page_feedback').insert({
        page_slug: payload.payload.pageSlug,
        helpful: payload.payload.helpful,
      });

      if (error) {
        console.error('Error inserting page feedback:', error);
        return NextResponse.json({ error: 'Could not save feedback.' }, { status: 500 });
      }

      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const token = await getToken({ req });
    const identity = getEffectiveIdentityFromToken(token);
    const userAgent = req.headers.get('user-agent');

    const { error } = await client.from('UserFeedback').insert({
      id: crypto.randomUUID(),
      category: payload.payload.category,
      message: payload.payload.message,
      page_path: payload.payload.pagePath,
      contact_email: payload.payload.contactEmail,
      user_email: identity?.email ?? null,
      google_id: identity?.googleId ?? null,
      user_agent: userAgent,
      metadata: {
        source: 'feedback_widget',
        ip: clientIp,
        ...(payload.payload.pageUrl && { page_url: payload.payload.pageUrl }),
        ...(payload.payload.attachmentUrls.length > 0 && { attachments: payload.payload.attachmentUrls }),
      },
    });

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json({ error: 'Could not save feedback.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/feedback:', error);
    const message = error instanceof Error ? error.message : 'Invalid request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
