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

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#3e3e3e]' : 'bg-[#1a1a1a]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-white">
                James Peralta
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              Home
            </Link>
            <Link
              href="/videos"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/videos')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              Videos
            </Link>
            <Link
              href="/blog"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/blog')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/about')
                  ? 'text-[#2cbb5d]'
                  : 'text-gray-300 hover:text-[#2cbb5d]'
              }`}
            >
              About
            </Link>
          </div>

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

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1a1a1a] border-t border-[#3e3e3e]">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
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
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              isActive('/videos')
                ? 'text-[#2cbb5d] bg-[#2cbb5d]/10'
                : 'text-gray-300 hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Videos
          </Link>
          <Link
            href="/blog"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              isActive('/blog')
                ? 'text-[#2cbb5d] bg-[#2cbb5d]/10'
                : 'text-gray-300 hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            href="/about"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              isActive('/about')
                ? 'text-[#2cbb5d] bg-[#2cbb5d]/10'
                : 'text-gray-300 hover:text-[#2cbb5d] hover:bg-[#2cbb5d]/5'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
} 