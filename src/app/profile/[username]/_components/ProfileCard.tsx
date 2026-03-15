'use client';

import React from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import EditProfileModal from './EditProfileModal';

interface ProfileData {
  username: string;
  bio: string | null;
  avatar_url: string | null;
  leetcode_url: string | null;
  codeforces_url: string | null;
  github_url: string | null;
  weekend_off_enabled?: boolean;
}

interface ProfileCardProps {
  profile: ProfileData;
  currentUserUsername?: string | null;
  progressStats?: {
    streakDays: number;
    overallPercent: number;
    completedArticles: number;
    totalArticles: number;
    articlesRead: number;
  };
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  if (!url || imgError) {
    return (
      <div className="w-24 h-24 rounded-full bg-surface-interactive border-2 border-border-subtle flex items-center justify-center text-4xl font-bold text-foreground">
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className="w-24 h-24 rounded-full border-2 border-border-subtle object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export default function ProfileCard({ profile, currentUserUsername, progressStats }: ProfileCardProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  const isOwnProfile =
    session &&
    (currentUserUsername === localProfile.username ||
      session.user?.email === localProfile.username);

  return (
    <>
      <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar url={localProfile.avatar_url} name={localProfile.username} />
          <div className="min-w-0 w-full">
            <p className="text-sm text-muted-foreground font-mono truncate">@{localProfile.username}</p>
          </div>
          {localProfile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs w-full">{localProfile.bio}</p>
          )}
        </div>

        {progressStats && (
          <div className="rounded-xl border border-border-subtle bg-surface-interactive/70 px-3 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Streak</p>
                <p className="mt-1 text-lg font-semibold leading-none text-text-primary">{progressStats.streakDays}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Overall</p>
                <p className="mt-1 text-lg font-semibold leading-none text-text-primary">{progressStats.overallPercent}%</p>
                <p className="mt-1 font-mono text-[10px] text-text-muted">
                  {progressStats.completedArticles}/{progressStats.totalArticles}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Read</p>
                <p className="mt-1 text-lg font-semibold leading-none text-text-primary">{progressStats.articlesRead}</p>
              </div>
            </div>
          </div>
        )}

        {(localProfile.leetcode_url || localProfile.codeforces_url || localProfile.github_url) && (
          <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 border-t border-border-subtle">
            {localProfile.leetcode_url && (
              <a
                href={localProfile.leetcode_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.396c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.396a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
                </svg>
                LeetCode
              </a>
            )}
            {localProfile.codeforces_url && (
              <a
                href={localProfile.codeforces_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5V19.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V4.5C9 3.672 9.672 3 10.5 3h3zm9 7.5c.828 0 1.5.672 1.5 1.5v9c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V15c0-.828.672-1.5 1.5-1.5h3z" />
                </svg>
                Codeforces
              </a>
            )}
            {localProfile.github_url && (
              <a
                href={localProfile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}
          </div>
        )}

        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-border-subtle text-sm text-muted-foreground hover:text-foreground hover:bg-surface-interactive transition-colors touch-manipulation"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing && (
        <EditProfileModal
          profile={localProfile}
          onClose={() => setIsEditing(false)}
          onSave={(updated) => {
            setLocalProfile((prev) => ({ ...prev, ...updated }));
            setIsEditing(false);
          }}
        />
      )}
    </>
  );
}
