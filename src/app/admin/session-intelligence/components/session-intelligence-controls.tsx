import Link from 'next/link';
import { buildLink, type AIDecisionModeKey, type AIDecisionOutcomeKey, type AIDecisionSourceKey, type AIDecisionTypeKey, type IntelligenceTab, type QueueOwnerKey, type QueueStatusKey, type RangeKey, type TrackKey } from '../params';

type SessionIntelligenceControlsProps = {
  tab: IntelligenceTab;
  range: RangeKey;
  track: TrackKey;
  trackOptions: string[];
  focusTrack: string | null;
  focusStep: number | null;
  queueStatus: QueueStatusKey;
  queueOwner: QueueOwnerKey;
  aiType: AIDecisionTypeKey;
  aiMode: AIDecisionModeKey;
  aiSource: AIDecisionSourceKey;
  aiOutcome: AIDecisionOutcomeKey;
};

export function SessionIntelligenceControls({
  tab,
  range,
  track,
  trackOptions,
  focusTrack,
  focusStep,
  queueStatus,
  queueOwner,
  aiType,
  aiMode,
  aiSource,
  aiOutcome,
}: SessionIntelligenceControlsProps) {
  return (
    <div className="mb-6 rounded-lg border border-border-subtle bg-surface-interactive p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-border-subtle bg-surface p-1">
          <Link
            href={buildLink({ tab: 'quality', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded px-2.5 py-1.5 text-sm ${tab === 'quality' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Recommendation Quality
          </Link>
          <Link
            href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded px-2.5 py-1.5 text-sm ${tab === 'friction' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Friction Monitor
          </Link>
        </div>
        <div className="inline-flex rounded-md border border-border-subtle bg-surface p-1">
          {(['1d', '7d', '14d', '30d'] as RangeKey[]).map((option) => (
            <Link
              key={option}
              href={buildLink({ tab, range: option, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
              className={`rounded px-2 py-1 text-xs ${option === range ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {option}
            </Link>
          ))}
        </div>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-md border border-border-subtle bg-surface p-1">
          {trackOptions.map((option) => (
            <Link
              key={option}
              href={buildLink({
                tab,
                range,
                track: option,
                focusTrack: option === focusTrack ? focusTrack : null,
                focusStep: option === focusTrack ? focusStep : null,
                queueStatus,
                queueOwner,
                aiType,
                aiMode,
                aiSource,
                aiOutcome,
              })}
              className={`rounded px-2 py-1 text-xs ${option === track ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {option.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
