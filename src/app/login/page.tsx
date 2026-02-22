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
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-ambient p-4">
      <div className="frame w-full max-w-md space-y-8 bg-surface-workbench p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Sign in with Google to save your progress and pick up right where you left off.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {googleAuthEnabled && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:outline-none disabled:opacity-70"
            >
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          )}

          {devAuthEnabled && (
            <form onSubmit={handleDevSignIn} className="space-y-3 rounded-md border border-border-subtle p-4">
              <p className="text-sm font-medium text-foreground">Local Dev Login</p>
              <input
                type="email"
                value={devEmail}
                onChange={(event) => setDevEmail(event.target.value)}
                className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-border-interactive"
                placeholder="you@example.com"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-70"
              >
                {isLoading ? 'Signing in...' : 'Sign in for local development'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
