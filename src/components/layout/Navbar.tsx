'use client';

import Link from 'next/link';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { UserRole, hasRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
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

import { ChromeMode } from '@/hooks/useChromeMode';

interface NavbarProps {
  mode?: ChromeMode;
}

export default function Navbar({ mode = 'app' }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { resetToEntry } = useSessionContext();
  const isAuthLoading = status === 'loading';

  useLayoutEffect(() => {
    setScrolled(window.scrollY > 20);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nav-height', scrolled ? '89px' : '113px');
  }, [scrolled]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-full text-base font-medium transition-all duration-300 border border-transparent ${isActive(path)
      ? 'text-foreground border-b-2 border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-surface-interactive'
    }`;

  const navButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 border border-transparent ${active
      ? 'text-foreground border-b-2 border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-surface-interactive'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-4 py-3 rounded-lg text-lg font-medium transition-colors border-l-2 border-transparent ${isActive(path)
      ? 'text-foreground border-brand-green'
      : 'text-muted-foreground hover:text-foreground hover:bg-surface-interactive'
    }`;

  const isLoggedIn = !!session;
  const effectiveRole = (session?.user?.role as UserRole) || UserRole.USER;
  const originalRole = (session?.originalUser?.role as UserRole) || effectiveRole;
  const isAdmin = hasRole(originalRole, UserRole.ADMIN);
  const isEffectiveAdmin = hasRole(effectiveRole, UserRole.ADMIN);
  const isEditor = hasRole(effectiveRole, UserRole.EDITOR);
  const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user);
  const showSessionMode = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user);
  const showSessionFeatures = showProgress && showSessionMode;
  const showExploreQuickLink = mode === 'gate' && pathname === '/home' && showSessionFeatures;

  const handleLeaveSession = () => {
    setIsAccountMenuOpen(false);
    resetToEntry();
    const destination = showSessionFeatures ? '/explore' : '/learn';
    router.push(destination);
  };

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const isStudioSectionActive = ['/thumbnails', '/gallery', '/clips', '/ai', '/admin/content', '/admin/session-intelligence', '/admin/session-quality', '/admin/friction'].some((path) => isActive(path));
  const isPracticeSectionActive = ['/peralta75', '/assessment'].some((path) => isActive(path));
  const adminDashboardHref = '/admin';

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
              {isAuthLoading ? (
                <div className="w-8 h-8 rounded-full bg-surface-interactive border border-border-subtle animate-pulse" />
              ) : isLoggedIn && session.user?.image ? (
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
                {isAuthLoading ? (
                  <span className="h-5 w-28 rounded bg-white/10 animate-pulse" />
                ) : isLoggedIn ? (
                  <>
                    <span className="text-xl font-bold tracking-tight text-foreground transition-colors font-display">
                      {session.user?.name}
                    </span>
                    {session.user?.role && (
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        {session.user.role}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            </Link>
          </div>

          {pathname !== '/ai' && pathname !== '/explore' && mode !== 'gate' && mode !== 'exit' && (
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-surface-interactive border border-border-subtle backdrop-blur-md' : ''
                }`}>
                {isAuthLoading ? (
                  <div className="h-8 w-72 rounded-full bg-surface-interactive animate-pulse" />
                ) : isLoggedIn && isEditor && !isEffectiveAdmin ? (
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
                    {/* Standard nav for logged-out + logged-in non-editor */}
                    {!isEditor && (
                      <>
                        <Link href="/learn" className={navLinkClass('/learn')}>Learn</Link>
                        {showProgress && (
                          <Link href="/learn/progress" className={navLinkClass('/learn/progress')}>
                            My Progress
                          </Link>
                        )}
                        <div className="relative group">
                          <button type="button" className={navButtonClass(isPracticeSectionActive)}>
                            Practice
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border-subtle bg-surface-ambient/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                            <div className="py-2">
                              <Link href="/peralta75" className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">
                                <span className="block text-foreground font-medium">Peralta 75</span>
                                <span className="block text-xs text-muted-foreground">75 curated LeetCode problems</span>
                              </Link>
                              <Link href="/assessment" className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">
                                <span className="block text-foreground font-medium">Assessment</span>
                                <span className="block text-xs text-muted-foreground">Test your skills on demand</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                        <Link href="/videos" className={navLinkClass('/videos')}>Videos</Link>
                      </>
                    )}
                    {/* Logged-in non-editor: Explore entry only when session features enabled */}
                    {isLoggedIn && !isEditor && showSessionFeatures && (
                      <>
                        <Link href="/home" className={navLinkClass('/home')}>Session</Link>
                        <Link href="/explore" className={navLinkClass('/explore')}>Explore</Link>
                      </>
                    )}
                    {/* Logged-in editor: Explore + Studio */}
                    {isLoggedIn && isEditor && (
                      <>
                        {showSessionFeatures && (
                          <Link href="/explore" className={navLinkClass('/explore')}>Explore</Link>
                        )}
                        {!isEffectiveAdmin && (
                          <div className="relative group">
                            <button type="button" className={navButtonClass(isStudioSectionActive)}>
                              Studio
                              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-border-subtle bg-surface-ambient/95 shadow-xl backdrop-blur-md opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                              <div className="py-2">
                                <Link href="/ai" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">AI Tools</Link>
                                <Link href="/thumbnails" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">Thumbnails</Link>
                                <Link href="/gallery" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">Gallery</Link>
                                <Link href="/clips" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">Clips</Link>
                                <Link href="/admin/content" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive">Learning Content</Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}


          <div className="flex items-center gap-4">
            {isAuthLoading ? (
              <div className="h-9 w-20 bg-white/5 animate-pulse rounded-full"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  {/* Hide proxy controls in restricted modes to reduce noise */}
                  {mode !== 'exit' && <AdminProxyControls />}
                </div>
                {mode === 'exit' || mode === 'gate' ? (
                  <div className="flex items-center gap-2">
                    {isEffectiveAdmin && (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => router.push(adminDashboardHref)}
                        className="min-h-[44px] text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        aria-label="Admin dashboard"
                      >
                        Admin
                      </Button>
                    )}
                    {showExploreQuickLink && (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => router.push('/explore')}
                        className="min-h-[44px] text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        aria-label="Explore"
                      >
                        Explore
                      </Button>
                    )}
                    {pathname !== '/home' && (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={handleLeaveSession}
                        className="min-h-[44px] text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        aria-label={showSessionFeatures ? 'Back to Explore' : 'Back to Learn'}
                      >
                        {showSessionFeatures ? 'Back to Explore' : 'Back to Learn'}
                      </Button>
                    )}
                    <div className="relative" ref={accountMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                        className="h-11 w-11 rounded-lg text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="Open account menu"
                        aria-expanded={isAccountMenuOpen}
                        aria-haspopup="menu"
                      >
                        <svg className="mx-auto h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M4 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm4.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm4.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                        </svg>
                      </button>
                      {isAccountMenuOpen && (
                        <div
                          className="absolute right-0 mt-2 w-44 rounded-xl border border-border-subtle bg-surface-ambient/95 p-1.5 shadow-xl backdrop-blur-md"
                          role="menu"
                          aria-label="Account menu"
                        >
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:text-red-300 hover:bg-red-400/10 transition-colors"
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isEffectiveAdmin && (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => router.push(adminDashboardHref)}
                        className="min-h-[44px] text-text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        aria-label="Admin dashboard"
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={handleSignOut}
                      className="min-h-[44px] text-text-secondary hover:text-red-300 hover:bg-red-400/10 transition-colors"
                      aria-label="Sign out"
                    >
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="md" className="min-h-[44px] text-foreground hover:text-foreground">
                  Login
                </Button>
              </Link>
            )}


            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg text-foreground hover:bg-white/5 transition-colors"
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
        style={{ top: scrolled ? '89px' : '113px' }}
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {isAuthLoading ? (
              <div className="h-8 w-40 rounded bg-white/5 animate-pulse mx-4 my-2" />
            ) : isLoggedIn && isEditor && !isEffectiveAdmin ? (
              <div className="space-y-1">
                <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studio</span>
                <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                <Link href="/admin/content" className={mobileNavLinkClass('/admin/content')} onClick={() => setIsMenuOpen(false)}>Learning Content</Link>
              </div>
            ) : (
              <>
                {/* Standard nav for logged-out + logged-in non-editor */}
                {!isEditor && (
                  <>
                    <Link href="/learn" className={mobileNavLinkClass('/learn')} onClick={() => setIsMenuOpen(false)}>Learn</Link>
                    {showProgress && (
                      <Link href="/learn/progress" className={mobileNavLinkClass('/learn/progress')} onClick={() => setIsMenuOpen(false)}>
                        My Progress
                      </Link>
                    )}
                    <div className="space-y-1 pt-3">
                      <span className="block px-4 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Practice</span>
                      <Link href="/peralta75" className={mobileNavLinkClass('/peralta75')} onClick={() => setIsMenuOpen(false)}>Peralta 75</Link>
                      <Link href="/assessment" className={mobileNavLinkClass('/assessment')} onClick={() => setIsMenuOpen(false)}>Assessment</Link>
                    </div>
                    <Link href="/videos" className={mobileNavLinkClass('/videos')} onClick={() => setIsMenuOpen(false)}>Videos</Link>
                  </>
                )}
                {/* Logged-in non-editor mobile: Explore entry only when session features enabled */}
                {isLoggedIn && !isEditor && showSessionFeatures && (
                  <Link href="/explore" className={mobileNavLinkClass('/explore')} onClick={() => setIsMenuOpen(false)}>Explore</Link>
                )}
                {/* Logged-in editor mobile: Explore + Studio */}
                {isLoggedIn && isEditor && (
                  <>
                    {isEffectiveAdmin && (
                      <Link href={adminDashboardHref} className={mobileNavLinkClass(adminDashboardHref)} onClick={() => setIsMenuOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    {showSessionFeatures && (
                      <Link href="/explore" className={mobileNavLinkClass('/explore')} onClick={() => setIsMenuOpen(false)}>Explore</Link>
                    )}
                    {!isEffectiveAdmin && (
                      <div className="space-y-1 pt-3">
                        <span className="block px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studio</span>
                        <Link href="/ai" className={mobileNavLinkClass('/ai')} onClick={() => setIsMenuOpen(false)}>AI Tools</Link>
                        <Link href="/thumbnails" className={mobileNavLinkClass('/thumbnails')} onClick={() => setIsMenuOpen(false)}>Thumbnails</Link>
                        <Link href="/gallery" className={mobileNavLinkClass('/gallery')} onClick={() => setIsMenuOpen(false)}>Gallery</Link>
                        <Link href="/clips" className={mobileNavLinkClass('/clips')} onClick={() => setIsMenuOpen(false)}>Clips</Link>
                        <Link href="/admin/content" className={mobileNavLinkClass('/admin/content')} onClick={() => setIsMenuOpen(false)}>Learning Content</Link>
                      </div>
                    )}
                  </>
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
