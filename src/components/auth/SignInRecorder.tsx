'use client';

import { useSession } from 'next-auth/react';
import { useRef, useEffect } from 'react';

export function SignInRecorder() {
  const { data: session, status } = useSession();
  const recorded = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email || recorded.current) {
      return;
    }
    recorded.current = true;
    fetch('/api/auth/signin-record', { method: 'POST', credentials: 'include' }).catch(() => {});
  }, [session?.user?.email, status]);

  return null;
}
