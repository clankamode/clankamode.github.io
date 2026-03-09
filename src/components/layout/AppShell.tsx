'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useChromeVisibility } from '@/hooks/useChromeMode';
import { useSession } from '@/contexts/SessionContext';
import Navbar from './Navbar';
import Footer from './Footer';

const FeedbackWidget = dynamic(() => import('@/components/feedback/FeedbackWidget'), { ssr: false });


interface AppShellProps {
    children: React.ReactNode;
}

export const MAIN_CONTENT_ID = 'main-content';

export default function AppShell({ children }: AppShellProps) {
    const { mode, showNavbar, showFooter, showFeedbackWidget } = useChromeVisibility();
    const { state } = useSession();

    return (
        <div data-session-phase={state?.phase || 'idle'}>
            {showNavbar && <Navbar mode={mode} />}

            <div className={`min-h-screen flex flex-col ${showNavbar ? 'pt-14' : ''}`}>
                <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-grow">
                    {children}
                </main>
                {showFooter && <Footer />}
            </div>
            {showFeedbackWidget && <FeedbackWidget />}
        </div>
    );
}
