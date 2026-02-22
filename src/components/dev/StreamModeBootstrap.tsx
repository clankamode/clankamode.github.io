'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { initStreamMode, destroyStreamMode } from '@/stream-mode';
import { UserRole } from '@/types/roles';

export default function StreamModeBootstrap() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;
    const role = session.user?.role as UserRole | undefined;
    if (role !== UserRole.ADMIN) return;
    initStreamMode();
    return () => destroyStreamMode();
  }, [session]);

  return null;
}
