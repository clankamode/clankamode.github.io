import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { UserRole, hasRole } from '@/types/roles';
import { getDashboardStats } from '@/lib/admin-dashboard-stats';
import { UsersTable } from './_components/UsersTable';
import { StatsSection } from './_components/StatsSection';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole) || UserRole.USER;

  if (!session || !hasRole(role, UserRole.EDITOR)) {
    redirect('/');
  }

  if (!hasRole(role, UserRole.ADMIN)) {
    redirect('/admin/content');
  }

  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            User statistics and management. Cumulative users, daily signups, daily active users, and user list with role management.
          </p>
        </div>

        <StatsSection stats={stats} />
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-text-muted">Users</h2>
          <div className="mt-4">
            <UsersTable />
          </div>
        </section>
      </div>
    </div>
  );
}
