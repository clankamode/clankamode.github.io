'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/roles';

export default function AdminProxyControls() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [proxyEmail, setProxyEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const originalRole = session?.originalUser?.role;
  const isAdmin = originalRole === UserRole.ADMIN;
  const isProxying = !!session?.proxy?.email;

  useEffect(() => {
    if (session?.proxy?.email) {
      setProxyEmail(session.proxy.email);
    }
  }, [session?.proxy?.email]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    const trimmedEmail = proxyEmail.trim();
    try {
      await update({ proxyEmail: trimmedEmail || null });
      setStatusMessage(
        trimmedEmail
          ? `Now proxying as ${trimmedEmail}`
          : 'Proxy cleared - you are viewing as yourself'
      );
      // Redirect to home page and force a reload to show the correct view for the proxied user
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to update proxy session', error);
      setStatusMessage('Unable to update proxy settings');
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setProxyEmail('');
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      await update({ proxyEmail: null });
      setStatusMessage('Proxy cleared - you are viewing as yourself');
      // Redirect to home page and force a reload to show the admin's normal view
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to clear proxy session', error);
      setStatusMessage('Unable to clear proxy settings');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center space-x-2 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[#2cbb5d]" aria-hidden="true" />
        <span>{isProxying ? 'Proxy active' : 'Proxy user'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-white/10 bg-[#1f1f1f] p-3 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-2 text-base text-white">
            <label className="flex flex-col space-y-1">
              <span className="text-sm uppercase tracking-wide text-white/70">Proxy as user</span>
              <input
                type="email"
                value={proxyEmail}
                onChange={(event) => setProxyEmail(event.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                disabled={isSubmitting}
              />
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#2cbb5d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#24a653] disabled:opacity-70"
              >
                {isProxying ? 'Update proxy' : 'Start proxying'}
              </button>
              {isProxying && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSubmitting}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                >
                  Stop proxy
                </button>
              )}
            </div>
            {session?.proxy?.email && (
              <p className="text-sm text-white/80">
                Viewing as <strong>{session.proxy.email}</strong>
                {session.originalUser?.email && (
                  <span className="text-white/60"> (originally {session.originalUser.email})</span>
                )}
              </p>
            )}
            {statusMessage && <p className="text-sm text-white/70">{statusMessage}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
