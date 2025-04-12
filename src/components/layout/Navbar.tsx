'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const youtubeChannelUrl = "https://www.youtube.com/@jamesperaltaSWE?sub_confirmation=1";
  const { data: session, status } = useSession();

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-[#2cbb5d]/5 backdrop-blur-md fixed w-full z-20 top-0 left-0 border-b border-[#2cbb5d]/20">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo - left side */}
        <div className="flex-shrink-0 mr-4">
          <Link href="/" className="flex items-center">
            <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
              James Peralta
            </span>
          </Link>
        </div>
        
        {/* Navigation - center */}
        <div className="hidden md:flex flex-grow items-center justify-center">
          <div className="flex space-x-8">
            <Link href="/" className={`px-3 py-2 ${isActive('/') ? 'text-[#2cbb5d]' : 'text-white hover:text-[#2cbb5d]'}`}>
              Home
            </Link>
            <Link href="/videos" className={`px-3 py-2 ${isActive('/videos') ? 'text-[#2cbb5d]' : 'text-white hover:text-[#2cbb5d]'}`}>
              Videos
            </Link>
          </div>
        </div>

        {/* Right side - Auth & Subscribe buttons */}
        <div className="flex items-center">
          {status === 'loading' ? (
            <div className="h-10 w-24 bg-gray-700 animate-pulse rounded"></div>
          ) : session ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-block text-sm text-white">
                {session.user?.name}
              </span>
              <button
                onClick={handleSignOut}
                className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-white bg-[#2cbb5d] hover:bg-[#25a24f] px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Login
            </Link>
          )}
          
          <a
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex ml-4 items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Subscribe
          </a>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden focus:outline-none ml-2"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-[#1a1a1a] border-t border-[#3e3e3e]`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            href="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' : 'text-white hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/videos" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/videos') ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' : 'text-white hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Videos
          </Link>
          <a
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center my-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Subscribe
          </a>
        </div>
      </div>
    </nav>
  );
} 