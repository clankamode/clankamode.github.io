'use client';

import { useSession } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { sanitizeIntentText } from '@/lib/intent-display';

export default function SessionChecklist() {
    const { state } = useSession();
    const router = useRouter();

    if (!state.scope) return null;

    const { items, track } = state.scope;
    const currentIndex = state.execution?.currentIndex || 0;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-text-primary">Session Plan</h3>
                <p className="text-xs text-text-muted">
                    {track.name}
                </p>
            </div>

            <ol className="relative border-l border-white/10 ml-3 space-y-6">
                {items.map((item, i) => {
                    const isCompleted = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const isFuture = i > currentIndex;

                    return (
                        <li key={item.href} className="pl-6 relative">
                            <span className={cn(
                                "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-colors",
                                isCompleted && "bg-brand-green border-brand-green",
                                isCurrent && "bg-background border-accent-primary animate-pulse",
                                isFuture && "bg-background border-white/20"
                            )} />

                            <div className={cn(
                                "transition-opacity duration-300",
                                isFuture && "opacity-50"
                            )}>
                                <span className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                                    Step {i + 1}
                                </span>
                                {isFuture ? (
                                    <span className="block text-sm font-medium text-text-secondary cursor-not-allowed">
                                        {item.title}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => router.push(item.href)}
                                        className={cn(
                                            "block text-left text-sm font-medium transition-colors hover:text-accent-primary",
                                            isCurrent ? "text-accent-primary" : "text-text-primary"
                                        )}
                                    >
                                        {item.title}
                                    </button>
                                )}
                                <span className="block text-xs text-text-muted mt-0.5">
                                    {item.estMinutes || 5} min · {item.type}
                                </span>
                                <span className="mt-1 block text-xs text-text-muted/90">
                                    Why: {sanitizeIntentText(item.intent.text, { title: item.title, maxChars: 120, minChars: 24 })}
                                </span>
                                {(item.targetConcept || item.primaryConceptSlug) && (
                                    <span className="mt-1 block text-[11px] uppercase tracking-[0.08em] text-text-muted">
                                        Target: {item.targetConcept || item.primaryConceptSlug}
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
