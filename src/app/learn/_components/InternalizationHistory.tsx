import type { InternalizationWithMetadata } from '@/app/actions/fingerprint';

interface InternalizationHistoryProps {
    internalizations: InternalizationWithMetadata[];
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function InternalizationHistory({
    internalizations,
}: InternalizationHistoryProps) {
    const groupedBySession = internalizations.reduce((acc, item) => {
        if (!acc[item.session_id]) {
            acc[item.session_id] = [];
        }
        acc[item.session_id].push(item);
        return acc;
    }, {} as Record<string, InternalizationWithMetadata[]>);

    if (internalizations.length === 0) {
        return (
            <div className="frame bg-surface-workbench p-6">
                <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">Internalization History</h2>
                <div className="rounded-lg border border-dashed border-border-subtle bg-surface-ambient p-8 text-center">
                    <p className="text-sm text-text-muted">
                        No rituals completed yet. Finish your first exit ritual to see your history here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="frame bg-surface-workbench p-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">Internalization History</h2>

            <div className="space-y-6">
                {Object.entries(groupedBySession).map(([sessionId, items]) => (
                    <div key={sessionId} className="border-b border-border-workbench pb-4 last:border-b-0">
                        <div className="text-xs text-text-muted font-mono mb-2">
                            Session {formatDate(items[0].created_at)}
                        </div>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <div className="rounded-full border border-border-subtle px-2.5 py-0.5 text-xs shrink-0">
                                        {item.picked}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary">
                                            {item.concept.label}
                                        </div>
                                        {item.note && (
                                            <div className="mt-1 text-sm text-text-secondary">
                                                {item.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
