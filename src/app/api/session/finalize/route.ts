import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { UserRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { invalidateCache } from '@/lib/redis';

const PROGRESS_TABLE = 'UserArticleProgress';
const PRACTICE_PROGRESS_TABLE = 'UserPracticeProgress';

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

function extractPracticeQuestionIdentifiersFromCompletedItems(items: string[]): string[] {
  const identifiers = new Set<string>();

  for (const href of items) {
    if (typeof href !== 'string' || !href.startsWith('/session/practice/')) continue;
    const [pathOnly] = href.split('?');
    const segments = pathOnly.split('/').filter(Boolean);
    if (segments.length < 3) continue;
    const identifier = segments[2]?.trim();
    if (!identifier) continue;
    identifiers.add(identifier);
  }

  return Array.from(identifiers);
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

    const completedPracticeIdentifiers = extractPracticeQuestionIdentifiersFromCompletedItems(normalizedCompletedItems);
    if (completedPracticeIdentifiers.length > 0) {
      const numericIdentifiers = completedPracticeIdentifiers
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
      const stringIdentifiers = completedPracticeIdentifiers.filter((value) => !numericIdentifiers.includes(Number(value)));

      const practiceQueries = [];
      if (numericIdentifiers.length > 0) {
        practiceQueries.push(
          admin
            .from('InterviewQuestions')
            .select('id, leetcode_number')
            .in('leetcode_number', numericIdentifiers)
        );
      }
      if (stringIdentifiers.length > 0) {
        practiceQueries.push(
          admin
            .from('InterviewQuestions')
            .select('id, leetcode_number')
            .in('id', stringIdentifiers)
        );
      }

      const practiceResults = await Promise.all(practiceQueries);
      const questionRows: Array<{ id: string; leetcode_number: number | null }> = [];
      for (const result of practiceResults) {
        if (result.error) {
          console.warn('[session/finalize] practice question lookup failed:', result.error.message);
          continue;
        }
        questionRows.push(...(result.data || []));
      }

      if (questionRows.length > 0) {
        const nowIso = new Date().toISOString();
        // Mark as 'attempted' only — the dedicated /api/peralta75/progress route
        // is responsible for marking questions as 'solved' once the user passes all
        // test cases. Finalize only records that the question was visited in-session.
        const upsertRows = questionRows.map((question) => ({
          email: identity.email,
          google_id: identity.googleId ?? null,
          problem_id: question.id,
          leetcode_number: question.leetcode_number,
          status: 'attempted',
          attempted_at: nowIso,
          solved_at: null,
          updated_at: nowIso,
        }));

        const { error: practiceProgressError } = await admin
          .from(PRACTICE_PROGRESS_TABLE)
          .upsert(upsertRows, { onConflict: 'email,problem_id' });

        if (practiceProgressError) {
          console.warn('[session/finalize] practice progress upsert failed:', practiceProgressError.message);
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
