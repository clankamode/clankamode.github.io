'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import AdminProxyControls from '../auth/AdminProxyControls';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-full text-base font-medium transition-all duration-300 ${isActive(path)
      ? 'bg-brand-green/10 text-brand-green shadow-[0_0_10px_-2px_rgba(44,187,93,0.3)] border border-brand-green/20'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  const navButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${active
      ? 'bg-brand-green/10 text-brand-green shadow-[0_0_10px_-2px_rgba(44,187,93,0.3)] border border-brand-green/20'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${isActive(path)
      ? 'bg-brand-green/10 text-brand-green border-l-2 border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isLoggedIn = !!session;
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const originalRole = (session?.originalUser?.role as UserRole) || effectiveRole;
  const isAdmin = hasRole(originalRole, UserRole.ADMIN);
  const isEffectiveAdmin = hasRole(effectiveRole, UserRole.ADMIN);
  const isEditor = effectiveRole === UserRole.EDITOR;
  const isEditorSectionActive = ['/thumbnails', '/gallery', '/clips', '/ai'].some((path) => isActive(path));

  return (
    <>
      <nav
        className={`fixed w-full z-50 top-0 left-0 transition-all duration-500 border-b ${scrolled || isMenuOpen
            ? 'bg-background/80 backdrop-blur-xl border-white/5 py-3'
            : 'bg-transparent border-transparent py-5'
          }`}
      >
        <div className="max-w-screen-xl mx-auto px-6 flex justify-between items-center">
          {/* Logo - left side */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              {isLoggedIn && session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-9 h-9 rounded-full border border-white/10 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_-3px_rgba(44,187,93,0.4)]">
                  J
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-brand-green transition-colors font-display">
                  {isLoggedIn ? session.user?.name : "James Peralta"}
                </span>
                {isLoggedIn && session.user?.role && (
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {session.user.role}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Navigation - center (Floating Pill) */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-white/5 border border-white/5 backdrop-blur-md' : ''
              }`}>
              {/* Editors only see Editor dropdown with AI and Thumbnails tabs */}
              {isLoggedIn && isEditor ? (
                <>
                  <div className="relative group">
                    <button type="button" className={navButtonClass(isEditorSectionActive)}>
                      Editor
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-background/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                      <div className="py-2">
                        <Link href="/ai" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">AI Tools</Link>
                        <Link href="/thumbnails" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Thumbnails</Link>
                        <Link href="/gallery" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Gallery</Link>
                        <Link href="/clips" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Clips</Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/" className={navLinkClass('/')}>Home</Link>
                  <Link href="/videos" className={navLinkClass('/videos')}>Videos</Link>
                  <Link href="/peralta75" className={navLinkClass('/peralta75')}>Peralta 75</Link>
                  <Link href="/assessment" className={navLinkClass('/assessment')}>Assessment</Link>
                  {isLoggedIn && isEffectiveAdmin && (
                    <>
                      <div className="relative group">
                        <button type="button" className={navButtonClass(isEditorSectionActive)}>
                          Editor
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-background/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                          <div className="py-2">
                            <Link href="/ai" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">AI Tools</Link>
                            <Link href="/thumbnails" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Thumbnails</Link>
                            <Link href="/gallery" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Gallery</Link>
                            <Link href="/clips" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Clips</Link>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right side - Auth & Subscribe buttons */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-9 w-20 bg-white/5 animate-pulse rounded-full"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <AdminProxyControls />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-brand-green">
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-white/5 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl transition-transform duration-500 md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ top: '60px' }}
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {isLoggedIn && isEditor ? (
              <>
                <div className="space-y-1">
                  <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor</span>
                  <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                  <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                  <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                  <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className={mobileNavLinkClass('/')} onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link href="/videos" className={mobileNavLinkClass('/videos')} onClick={() => setIsMenuOpen(false)}>Videos</Link>
                <Link href="/peralta75" className={mobileNavLinkClass('/peralta75')} onClick={() => setIsMenuOpen(false)}>Peralta 75</Link>
                <Link href="/assessment" className={mobileNavLinkClass('/assessment')} onClick={() => setIsMenuOpen(false)}>Assessment</Link>
                {isLoggedIn && isEffectiveAdmin && (
                  <>
                    <div className="space-y-1">
                      <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor</span>
                      <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                      <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                      <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                      <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {isLoggedIn && isAdmin && (
            <div className="pt-6 border-t border-border">
              <AdminProxyControls />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
