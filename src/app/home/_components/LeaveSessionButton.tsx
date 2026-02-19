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
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-workbench border border-border-subtle text-sm text-text-muted font-medium transition-all hover:bg-surface-interactive hover:border-border-interactive hover:text-text-secondary"
        >
            <span className="text-xs">←</span>
            Leave session
        </button>
    );
}
