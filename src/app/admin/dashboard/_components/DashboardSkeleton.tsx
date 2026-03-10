import React from 'react';

export function UsersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-workbench/60 animate-pulse">
      <div className="flex flex-wrap items-center gap-4 border-b border-border-subtle p-4">
        <div className="h-9 w-56 rounded-lg bg-surface-dense" />
        <div className="h-9 w-36 rounded-lg bg-surface-dense" />
        <div className="h-5 w-24 rounded bg-surface-dense" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-dense/80 text-left">
              <th className="px-4 py-3 font-medium text-text-muted">Email</th>
              <th className="px-4 py-3 font-medium text-text-muted">Username</th>
              <th className="px-4 py-3 font-medium text-text-muted">Role</th>
              <th className="px-4 py-3 font-medium text-text-muted">Created</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-border-subtle/60">
                <td className="px-4 py-3">
                  <div className="h-5 w-48 rounded bg-surface-dense" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-24 rounded bg-surface-dense" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-8 w-24 rounded bg-surface-dense" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-28 rounded bg-surface-dense" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartSkeleton({ title, showControls = false }: { title: string; showControls?: boolean }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {showControls && (
          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-7 w-16 rounded-lg bg-surface-dense" />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 h-64 rounded-xl bg-surface-dense" />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl animate-pulse px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <div className="mt-3 space-y-2">
            <div className="h-5 w-full max-w-3xl rounded bg-surface-interactive" />
            <div className="h-5 w-4/5 rounded bg-surface-interactive" />
          </div>
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-text-muted">Statistics</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-6">
                <div className="h-4 w-40 rounded bg-surface-interactive" />
                <div className="mt-3 h-9 w-28 rounded bg-surface-interactive" />
                {index > 0 && <div className="mt-2 h-3 w-24 rounded bg-surface-interactive" />}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <ChartSkeleton title="Cumulative users" showControls />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ChartSkeleton title="Signups by day" />
            <ChartSkeleton title="Daily active users by day" />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-text-muted">Users</h2>
          <div className="mt-4">
            <UsersTableSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}
