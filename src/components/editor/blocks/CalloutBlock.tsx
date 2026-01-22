'use client';

import { useState } from 'react';
import type { CalloutBlock as CalloutBlockType } from '../types';

interface CalloutBlockProps {
  block: CalloutBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<CalloutBlockType>) => void;
}

const toneLabels: Record<CalloutBlockType['tone'], string> = {
  tip: 'Tip',
  warning: 'Warning',
  info: 'Info',
  important: 'Important',
};

const toneStyles: Record<CalloutBlockType['tone'], { label: string; accent: string }> = {
  tip: { label: 'Tip', accent: 'border-l-2 border-l-emerald-400/70' },
  warning: { label: 'Warning', accent: 'border-l-2 border-l-amber-300/70' },
  info: { label: 'Info', accent: 'border-l-2 border-l-sky-300/70' },
  important: { label: 'Important', accent: 'border-l-2 border-l-red-400/70' },
};

export function CalloutBlock({ block, editable = false, onChange }: CalloutBlockProps) {
  const isCollapsible = block.collapsible && !editable;
  const [open, setOpen] = useState(!isCollapsible);

  const tone = toneStyles[block.tone];

  return (
    <div className={`frame rounded-xl bg-surface-dense p-5 ${tone.accent}`}>
      <div className="flex items-center justify-between gap-4">
        {editable ? (
          <select
            className="rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-xs uppercase tracking-[0.2em] text-text-secondary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={block.tone}
            onChange={(event) => onChange?.({ tone: event.target.value as CalloutBlockType['tone'] })}
          >
            {Object.entries(toneLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted">{tone.label}</p>
            {isCollapsible && (
              <button
                type="button"
                className="text-xs text-text-secondary transition hover:text-text-primary"
                onClick={() => setOpen((prev) => !prev)}
              >
                {open ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        )}
        {editable && (
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={block.collapsible ?? false}
              onChange={(event) => onChange?.({ collapsible: event.target.checked })}
            />
            Collapsible
          </label>
        )}
      </div>

      {editable && (
        <input
          type="text"
          value={block.title ?? ''}
          placeholder="Callout title (optional)"
          className="mt-3 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => onChange?.({ title: event.target.value })}
        />
      )}

      {editable ? (
        <textarea
          value={block.content}
          placeholder="Write the callout content..."
          className="mt-3 min-h-[120px] w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => onChange?.({ content: event.target.value })}
        />
      ) : (
        open && (
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            {block.title && <p className="text-sm font-semibold text-text-primary">{block.title}</p>}
            <p className="whitespace-pre-line">{block.content}</p>
          </div>
        )
      )}
    </div>
  );
}
