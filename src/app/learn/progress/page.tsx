import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getProgressSummary, getUserBookmarks } from '@/lib/progress';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import ProgressDashboard from '../_components/ProgressDashboard';
import InternalizationHistory from '../_components/InternalizationHistory';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;
  const user = session?.user;
  const accessGranted = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, user);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-24">
        <section className="mx-auto max-w-4xl px-6">
          <div className="frame bg-surface-interactive/70 p-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Progress</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary">
              Sign in to see your progress.
            </h1>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-border-interactive px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-text-secondary"
            >
              Go to login
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!accessGranted) {
    redirect('/learn');
  }

  const [summary, bookmarks, fingerprint] = await Promise.all([
    getProgressSummary(userId, session.user.id ?? undefined),
    getUserBookmarks(userId, session.user.id ?? undefined),
    isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user)
      ? import('@/app/actions/fingerprint').then(mod => mod.getFingerprintData(userId!, session?.user?.id || undefined))
      : Promise.resolve(null)
  ]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Progress</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
            Stay deliberate. Track every win.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-text-secondary leading-relaxed">
            Review your milestones, maintain your streak, and queue up the next article.
          </p>
        </div>

        <div className="space-y-12">
          <ProgressDashboard summary={summary} bookmarks={bookmarks} />

          {fingerprint && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2" />
              <div className="lg:col-span-1">
                <InternalizationHistory internalizations={fingerprint.internalizations} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
