'use client';

import { useChromeVisibility } from '@/hooks/useChromeMode';
import { useSession } from '@/contexts/SessionContext';
import Navbar from './Navbar';
import Footer from './Footer';


interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const { mode, showNavbar, showFooter } = useChromeVisibility();
    const { state } = useSession();

    return (
        <div data-session-phase={state?.phase || 'idle'}>
            {showNavbar && <Navbar mode={mode} />}

            <div className={`min-h-screen flex flex-col ${showNavbar ? 'pt-14' : ''}`}>
                <main className="flex-grow">
                    {children}
                </main>
                {showFooter && <Footer />}
            </div>
        </div>
    );
}
