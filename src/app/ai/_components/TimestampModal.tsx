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
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Generate Timestamps</h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Paste your transcript or notes to generate YouTube-style timestamps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close timestamp modal"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Transcript / Notes
            </label>
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d] font-mono text-base"
              placeholder="Paste your transcript or notes here..."
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!transcript.trim()}
              className="px-5 py-2 text-base font-semibold text-white bg-[#2cbb5d] rounded-lg hover:bg-[#25a352] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Generate Timestamps
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
