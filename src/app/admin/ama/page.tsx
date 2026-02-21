import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { UserRole, hasRole } from '@/types/roles';
import { AmaAdminTable } from './_components/AmaAdminTable';

export const dynamic = 'force-dynamic';

export default async function AdminAmaPage() {
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
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">AMA Questions</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            View, filter, and answer audience questions. Questions are ranked by upvotes.
          </p>
        </div>
        <AmaAdminTable />
      </div>
    </div>
  );
}
