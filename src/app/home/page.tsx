import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSessionState } from '@/lib/progress';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getLastInternalization } from '@/app/actions/fingerprint';
import HomeClient from './HomeClient';

export const metadata = {
    title: 'Home | Lesson Planner',
    description: 'Your learning session',
};

export const dynamic = 'force-dynamic';

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ track?: string | string[] }>;
}) {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
        redirect('/');
    }

    const progressEnabled = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, authSession.user);
    const sessionModeEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, authSession.user);
    const personalizationScopeExperimentEnabled = isFeatureEnabled(
        FeatureFlags.PERSONALIZATION_SCOPE_EXPERIMENT,
        authSession.user
    );
    if (!progressEnabled || !sessionModeEnabled) {
        redirect('/learn');
    }

    const resolvedSearchParams = await searchParams;
    const trackParam = Array.isArray(resolvedSearchParams?.track)
        ? resolvedSearchParams?.track[0]
        : resolvedSearchParams?.track;
    const [sessionState, primer] = await Promise.all([
        getSessionState(authSession.user.email, trackParam, authSession.user.id ?? undefined, {
            enablePersonalizationScopeExperiment: personalizationScopeExperimentEnabled,
            viewer: { role: authSession.user.role },
        }),
        getLastInternalization(authSession.user.email, authSession.user.id ?? undefined),
    ]);

    return <HomeClient sessionState={sessionState} primer={primer} />;
}
