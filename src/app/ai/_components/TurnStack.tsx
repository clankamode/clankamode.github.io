'use client';

import { ReactNode } from 'react';

interface TurnStackProps {
    children: ReactNode;
}

export function TurnStack({ children }: TurnStackProps) {
    return (
        <div className="w-full max-w-[920px] mx-auto px-6">
            <div className="relative pl-8">
                {/* Spine line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/15" />

                {/* Content */}
                <div className="space-y-8 py-6">{children}</div>
            </div>
        </div>
    );
}
