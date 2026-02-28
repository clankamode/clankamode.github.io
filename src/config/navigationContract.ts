export type NavigationAuthLevel = 'public' | 'authenticated' | 'session-feature';

export type NavigationGroup = 'none' | 'primary' | 'practice' | 'session';

export interface NavigationContractEntry {
  id: string;
  href: string;
  label: string;
  description?: string;
  routeFile: string;
  authLevel: NavigationAuthLevel;
  desktopGroup: NavigationGroup;
  mobileGroup: NavigationGroup;
  middlewareMatcher: string | null;
}

export const NAVIGATION_CONTRACT: readonly NavigationContractEntry[] = [
  {
    id: 'learn',
    href: '/learn',
    label: 'Learn',
    routeFile: 'src/app/learn/page.tsx',
    authLevel: 'public',
    desktopGroup: 'primary',
    mobileGroup: 'primary',
    middlewareMatcher: '/learn/:path*',
  },
  {
    id: 'videos',
    href: '/videos',
    label: 'Videos',
    routeFile: 'src/app/videos/page.tsx',
    authLevel: 'public',
    desktopGroup: 'primary',
    mobileGroup: 'primary',
    middlewareMatcher: null,
  },
  {
    id: 'peralta75',
    href: '/peralta75',
    label: 'Peralta 75',
    description: '75 curated LeetCode problems',
    routeFile: 'src/app/peralta75/page.tsx',
    authLevel: 'public',
    desktopGroup: 'practice',
    mobileGroup: 'practice',
    middlewareMatcher: null,
  },
  {
    id: 'assessment',
    href: '/assessment',
    label: 'Assessment',
    description: 'Test your skills on demand',
    routeFile: 'src/app/assessment/page.tsx',
    authLevel: 'public',
    desktopGroup: 'practice',
    mobileGroup: 'practice',
    middlewareMatcher: null,
  },
  {
    id: 'session-home',
    href: '/home',
    label: 'Session',
    routeFile: 'src/app/home/page.tsx',
    authLevel: 'session-feature',
    desktopGroup: 'session',
    mobileGroup: 'none',
    middlewareMatcher: '/home',
  },
  {
    id: 'explore',
    href: '/explore',
    label: 'Explore',
    routeFile: 'src/app/explore/page.tsx',
    authLevel: 'session-feature',
    desktopGroup: 'session',
    mobileGroup: 'session',
    middlewareMatcher: '/explore',
  },
] as const;

function groupByDesktop(group: NavigationGroup): NavigationContractEntry[] {
  return NAVIGATION_CONTRACT.filter((entry) => entry.desktopGroup === group);
}

function groupByMobile(group: NavigationGroup): NavigationContractEntry[] {
  return NAVIGATION_CONTRACT.filter((entry) => entry.mobileGroup === group);
}

export const PUBLIC_PRIMARY_NAV_ITEMS = groupByDesktop('primary');
export const PUBLIC_PRACTICE_NAV_ITEMS = groupByDesktop('practice');
export const SESSION_DESKTOP_NAV_ITEMS = groupByDesktop('session');
export const SESSION_MOBILE_NAV_ITEMS = groupByMobile('session');

export const NAVIGATION_MIDDLEWARE_MATCHERS = Array.from(
  new Set(
    NAVIGATION_CONTRACT.map((entry) => entry.middlewareMatcher).filter(
      (matcher): matcher is string => matcher !== null,
    ),
  ),
);
