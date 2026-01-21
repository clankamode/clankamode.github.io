import type React from 'react';
import { TutorialFormState } from './types';

interface TutorialModalProps {
  isOpen: boolean;
  form: TutorialFormState;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof TutorialFormState, value: string) => void;
  onCandidateChange: (index: number, value: string) => void;
  onAddCandidate: () => void;
  onRemoveCandidate: (index: number) => void;
}

export const TutorialModal = ({
  isOpen,
  form,
  onClose,
  onSubmit,
  onFieldChange,
  onCandidateChange,
  onAddCandidate,
  onRemoveCandidate,
}: TutorialModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Start a detailed tutorial</h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Provide your prompt and attempts so the AI can generate the full guided walkthrough.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close tutorial modal"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Problem statement / question prompt
            </label>
            <textarea
              value={form.problemStatement}
              onChange={(e) => onFieldChange('problemStatement', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
              placeholder="Paste the problem statement here..."
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Constraints + examples (optional)
            </label>
            <textarea
              value={form.constraintsAndExamples}
              onChange={(e) => onFieldChange('constraintsAndExamples', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
              placeholder="Paste constraints, example inputs/outputs, etc."
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-base font-medium text-gray-800 dark:text-gray-200">
                Candidate solutions (1..n)
              </label>
              <button
                type="button"
                onClick={onAddCandidate}
                className="text-base text-[#2cbb5d] hover:text-[#25a352] font-medium"
              >
                + Add another
              </button>
            </div>
            <div className="space-y-3">
              {form.candidateSolutions.map((solution, index) => (
                <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Solution {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveCandidate(index)}
                      className="text-sm text-gray-500 hover:text-red-500"
                      disabled={form.candidateSolutions.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={solution}
                    onChange={(e) => onCandidateChange(index, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
                    placeholder="Paste code or describe the approach..."
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
              Final solution + intuition (optional)
            </label>
            <textarea
              value={form.knownOptimalSolution}
              onChange={(e) => onFieldChange('knownOptimalSolution', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
              placeholder="Paste your final solution or intuition if you have one."
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
              className="px-5 py-2 text-base font-semibold text-white bg-[#2cbb5d] rounded-lg hover:bg-[#25a352] transition-colors"
            >
              Start tutorial chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
