'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  username: string;
  bio: string | null;
  avatar_url: string | null;
  leetcode_url: string | null;
  codeforces_url: string | null;
  github_url: string | null;
}

interface EditProfileModalProps {
  profile: ProfileData;
  onClose: () => void;
  onSave: (updated: Partial<ProfileData>) => void;
}

function validateForm(form: {
  username: string;
  bio: string;
  leetcode_url: string;
  codeforces_url: string;
  github_url: string;
}): string | null {
  const { username } = form;
  if (!username) return 'Username cannot be empty';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 32) return 'Username must be 32 characters or fewer';
  if (!/^[A-Za-z0-9]/.test(username)) return 'Username must start with a letter or number';
  if (!/^[A-Za-z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, _ and -';
  if (/[_-]{2}/.test(username)) return 'Username cannot have consecutive special characters';
  if (/[_-]$/.test(username)) return 'Username cannot end with _ or -';

  if (form.bio.length > 300) return 'Bio must be 300 characters or fewer';

  if (form.github_url && !form.github_url.startsWith('https://github.com/'))
    return 'GitHub URL must start with https://github.com/';
  if (form.leetcode_url && !form.leetcode_url.startsWith('https://leetcode.com/'))
    return 'LeetCode URL must start with https://leetcode.com/';
  if (form.codeforces_url && !form.codeforces_url.startsWith('https://codeforces.com/'))
    return 'Codeforces URL must start with https://codeforces.com/';

  return null;
}

export default function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    username: profile.username ?? '',
    bio: profile.bio ?? '',
    leetcode_url: profile.leetcode_url ?? '',
    codeforces_url: profile.codeforces_url ?? '',
    github_url: profile.github_url ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save');
        return;
      }
      const updated = await res.json();
      onSave(updated);
      if (form.username !== profile.username) {
        await update();
        router.push('/profile/' + updated.username);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-surface-ambient border border-border-subtle rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[90vh] min-h-[50vh] sm:min-h-0">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden px-4 sm:px-6 space-y-3 flex-1 min-h-0">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <span className={`text-xs ${form.username.length > 32 ? 'text-red-400' : 'text-muted-foreground/50'}`}>
                {form.username.length}/32
              </span>
            </div>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="yourname"
              maxLength={32}
              className="w-full bg-surface-interactive border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50"
            />
            <p className="text-xs text-muted-foreground/50 mt-1">
              3–32 chars · letters, numbers, _ and - · must start with letter or number
            </p>
          </div>

          {/* URL fields */}
          {([
            { label: 'GitHub URL', key: 'github_url' as const, placeholder: 'https://github.com/yourname' },
            { label: 'LeetCode URL', key: 'leetcode_url' as const, placeholder: 'https://leetcode.com/u/yourname' },
            { label: 'Codeforces URL', key: 'codeforces_url' as const, placeholder: 'https://codeforces.com/profile/yourname' },
          ] as const).map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <input
                type="url"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-surface-interactive border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50"
              />
            </div>
          ))}

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <span className={`text-xs ${form.bio.length > 300 ? 'text-red-400' : 'text-muted-foreground/50'}`}>
                {form.bio.length}/300
              </span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={300}
              className="w-full bg-surface-interactive border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 sm:p-6 pt-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border-subtle text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-green/90 hover:bg-brand-green text-background text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
