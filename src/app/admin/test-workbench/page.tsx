'use client';

import { useState } from 'react';
import { BlockEditor } from '@/components/editor/BlockEditor';

export default function TestWorkbenchPage() {
    const [value, setValue] = useState('');

    return (
        <div className="min-h-screen bg-surface-base p-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-6 text-2xl font-bold text-text-primary">BlockEditor Test Workbench</h1>
                <div className="rounded-xl border border-border-subtle bg-surface-workbench p-6">
                    <BlockEditor
                        value={value}
                        onChange={setValue}
                        mediaLibraryTrigger={0}
                    />
                </div>
                <div className="mt-8 rounded-xl border border-border-subtle bg-surface-ambient p-4">
                    <h2 className="mb-2 text-sm uppercase tracking-wider text-text-muted">Editor Value (Debug)</h2>
                    <pre className="overflow-auto rounded bg-surface-dense p-4 text-xs font-mono text-text-secondary">
                        {value || '(empty)'}
                    </pre>
                </div>
            </div>
        </div>
    );
}
