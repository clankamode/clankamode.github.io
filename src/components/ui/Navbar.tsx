import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Check if the current path matches the link path
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#3e3e3e]' : 'bg-[#1a1a1a]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">
                Coding Interviews
              </span>
            </Link>
          </div>

          {/* Desktop navigation - centered */}
          <div className="flex-1 hidden md:flex items-center justify-center space-x-8">
            <Link
              href="/"
              className={`text-lg font-medium transition-colors duration-200 ${
                isActive('/')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              Home
            </Link>
            <Link
              href="/videos"
              className={`text-lg font-medium transition-colors duration-200 ${
                isActive('/videos')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              Videos
            </Link>
          </div>
          
          {/* Right section with Subscribe button */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            {/* Subscribe button */}
            <a
              href={`https://www.youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}?sub_confirmation=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              Subscribe
            </a>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-[#2cbb5d] focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1a1a1a] border-t border-[#3e3e3e]">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
              isActive('/')
                ? 'text-[#2cbb5d] bg-[#2cbb5d]/10'
                : 'text-gray-300 hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/videos"
            className={`block px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
              isActive('/videos')
                ? 'text-[#2cbb5d] bg-[#2cbb5d]/10'
                : 'text-gray-300 hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Videos
          </Link>
          <a
            href={`https://www.youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-md text-lg font-medium text-white bg-blue-600 my-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Subscribe
          </a>
        </div>
      </div>
    </nav>
  );
} 