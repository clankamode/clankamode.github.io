'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const youtubeChannelUrl = "https://www.youtube.com/@jamesperaltaSWE?sub_confirmation=1";

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#2cbb5d]/5 backdrop-blur-md fixed w-full z-20 top-0 left-0 border-b border-[#2cbb5d]/20">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo - left side */}
        <div className="flex-1">
          <Link href="/" className="flex items-center">
            <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
              James Peralta
            </span>
          </Link>
        </div>
        
        {/* Navigation - center */}
        <div className="flex-1 hidden md:flex justify-center">
          <ul className="flex flex-row space-x-8">
            <li>
              <Link 
                href="/" 
                className={`block py-2 pl-3 pr-4 rounded md:bg-transparent md:p-0 ${
                  isActive('/') 
                    ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' 
                    : 'text-gray-200 hover:text-[#2cbb5d] transition-colors duration-300'
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/videos" 
                className={`block py-2 pl-3 pr-4 rounded md:bg-transparent md:p-0 ${
                  isActive('/videos') 
                    ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' 
                    : 'text-gray-200 hover:text-[#2cbb5d] transition-colors duration-300'
                }`}
              >
                Videos
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Mobile menu button - right side */}
        <div className="flex-1 flex justify-end md:order-2">
          <a 
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-white bg-[#2cbb5d] hover:bg-[#28a754] focus:ring-4 focus:outline-none focus:ring-[#2cbb5d]/50 font-medium rounded-lg text-sm px-4 py-2 text-center mr-3"
          >
            Subscribe
          </a>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-200 rounded-lg md:hidden hover:bg-[#2cbb5d]/10 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]/50"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>
        
        {/* Mobile menu */}
        <div className={`items-center justify-between w-full md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium rounded-lg bg-[#2cbb5d]/5 backdrop-blur-md">
            <li>
              <Link 
                href="/" 
                className={`block py-2 pl-3 pr-4 rounded md:bg-transparent md:p-0 ${
                  isActive('/') 
                    ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' 
                    : 'text-gray-200 hover:text-[#2cbb5d] transition-colors duration-300'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/videos" 
                className={`block py-2 pl-3 pr-4 rounded md:bg-transparent md:p-0 ${
                  isActive('/videos') 
                    ? 'text-[#2cbb5d] bg-[#2cbb5d]/10' 
                    : 'text-gray-200 hover:text-[#2cbb5d] transition-colors duration-300'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Videos
              </Link>
            </li>
            <li className="mt-3 md:hidden">
              <a 
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-white bg-[#2cbb5d] hover:bg-[#28a754] focus:ring-4 focus:outline-none focus:ring-[#2cbb5d]/50 font-medium rounded-lg text-sm px-4 py-2 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscribe to YouTube
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
} 