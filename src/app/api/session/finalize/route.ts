import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { invalidateCache } from '@/lib/redis';

const PROGRESS_TABLE = 'UserArticleProgress';

function extractLearnArticleSlugsFromCompletedItems(items: string[]): string[] {
  const slugs = new Set<string>();

  for (const href of items) {
    if (typeof href !== 'string' || !href.startsWith('/learn/')) continue;
    const [pathOnly] = href.split('?');
    const segments = pathOnly.split('/').filter(Boolean);
    if (segments.length < 3) continue;
    const articleSlug = segments[2]?.trim();
    if (!articleSlug) continue;
    slugs.add(articleSlug);
  }

  return Array.from(slugs);
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
    if (!token || !isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing identity' }, { status: 400 });
    }

    const {
      sessionId,
      trackSlug,
      completedItems,
      reflectionCompletedAt,
      skipped,
      personalizationScopeCohort,
      personalizationScopeEligible,
      personalizationScopeApplied,
      aiPolicyVersion,
      planDecisionId,
      scopeDecisionId,
      onboardingDecisionId,
      policyFallbackUsed,
    } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!trackSlug || typeof trackSlug !== 'string') {
      return NextResponse.json({ error: 'trackSlug is required' }, { status: 400 });
    }

    const normalizedCompletedItems = Array.isArray(completedItems)
      ? completedItems.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : [];

    const admin = getSupabaseAdminClient();
    const dedupeKey = `session_finalized_${sessionId}`;
    const payload = {
      completedItems: normalizedCompletedItems,
      reflection_completed_at: reflectionCompletedAt ?? null,
      skipped: Boolean(skipped),
      personalizationScopeCohort: typeof personalizationScopeCohort === 'string' ? personalizationScopeCohort : 'not_eligible',
      personalizationScopeEligible: Boolean(personalizationScopeEligible),
      personalizationScopeApplied: Boolean(personalizationScopeApplied),
      aiPolicyVersion: typeof aiPolicyVersion === 'string' ? aiPolicyVersion : null,
      planDecisionId: typeof planDecisionId === 'string' ? planDecisionId : null,
      scopeDecisionId: typeof scopeDecisionId === 'string' ? scopeDecisionId : null,
      onboardingDecisionId: typeof onboardingDecisionId === 'string' ? onboardingDecisionId : null,
      policyFallbackUsed: Boolean(policyFallbackUsed),
    };

    const { error } = await admin
      .from('TelemetryEvents')
      .insert({
        email: identity.email,
        google_id: identity.googleId ?? null,
        track_slug: trackSlug,
        session_id: sessionId,
        event_type: 'session_finalized',
        mode: 'exit',
        payload,
        dedupe_key: dedupeKey,
      });

    if (error && !error.message.toLowerCase().includes('duplicate')) {
      console.error('[session/finalize] failed:', error.message);
      return NextResponse.json({ error: 'Failed to finalize session' }, { status: 500 });
    }

    const completedLearnSlugs = extractLearnArticleSlugsFromCompletedItems(normalizedCompletedItems);
    if (completedLearnSlugs.length > 0) {
      const { data: articles, error: lookupError } = await admin
        .from('LearningArticles')
        .select('id, slug')
        .in('slug', completedLearnSlugs);

      if (lookupError) {
        console.warn('[session/finalize] learning article lookup failed:', lookupError.message);
      } else if (articles && articles.length > 0) {
        const completedAt = new Date().toISOString();
        const progressRows = articles.map((article) => ({
          email: identity.email,
          google_id: identity.googleId ?? null,
          article_id: article.id,
          completed_at: completedAt,
        }));

        const { error: progressError } = await admin
          .from(PROGRESS_TABLE)
          .upsert(progressRows, { onConflict: 'email,article_id' });

        if (progressError) {
          console.warn('[session/finalize] progress upsert failed:', progressError.message);
        }
      }
    }

    await invalidateCache(`session-plan-lock:v1:${identity.email}:${trackSlug}`);

    return NextResponse.json({ finalized: true, dedupeKey });
  } catch (error) {
    console.error('[session/finalize] unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
