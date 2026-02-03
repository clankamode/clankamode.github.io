'use client';

import { ReactNode } from 'react';

interface TurnCardProps {
    prompt: string;
    model?: string;
    children: ReactNode;
    onCopy?: () => void;
}

export function TurnCard({
    prompt,
    model,
    children,
    onCopy,
}: TurnCardProps) {
    return (
        <article className="group relative">
            <div className="absolute -left-8 top-0 flex items-center justify-center w-4 h-4">
                <div className="w-2 h-2 rounded-full bg-white/40 group-hover:bg-white/60 transition-colors" />
            </div>

            <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide mb-0.5">You</div>
                    <p className="text-[15px] leading-relaxed text-white/90">{prompt}</p>
                </div>

                {onCopy && (
                    <button
                        onClick={onCopy}
                        className="absolute right-0 top-0 h-6 w-6 rounded hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100"
                        title="Copy"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="mt-2 ml-3">
                <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide mb-1">
                    {model || 'Assistant'}
                </div>
                <div className="group-hover:bg-white/[0.015] -ml-3 pl-3 -mr-4 pr-4 py-2 rounded-lg transition-colors">
                    {children}
                </div>
            </div>
        </article>
    );
}

export function TurnCardLoading({ prompt, model }: { prompt: string; model?: string }) {
    return (
        <article className="relative">
            <div className="absolute -left-8 top-0 flex items-center justify-center w-4 h-4">
                <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
            </div>

            <div className="mb-1">
                <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide mb-0.5">You</div>
                <p className="text-[15px] leading-relaxed text-white/90">{prompt}</p>
            </div>

            <div className="mt-2 ml-3">
                <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide mb-1">
                    {model || 'Assistant'}
                </div>
                <div className="flex items-center gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:300ms]" />
                </div>
            </div>
        </article>
    );
}
