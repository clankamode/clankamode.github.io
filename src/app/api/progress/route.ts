import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getArticleCompletionStatus, getProgressSummary } from '@/lib/progress';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
    }

    const articleId = req.nextUrl.searchParams.get('articleId');
    if (articleId) {
      const status = await getArticleCompletionStatus(identity.email, articleId, identity.googleId);
      return NextResponse.json(status);
    }

    const summary = await getProgressSummary(identity.email, identity.googleId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in GET /api/progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
