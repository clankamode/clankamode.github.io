import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { UserRole, hasRole } from '@/types/roles';

type AdminDestination = {
  href: string;
  title: string;
  description: string;
  section: 'Dashboard' | 'Session Intelligence' | 'Content' | 'Operations';
};

const ADMIN_DESTINATIONS: AdminDestination[] = [
  {
    href: '/admin/dashboard',
    title: 'Dashboard',
    description: 'User statistics, daily signups, DAU, and user list with role management.',
    section: 'Dashboard',
  },
  {
    href: '/admin/session-intelligence',
    title: 'Session Intelligence',
    description: 'Review quality, friction signals, and AI triage decisions.',
    section: 'Session Intelligence',
  },
  {
    href: '/admin/session-intelligence?tab=friction',
    title: 'Friction Queue',
    description: 'Triage stuck, drift, and fatigue hotspots by track and step.',
    section: 'Session Intelligence',
  },
  {
    href: '/admin/content',
    title: 'Learning Content',
    description: 'Create, edit, and publish lessons and article updates.',
    section: 'Content',
  },
  {
    href: '/ai',
    title: 'AI Tools',
    description: 'Run generation workflows and inspect model-assisted output.',
    section: 'Operations',
  },
  {
    href: '/thumbnails',
    title: 'Thumbnails',
    description: 'Manage image generation jobs and curation.',
    section: 'Operations',
  },
  {
    href: '/gallery',
    title: 'Gallery',
    description: 'Review uploaded assets and visual experiments.',
    section: 'Operations',
  },
  {
    href: '/clips',
    title: 'Clips',
    description: 'Navigate clip workflows and publishing prep.',
    section: 'Operations',
  },
];

const SECTION_ORDER: AdminDestination['section'][] = [
  'Dashboard',
  'Session Intelligence',
  'Content',
  'Operations',
];

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole) || UserRole.USER;

  if (!session || !hasRole(role, UserRole.EDITOR)) {
    redirect('/');
  }

  if (!hasRole(role, UserRole.ADMIN)) {
    redirect('/admin/content');
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Control Center</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            One entry point for all admin workflows. Use this as the default launchpad for observability, content operations, and tooling.
          </p>
        </div>

        <div className="space-y-8">
          {SECTION_ORDER.map((section) => {
            const items = ADMIN_DESTINATIONS.filter((destination) => destination.section === section);
            if (items.length === 0) {
              return null;
            }

            return (
              <section key={section}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-text-muted">{section}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group rounded-2xl border border-border-subtle bg-surface-workbench/60 p-6 transition-colors hover:border-border-interactive hover:bg-surface-workbench"
                    >
                      <p className="text-xl font-semibold text-text-primary transition-colors group-hover:text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
