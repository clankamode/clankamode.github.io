'use client';

import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type SeparatorProps,
} from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export function ResizablePanelGroup({ className, ...props }: GroupProps) {
  return (
    <Group
      className={cn('flex h-full w-full', className)}
      {...props}
    />
  );
}

export const ResizablePanel = Panel;

export function ResizableHandle({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      className={cn(
        'relative flex w-[2px] items-center justify-center bg-border-subtle transition-colors hover:bg-brand-green/60 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}
