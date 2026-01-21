import type React from 'react';

interface TimestampModalProps {
  isOpen: boolean;
  transcript: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onTranscriptChange: (value: string) => void;
}

export const TimestampModal = ({
  isOpen,
  transcript,
  onClose,
  onSubmit,
  onTranscriptChange,
}: TimestampModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-surface-workbench shadow-xl border border-border-subtle max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Generate Timestamps</h2>
            <p className="text-base text-muted-foreground">
              Paste your transcript or notes to generate YouTube-style timestamps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close timestamp modal"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Transcript / Notes
            </label>
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-border-subtle bg-surface-interactive text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green/40 font-mono text-base"
              placeholder="Paste your transcript or notes here..."
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!transcript.trim()}
              className="px-5 py-2 text-base font-semibold text-black bg-brand-green rounded-lg hover:bg-brand-green/90 transition-colors disabled:bg-surface-interactive disabled:cursor-not-allowed"
            >
              Generate Timestamps
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
