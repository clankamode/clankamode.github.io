'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#3e3e3e] bg-[#282828] p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-base text-gray-400">
            Please sign in to access your account
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#4285F4] px-4 py-3 text-white hover:bg-[#3367D6] focus:outline-none disabled:opacity-70"
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
        </div>
      </div>
    </div>
  );
} 