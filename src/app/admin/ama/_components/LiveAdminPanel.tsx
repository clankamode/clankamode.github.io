'use client';

import { useState } from 'react';
import { AmaAdminTable } from './AmaAdminTable';
import { ResumeAdminTable } from './ResumeAdminTable';

type Tab = 'ama' | 'resumes';

export function LiveAdminPanel() {
  const [tab, setTab] = useState<Tab>('ama');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl border border-border-subtle bg-surface-interactive/40 p-1">
        {([
          { key: 'ama' as Tab, label: 'AMA Questions' },
          { key: 'resumes' as Tab, label: 'Resume Reviews' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-surface-dense text-foreground'
                : 'text-text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'ama' ? <AmaAdminTable /> : <ResumeAdminTable />}
    </div>
  );
}
