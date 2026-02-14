'use client';

import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';

export default function LeaveSessionButton() {
    const { state, abandonSession } = useSessionContext();
    const router = useRouter();

    if (state.phase !== 'execution') {
        return null;
    }

    return (
        <button
            onClick={() => {
                abandonSession();
                router.replace('/home');
            }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm text-text-muted font-medium transition-all hover:bg-white/[0.06] hover:border-white/15 hover:text-text-secondary"
        >
            <span className="text-xs">←</span>
            Leave session
        </button>
    );
}
