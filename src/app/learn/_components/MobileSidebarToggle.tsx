'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileSidebarToggleProps {
  title: string;
  children: ReactNode;
}

export default function MobileSidebarToggle({ title, children }: MobileSidebarToggleProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-dense px-3 py-2 text-sm text-text-primary"
        onClick={() => setOpen(true)}
      >
        <span className="text-text-muted">Browse</span>
        <span>{title}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute left-0 top-0 h-full w-[85%] max-w-xs border-r border-border-subtle',
              'bg-surface-ambient px-5 pb-6 pt-20'
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <button
                type="button"
                className="text-text-muted hover:text-text-primary"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
