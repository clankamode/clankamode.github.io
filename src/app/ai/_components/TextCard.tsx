'use client';

import { RichText } from './RichText';

interface TextCardProps {
    content: string;
    isStreaming?: boolean;
    onCopy?: () => void;
}

export function TextCard({ content, isStreaming, onCopy }: TextCardProps) {
    return (
        <div className="group/response relative prose prose-invert prose-sm max-w-none text-white/80">
            <RichText content={content} className="text-[14px]" />
            {isStreaming && (
                <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-0.5" />
            )}
            {/* Copy response - hover reveal */}
            {onCopy && !isStreaming && (
                <button
                    onClick={onCopy}
                    className="absolute right-0 top-0 h-6 w-6 rounded hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all opacity-0 group-hover/response:opacity-100"
                    title="Copy response"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
