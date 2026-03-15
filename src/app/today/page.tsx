import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getDailyDigest } from '@/lib/daily-digest';
import { getEffectiveIdentityFromSession } from '@/lib/auth-identity';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Today | James Peralta',
  description: 'Your daily micro-learning digest.',
};

export default async function TodayPage() {
  const session = await getServerSession(authOptions);
  const identity = getEffectiveIdentityFromSession(session);

  if (!identity) {
    redirect('/');
  }

  const digest = await getDailyDigest(identity);

  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Today</p>
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary">Daily micro-learning digest</h1>
          <p className="max-w-xl text-sm text-text-muted">
            One concept, one clean explanation, one practice rep.
          </p>
        </div>

        {digest ? (
          <section className="rounded-2xl border border-border-subtle bg-surface-workbench p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                <span>{digest.mode === 'review' ? 'Review' : 'Learn'}</span>
                <span>·</span>
                <span>{digest.trackSlug}</span>
                <span>·</span>
                <span>5-10 min</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{digest.conceptName}</h2>
                <p className="text-sm text-text-secondary">{digest.reason}</p>
                <p className="text-base leading-7 text-text-primary">{digest.explanation}</p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">Practice problem</p>
                <p className="mt-2 text-lg font-medium text-text-primary">{digest.practiceTitle}</p>
                <p className="mt-1 text-sm text-text-muted">Use one focused rep to turn recognition into recall.</p>
              </div>

              <Link
                href={digest.practiceHref}
                className="inline-flex w-fit items-center rounded-lg border border-border-interactive bg-surface-dense px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-interactive"
              >
                Start practice
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-border-subtle bg-surface-workbench p-6">
            <h2 className="text-xl font-semibold text-text-primary">No digest yet</h2>
            <p className="mt-2 text-sm text-text-muted">
              Complete a session or finish onboarding so the next daily item can target the right concept.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
