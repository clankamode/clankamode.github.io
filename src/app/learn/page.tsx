import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import Link from 'next/link';
import PillarCard from './_components/PillarCard';
import { getLearningLibrary } from '@/lib/content';
import { getProgressSummary } from '@/lib/progress';
import { UserRole, hasRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;
  const canViewDrafts = userRole ? hasRole(userRole, UserRole.EDITOR) : false;
  const userEmail = session?.user?.email ?? undefined;
  const userGoogleId = session?.user?.id ?? undefined;
  const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user);
  const sessionModeEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user);

  const [library, progressSummary] = await Promise.all([
    getLearningLibrary(canViewDrafts),
    showProgress && userEmail ? getProgressSummary(userEmail, userGoogleId) : null,
  ]);

  const pillarCards = library.map((pillar) => {
    const progress = progressSummary?.pillars.find((p) => p.slug === pillar.slug);
    return {
      pillar,
      articleCount: pillar.topics.reduce((sum, topic) => sum + topic.articles.length, 0),
      progressPercent: progress?.percent ?? 0,
    };
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">The Library</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold tracking-tight text-text-primary">
            Structured paths for deliberate mastery.
          </h1>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed">
            Four pillars. Clear progression. Everything you need to build the skills that compound.
          </p>
          <div className="mt-8 flex gap-4">
            {sessionModeEnabled && (
              <Link
                href="/home"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]"
              >
                Start Session
              </Link>
            )}
            {showProgress && userEmail && (
              <Link
                href="/learn/progress"
                className={`inline-flex items-center justify-center rounded-full border border-border-interactive px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-text-secondary ${!sessionModeEnabled ? 'bg-surface-interactive' : ''}`}
              >
                View Progress
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pillarCards.map(({ pillar, articleCount, progressPercent }) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              articleCount={articleCount}
              progressPercent={progressPercent}
              showProgress={showProgress}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
