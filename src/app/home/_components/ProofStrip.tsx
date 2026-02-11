import type { SessionProof } from '@/lib/progress';

interface ProofStripProps {
    proof: SessionProof;
}

export default function ProofStrip({ proof }: ProofStripProps) {
    const { streakDays, todayCount, last7 } = proof;

    return (
        <section className="mt-16 py-5 border-t border-white/[0.05]">
            <div className="flex items-center gap-8 flex-wrap">
                {/* Streak */}
                <div className="flex items-center gap-2">
                    <span className={`text-lg ${streakDays > 0 ? 'text-orange-400' : 'text-text-muted'}`}>
                        {streakDays > 0 ? '🔥' : '○'}
                    </span>
                    <span className="text-sm text-text-secondary">
                        {streakDays > 0 ? `${streakDays} day streak` : 'No streak'}
                    </span>
                </div>

                {/* Today count */}
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-primary/60" />
                    <span className="text-sm text-text-secondary">
                        {todayCount === 0 ? 'Nothing today' : `${todayCount} today`}
                    </span>
                </div>

                {/* Last 7 days heatmap */}
                <div className="flex items-center gap-1">
                    {last7.map((day) => (
                        <div
                            key={day.date}
                            className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)}`}
                            title={`${day.date}: ${day.count} completed`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function getHeatmapColor(count: number): string {
    if (count === 0) return 'bg-white/[0.05]';
    if (count === 1) return 'bg-accent-primary/30';
    if (count === 2) return 'bg-accent-primary/50';
    return 'bg-accent-primary/80';
}
