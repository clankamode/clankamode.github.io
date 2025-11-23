'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';

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

  const isLoggedIn = !!session;
  const userRole = (session?.user?.role as UserRole) || UserRole.USER;
  const isAdmin = hasRole(userRole, UserRole.ADMIN);
  const isEditor = hasRole(userRole, UserRole.EDITOR);
  return (
    <nav className="bg-[#2cbb5d] backdrop-blur-md fixed w-full z-20 top-0 left-0 border-b border-[#2cbb5d]/20">
      <div className="max-w-screen-xl flex justify-between items-center mx-auto p-2">
        {/* Logo - left side */}
        <div className="flex-shrink-0 justify-self-start">
          <Link href="/" className="flex items-center">
            <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
            {isLoggedIn ? session.user?.name : "James Peralta"}
            </span>
            {isLoggedIn && session.user?.role && (
              <span className="ml-2 mt-1 px-2 py-0.5 rounded text-xs bg-white/20 text-white border border-white/30">
                {session.user.role}
              </span>
            )}
          </Link>
        </div>
        
        {/* Navigation - center */}
        <div className="hidden md:flex items-center justify-center justify-self-center">
          <div className="flex space-x-4">
            <Link href="/" className={`px-3 py-2 ${isActive('/') ? 'text-green-800' : 'text-white hover:text-green-800'}`}>
              Home
            </Link>
            <Link href="/peralta75" className={`px-3 py-2 ${isActive('/peralta75') ? 'text-green-800' : 'text-white hover:text-green-800'}`}>
              Peralta 75
            </Link>
            <Link href="/videos" className={`px-3 py-2 ${isActive('/videos') ? 'text-green-800' : 'text-white hover:text-green-800'}`}>
              Videos
            </Link>
            {isLoggedIn && (isEditor || isAdmin) && (
              <>
                <Link href="/thumbnails" className={`px-3 py-2 ${isActive('/thumbnails') ? 'text-green-800' : 'text-white hover:text-green-800'}`}>
                  Thumbnails
                </Link>
                <Link href="/tools" className={`px-3 py-2 ${isActive('/tools') ? 'text-green-800' : 'text-white hover:text-green-800'}`}>
                  Tools
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right side - Auth & Subscribe buttons */}
        <div className="flex items-center justify-self-end">
          {status === 'loading' ? (
            <div className="h-10 w-24 bg-gray-700 animate-pulse rounded"></div>
          ) : session ? (
            <div className="flex items-center space-x-4">
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
              className="hidden md:flex text-white bg-[#ff7f50] hover:bg-[#ff6347] px-4 py-2 rounded-lg text-sm transition-colors"
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
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden focus:outline-none ml-auto"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <ul className="flex flex-col font-medium border border-[#3e3e3e] rounded-lg bg-[#282828] mt-4">
          <li>
            <Link 
              href="/" 
              className={`block py-2 pl-3 pr-4 rounded ${isActive('/') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              href="/peralta75" 
              className={`block py-2 pl-3 pr-4 rounded ${isActive('/peralta75') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Peralta 75
            </Link>
          </li>
          <li>
            <Link 
              href="/videos" 
              className={`block py-2 pl-3 pr-4 rounded ${isActive('/videos') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Videos
            </Link>
          </li>
          <li>
            <Link 
              href="/mocks" 
              className={`block py-2 pl-3 pr-4 rounded ${isActive('/mocks') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
              onClick={() => setIsMenuOpen(false)}
            >
              Mocks
            </Link>
          </li>
          {isLoggedIn && (isEditor || isAdmin) && (
            <>
              <li>
                <Link 
                  href="/thumbnails" 
                  className={`block py-2 pl-3 pr-4 rounded ${isActive('/thumbnails') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Thumbnails
                </Link>
              </li>
              <li>
                <Link 
                  href="/tools" 
                  className={`block py-2 pl-3 pr-4 rounded ${isActive('/tools') ? 'text-[#2cbb5d] bg-[#2cbb5d]/20' : 'text-white'} hover:text-[#2cbb5d]`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tools
                </Link>
              </li>
            </>
          )}
          {!isLoggedIn && (
            <li>
              <a 
                href="/login" 
                className="block py-2 pl-3 pr-4 text-white rounded bg-[#ff7f50] hover:bg-[#ff6347]"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </a>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
} 