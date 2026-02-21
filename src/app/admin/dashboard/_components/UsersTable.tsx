'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/types/roles';

interface UserRow {
  id: number;
  email: string;
  username: string | null;
  role: string;
  created_at: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
}

interface PendingRoleChange {
  userId: number;
  email: string;
  newRole: string;
}

const LIMIT = 20;
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All roles' },
  ...Object.values(UserRole).map((r) => ({ value: r, label: r })),
];

const SEARCH_DEBOUNCE_MS = 300;

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (roleFilter) params.set('role', roleFilter);
    if (searchQuery) params.set('search', searchQuery);
    const res = await fetch(`/api/admin/users?${params}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const json: UsersResponse = await res.json();
    setData(json);
    setLoading(false);
  }, [page, roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setUpdatingId(null);
    if (res.ok) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        };
      });
    }
    setPendingRoleChange(null);
  }, []);

  const onRoleSelectChange = (user: UserRow, newRole: string) => {
    if (newRole === user.role) return;
    setPendingRoleChange({ userId: user.id, email: user.email, newRole });
  };

  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    handleRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-8 text-center text-text-muted">
        Loading users…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-8 text-center text-text-secondary">
        Failed to load users.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-border-subtle p-4">
        <input
          type="search"
          placeholder="Search email or username…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-lg border border-border-subtle bg-surface-dense px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border-interactive w-56"
          aria-label="Search users by email or username"
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          Role
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface-dense px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-interactive"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-text-muted">
          {data.total} user{data.total !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-dense/80 text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id} className="border-b border-border-subtle/60 hover:bg-surface-dense/40 transition-colors">
                <td className="px-4 py-3 text-text-primary">{user.email}</td>
                <td className="px-4 py-3 text-text-secondary">{user.username ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={updatingId === user.id}
                    onChange={(e) => onRoleSelectChange(user, e.target.value)}
                    className="rounded border border-border-subtle bg-surface-dense px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-border-interactive disabled:opacity-50"
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-interactive hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-interactive hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            Next
          </button>
        </div>
      )}

      {pendingRoleChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-role-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-workbench p-6 shadow-xl">
            <h2 id="confirm-role-title" className="text-lg font-semibold text-text-primary">
              Change role?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Change <span className="font-medium text-text-primary">{pendingRoleChange.email}</span> to{' '}
              <span className="font-medium text-text-primary">{pendingRoleChange.newRole}</span>.
              {pendingRoleChange.newRole === UserRole.ADMIN && (
                <> They will have full access to the admin dashboard and user management.</>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-interactive hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                className="rounded-lg bg-[#2cbb5d] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a42]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
