'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProviders, signIn } from 'next-auth/react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [devEmail, setDevEmail] = useState('clankamode@gmail.com');
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    getProviders()
      .then((providers) => {
        if (!mounted) return;
        setGoogleAuthEnabled(Boolean(providers?.google));
        setDevAuthEnabled(Boolean(providers?.credentials));
      })
      .catch(() => {
        if (!mounted) return;
        setGoogleAuthEnabled(false);
        setDevAuthEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      await signIn('credentials', { email: devEmail, callbackUrl });
    } catch (error) {
      console.error('Dev authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-ambient overflow-hidden">
      {/* Ambient glow — matches hero */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--accent-glow)] blur-[140px] opacity-60" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Brand mark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-baseline gap-1 mb-6">
            <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 bg-clip-text text-transparent">
              JP
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Sign in to track your progress and pick up where you left off.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="space-y-4">
          {googleAuthEnabled && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-[#8E918F] bg-[#131314] px-5 py-3 font-[Roboto,sans-serif] font-medium text-sm text-[#E3E3E3] min-h-[40px] transition-all duration-200 hover:bg-[#1a1a1b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8E918F] border-t-[#E3E3E3]" />
              ) : (
                <>
                  {/* Google "G" — standard brand colors (required) */}
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          )}

          {devAuthEnabled && (
            <>
              {googleAuthEnabled && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              )}

              <form onSubmit={handleDevSignIn} className="space-y-3">
                <div>
                  <label htmlFor="dev-email" className="sr-only">Email</label>
                  <input
                    id="dev-email"
                    type="email"
                    value={devEmail}
                    onChange={(event) => setDevEmail(event.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-surface-interactive px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300 focus:border-border-interactive focus:shadow-[0_0_0_3px_var(--accent-glow)]"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--accent-primary-muted)] hover:shadow-[0_0_24px_var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in…' : 'Sign in (dev)'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-muted-foreground/40">
          Your progress is saved automatically.
        </p>
      </div>
    </div>
  );
}
