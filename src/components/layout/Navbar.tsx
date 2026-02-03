'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import AdminProxyControls from '../auth/AdminProxyControls';
import { Button } from '@/components/ui/Button';

function UserAvatar({ src, name }: { src: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (imgError || !src) {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-interactive border border-border-subtle flex items-center justify-center text-foreground font-bold text-sm">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="w-8 h-8 rounded-full bg-surface-interactive border border-border-subtle animate-pulse" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className={`w-8 h-8 rounded-full border border-border-subtle shadow-sm ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
}

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

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nav-height-initial', '113px');
    root.style.setProperty('--nav-height-scrolled', '89px');
    root.style.setProperty('--nav-height', scrolled ? '89px' : '113px');
  }, [scrolled]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-full text-base font-medium transition-all duration-300 border border-transparent ${isActive(path)
      ? 'text-foreground border-b-2 border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  const navButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 border border-transparent ${active
      ? 'text-foreground border-b-2 border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-4 py-3 rounded-lg text-lg font-medium transition-colors border-l-2 border-transparent ${isActive(path)
      ? 'text-foreground border-brand-green'
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
  const isEditor = hasRole(effectiveRole, UserRole.EDITOR);
  const isEditorSectionActive = ['/thumbnails', '/gallery', '/clips', '/ai', '/admin/content'].some((path) => isActive(path));
  const isPracticeSectionActive = ['/peralta75', '/assessment'].some((path) => isActive(path));

  if (pathname === '/ai') {
    return null;
  }

  return (
    <>
      <nav
        className={`fixed w-full z-50 top-0 left-0 transition-all duration-500 border-b ${scrolled || isMenuOpen
          ? 'bg-surface-ambient/80 backdrop-blur-xl border-border-subtle py-3'
          : 'bg-transparent border-transparent py-5'
          }`}
      >
        <div className="max-w-screen-xl mx-auto px-6 flex justify-between items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              {isLoggedIn && session.user?.image ? (
                <UserAvatar
                  src={session.user.image}
                  name={session.user.name || "User"}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-interactive border border-border-subtle flex items-center justify-center text-foreground font-bold text-sm">
                  J
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground transition-colors font-display">
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

          {!['/ai', '/admin'].some(path => pathname.startsWith(path)) && (
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-white/5 border border-border-subtle backdrop-blur-md' : ''
                }`}>
                {isLoggedIn && isEditor && !isEffectiveAdmin ? (
                  <>
                    <Link href="/admin/content" className={navLinkClass('/admin/content')}>
                      Content
                    </Link>
                    <Link href="/ai" className={navLinkClass('/ai')}>
                      AI Tools
                    </Link>
                    <Link href="/thumbnails" className={navLinkClass('/thumbnails')}>
                      Thumbnails
                    </Link>
                    <Link href="/gallery" className={navLinkClass('/gallery')}>
                      Gallery
                    </Link>
                    <Link href="/clips" className={navLinkClass('/clips')}>
                      Clips
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/learn" className={navLinkClass('/learn')}>Learn</Link>
                    <div className="relative group">
                      <button type="button" className={navButtonClass(isPracticeSectionActive)}>
                        Practice
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border-subtle bg-surface-ambient/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                        <div className="py-2">
                          <Link href="/peralta75" className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
                            <span className="block text-foreground font-medium">Peralta 75</span>
                            <span className="block text-xs text-muted-foreground">75 curated LeetCode problems</span>
                          </Link>
                          <Link href="/assessment" className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
                            <span className="block text-foreground font-medium">Assessment</span>
                            <span className="block text-xs text-muted-foreground">Test your skills on demand</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <Link href="/videos" className={navLinkClass('/videos')}>Videos</Link>
                    {isLoggedIn && isEditor && (
                      <div className="relative group">
                        <button type="button" className={navButtonClass(isEditorSectionActive)}>
                          Editor
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-border-subtle bg-surface-ambient/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                          <div className="py-2">
                            <Link href="/ai" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">AI Tools</Link>
                            <Link href="/thumbnails" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Thumbnails</Link>
                            <Link href="/gallery" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Gallery</Link>
                            <Link href="/clips" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Clips</Link>
                            <Link href="/admin/content" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">Learning Content</Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}


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
                  className="text-muted-foreground/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Login
                </Button>
              </Link>
            )}


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


      <div
        className={`fixed inset-0 z-40 bg-surface-ambient/95 backdrop-blur-2xl transition-transform duration-500 md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ top: '60px' }}
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {isLoggedIn && isEditor && !isEffectiveAdmin ? (
              <div className="space-y-1">
                <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor</span>
                <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                <Link href="/admin/content" className={mobileNavLinkClass('/admin/content')} onClick={() => setIsMenuOpen(false)}>Learning Content</Link>
              </div>
            ) : (
              <>
                <Link href="/learn" className={mobileNavLinkClass('/learn')} onClick={() => setIsMenuOpen(false)}>Learn</Link>
                <div className="space-y-1 pt-3">
                  <span className="block px-4 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Practice</span>
                  <Link href="/peralta75" className={mobileNavLinkClass('/peralta75')} onClick={() => setIsMenuOpen(false)}>Peralta 75</Link>
                  <Link href="/assessment" className={mobileNavLinkClass('/assessment')} onClick={() => setIsMenuOpen(false)}>Assessment</Link>
                </div>
                <Link href="/videos" className={mobileNavLinkClass('/videos')} onClick={() => setIsMenuOpen(false)}>Videos</Link>
                {isLoggedIn && isEditor && (
                  <div className="space-y-1">
                    <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor</span>
                    <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                    <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                    <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                    <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                    <Link href="/admin/content" className={mobileNavLinkClass('/admin/content')} onClick={() => setIsMenuOpen(false)}>Learning Content</Link>
                  </div>
                )}
              </>
            )}
          </div>

          {isLoggedIn && isAdmin && (
            <div className="pt-6 border-t border-border-subtle">
              <AdminProxyControls />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
