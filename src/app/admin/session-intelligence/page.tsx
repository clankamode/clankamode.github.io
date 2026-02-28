import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { UserRole, hasRole } from '@/types/roles';
import { parseSessionIntelligenceParams } from './params';
import { loadSessionIntelligenceData } from './load-session-intelligence-data';
import { SessionIntelligenceControls } from './components/session-intelligence-controls';
import { SessionIntelligenceQualityTab } from './components/session-intelligence-quality-tab';
import { SessionIntelligenceFrictionTab } from './components/session-intelligence-friction-tab';

export const dynamic = 'force-dynamic';

export default async function SessionIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string | string[];
    range?: string | string[];
    track?: string | string[];
    focusTrack?: string | string[];
    focusStep?: string | string[];
    queueStatus?: string | string[];
    queueOwner?: string | string[];
    aiType?: string | string[];
    aiMode?: string | string[];
    aiSource?: string | string[];
    aiOutcome?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const autoTriageEnabled = isFeatureEnabled(FeatureFlags.AI_TRIAGE_AUTOMATION, session?.user ?? null);

  if (!session?.user?.email) {
    redirect('/');
  }

  if (!hasRole(userRole, UserRole.ADMIN)) {
    redirect('/home');
  }

  const params = parseSessionIntelligenceParams(await searchParams);
  const data = await loadSessionIntelligenceData(params);

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Admin Observability</p>
          <h1 className="mt-3 text-4xl font-bold text-text-primary">Session Intelligence</h1>
        </div>

        <SessionIntelligenceControls
          tab={data.tab}
          range={data.range}
          track={data.track}
          trackOptions={data.trackOptions}
          focusTrack={data.focusTrack}
          focusStep={data.focusStep}
          queueStatus={data.queueStatus}
          queueOwner={data.queueOwner}
          aiType={data.aiType}
          aiMode={data.aiMode}
          aiSource={data.aiSource}
          aiOutcome={data.aiOutcome}
        />

        {data.tab === 'quality' ? (
          <SessionIntelligenceQualityTab range={data.range} quality={data.quality} />
        ) : (
          <SessionIntelligenceFrictionTab
            range={data.range}
            track={data.track}
            queueStatus={data.queueStatus}
            queueOwner={data.queueOwner}
            aiType={data.aiType}
            aiMode={data.aiMode}
            aiSource={data.aiSource}
            aiOutcome={data.aiOutcome}
            autoTriageEnabled={autoTriageEnabled}
            friction={data.friction}
          />
        )}
      </section>
    </main>
  );
}
