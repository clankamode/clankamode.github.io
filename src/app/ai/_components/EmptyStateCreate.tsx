'use client';

import { ReactNode } from 'react';

interface EmptyStateCreateProps {
    mode: 'image' | 'chat';
    composer: ReactNode;
    chips?: { label: string; onClick: () => void }[];
    templates?: { title: string; description: string; onClick: () => void }[];
}

export function EmptyStateCreate({
    mode,
    composer,
    chips,
    templates,
}: EmptyStateCreateProps) {
    return (
        <div className="w-full max-w-[920px] mx-auto px-6 py-8 flex flex-col min-h-[60vh]">
            <div className="relative pl-8 flex-1 flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/15" />

                <div className="relative mb-8">
                    <div className="absolute -left-8 top-0 flex items-center justify-center w-4 h-4">
                        <div className="w-2 h-2 rounded-full bg-white/50" />
                    </div>
                    <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide mb-2">
                        Castleridge Labs
                    </div>
                    <h1 className="text-[24px] font-medium text-white/95 tracking-tight">
                        {mode === 'image' ? 'Create something' : 'What do you need?'}
                    </h1>
                    <p className="mt-1 text-[14px] text-white/50">
                        {mode === 'image'
                            ? 'Describe your vision. Generate. Iterate.'
                            : 'Code help, creative writing, analysis, or just chat.'}
                    </p>
                </div>

                {templates && templates.length > 0 && (
                    <div className="mb-6 space-y-1">
                        <div className="text-[11px] text-white/30 font-medium uppercase tracking-wide mb-2">
                            Workflows
                        </div>
                        {templates.map((template, i) => (
                            <button
                                key={i}
                                onClick={template.onClick}
                                className="relative w-full text-left py-2 px-3 -mx-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <div>
                                        <span className="text-[14px] text-white/80 group-hover:text-white transition-colors">
                                            {template.title}
                                        </span>
                                        <span className="text-[13px] text-white/40 ml-2">
                                            {template.description}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {chips && chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {chips.map((chip, i) => (
                            <button
                                key={i}
                                onClick={chip.onClick}
                                className="px-3 py-1.5 text-[13px] rounded-md bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/90 transition-colors"
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 min-h-8" />

                <div className="flex items-start gap-4 -ml-8">
                    <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center mt-[18px]">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/40 bg-transparent" />
                    </div>
                    <div className="flex-1 pl-4">
                        {composer}
                    </div>
                </div>
            </div>
        </div>
    );
}
