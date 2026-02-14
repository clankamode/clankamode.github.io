import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';

const PROGRESS_TABLE = 'UserArticleProgress';
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const seenIdempotencyKeys = new Map<string, number>();

function consumeIdempotencyKey(rawKey: string | null): boolean {
  if (!rawKey) return false;
  const now = Date.now();
  for (const [key, expiry] of seenIdempotencyKeys.entries()) {
    if (expiry <= now) seenIdempotencyKeys.delete(key);
  }
  if (seenIdempotencyKeys.has(rawKey)) return true;
  seenIdempotencyKeys.set(rawKey, now + IDEMPOTENCY_TTL_MS);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
    }

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (consumeIdempotencyKey(idempotencyKey)) {
      return NextResponse.json({ completed: true, deduped: true });
    }

    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from(PROGRESS_TABLE)
      .upsert(
        {
          email: identity.email,
          google_id: identity.googleId ?? null,
          article_id: articleId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'email,article_id' }
      );

    if (error) {
      console.error('Error saving completion:', error);
      return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 });
    }

    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error('Error in POST /api/progress/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
    }

    const { articleId } = await req.json();
    if (!articleId || typeof articleId !== 'string') {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
    }

    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (consumeIdempotencyKey(idempotencyKey)) {
      return NextResponse.json({ completed: false, deduped: true });
    }

    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from(PROGRESS_TABLE)
      .delete()
      .or(buildUserIdentityOrFilter(identity))
      .eq('article_id', articleId);

    if (error) {
      console.error('Error removing completion:', error);
      return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 });
    }

    return NextResponse.json({ completed: false });
  } catch (error) {
    console.error('Error in DELETE /api/progress/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
