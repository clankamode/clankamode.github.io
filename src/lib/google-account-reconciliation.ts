import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export interface ReconciledUser {
  id: number;
  email: string;
  google_id: string | null;
  role: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  leetcode_url: string | null;
  codeforces_url: string | null;
  github_url: string | null;
  weekend_off_enabled: boolean | null;
}

interface UserArticleProgressRow {
  article_id: string;
  completed_at: string;
  created_at: string;
  email: string;
  google_id: string | null;
}

interface UserBadgeRow {
  badge_slug: string;
  earned_at: string;
  email: string;
  google_id: string | null;
}

interface UserConceptStatsRow {
  concept_slug: string;
  track_slug: string;
  exposures: number;
  internalized_count: number;
  last_seen_at: string | null;
  email: string;
  google_id: string | null;
}

interface UserUpdates {
  email?: string;
  google_id?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  github_url?: string | null;
  weekend_off_enabled?: boolean | null;
}

export interface GoogleAccountReconciliationStore {
  findUserByGoogleId(googleId: string): Promise<ReconciledUser | null>;
  findUserByEmail(email: string): Promise<ReconciledUser | null>;
  updateUser(userId: number, updates: UserUpdates): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  listArticleProgress(googleId: string, emails: string[]): Promise<UserArticleProgressRow[]>;
  replaceArticleProgress(
    googleId: string,
    emails: string[],
    rows: UserArticleProgressRow[]
  ): Promise<void>;
  listUserBadges(googleId: string, emails: string[]): Promise<UserBadgeRow[]>;
  replaceUserBadges(googleId: string, emails: string[], rows: UserBadgeRow[]): Promise<void>;
  listUserConceptStats(googleId: string, emails: string[]): Promise<UserConceptStatsRow[]>;
  replaceUserConceptStats(
    googleId: string,
    emails: string[],
    rows: UserConceptStatsRow[]
  ): Promise<void>;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function pickPreferredString(primary: string | null, fallback: string | null): string | null {
  return primary ?? fallback ?? null;
}

function pickPreferredBoolean(primary: boolean | null, fallback: boolean | null): boolean | null {
  return primary ?? fallback ?? null;
}

function buildUserUpdates(
  canonicalUser: ReconciledUser,
  duplicateUser: ReconciledUser | null,
  email: string,
  googleId: string
): UserUpdates {
  return {
    email,
    google_id: googleId,
    username: pickPreferredString(canonicalUser.username, duplicateUser?.username ?? null),
    bio: pickPreferredString(canonicalUser.bio, duplicateUser?.bio ?? null),
    avatar_url: pickPreferredString(canonicalUser.avatar_url, duplicateUser?.avatar_url ?? null),
    leetcode_url: pickPreferredString(canonicalUser.leetcode_url, duplicateUser?.leetcode_url ?? null),
    codeforces_url: pickPreferredString(canonicalUser.codeforces_url, duplicateUser?.codeforces_url ?? null),
    github_url: pickPreferredString(canonicalUser.github_url, duplicateUser?.github_url ?? null),
    weekend_off_enabled: pickPreferredBoolean(
      canonicalUser.weekend_off_enabled,
      duplicateUser?.weekend_off_enabled ?? null
    ),
  };
}

export function mergeArticleProgressRows(
  rows: UserArticleProgressRow[],
  email: string,
  googleId: string
): UserArticleProgressRow[] {
  const merged = new Map<string, UserArticleProgressRow>();

  for (const row of rows) {
    const existing = merged.get(row.article_id);
    if (!existing) {
      merged.set(row.article_id, {
        article_id: row.article_id,
        completed_at: row.completed_at,
        created_at: row.created_at,
        email,
        google_id: googleId,
      });
      continue;
    }

    merged.set(row.article_id, {
      article_id: row.article_id,
      completed_at:
        new Date(existing.completed_at).getTime() >= new Date(row.completed_at).getTime()
          ? existing.completed_at
          : row.completed_at,
      created_at:
        new Date(existing.created_at).getTime() <= new Date(row.created_at).getTime()
          ? existing.created_at
          : row.created_at,
      email,
      google_id: googleId,
    });
  }

  return [...merged.values()];
}

export function mergeUserBadgeRows(
  rows: UserBadgeRow[],
  email: string,
  googleId: string
): UserBadgeRow[] {
  const merged = new Map<string, UserBadgeRow>();

  for (const row of rows) {
    const existing = merged.get(row.badge_slug);
    if (!existing) {
      merged.set(row.badge_slug, { ...row, email, google_id: googleId });
      continue;
    }

    merged.set(row.badge_slug, {
      badge_slug: row.badge_slug,
      earned_at:
        new Date(existing.earned_at).getTime() <= new Date(row.earned_at).getTime()
          ? existing.earned_at
          : row.earned_at,
      email,
      google_id: googleId,
    });
  }

  return [...merged.values()];
}

export function mergeUserConceptStatRows(
  rows: UserConceptStatsRow[],
  email: string,
  googleId: string
): UserConceptStatsRow[] {
  const merged = new Map<string, UserConceptStatsRow>();

  for (const row of rows) {
    const key = `${row.track_slug}::${row.concept_slug}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...row, email, google_id: googleId });
      continue;
    }

    merged.set(key, {
      track_slug: row.track_slug,
      concept_slug: row.concept_slug,
      exposures: existing.exposures + row.exposures,
      internalized_count: existing.internalized_count + row.internalized_count,
      last_seen_at:
        existing.last_seen_at && row.last_seen_at
          ? new Date(existing.last_seen_at).getTime() >= new Date(row.last_seen_at).getTime()
            ? existing.last_seen_at
            : row.last_seen_at
          : existing.last_seen_at ?? row.last_seen_at,
      email,
      google_id: googleId,
    });
  }

  return [...merged.values()];
}

async function reconcileIdentityTables(
  store: GoogleAccountReconciliationStore,
  googleId: string,
  emails: string[],
  canonicalEmail: string
): Promise<void> {
  const [progressRows, badgeRows, conceptStatRows] = await Promise.all([
    store.listArticleProgress(googleId, emails),
    store.listUserBadges(googleId, emails),
    store.listUserConceptStats(googleId, emails),
  ]);

  await Promise.all([
    store.replaceArticleProgress(
      googleId,
      emails,
      mergeArticleProgressRows(progressRows, canonicalEmail, googleId)
    ),
    store.replaceUserBadges(googleId, emails, mergeUserBadgeRows(badgeRows, canonicalEmail, googleId)),
    store.replaceUserConceptStats(
      googleId,
      emails,
      mergeUserConceptStatRows(conceptStatRows, canonicalEmail, googleId)
    ),
  ]);
}

export async function reconcileGoogleAccount(
  store: GoogleAccountReconciliationStore,
  params: { email: string; googleId: string }
): Promise<ReconciledUser | null> {
  const { email, googleId } = params;
  const [googleUser, emailUser] = await Promise.all([
    store.findUserByGoogleId(googleId),
    store.findUserByEmail(email),
  ]);

  if (!googleUser && !emailUser) {
    return null;
  }

  if (!googleUser && emailUser) {
    if (emailUser.google_id !== googleId) {
      await store.updateUser(emailUser.id, { google_id: googleId });
    }
    return { ...emailUser, google_id: googleId };
  }

  const canonicalUser = googleUser!;
  const duplicateUser = emailUser && emailUser.id !== canonicalUser.id ? emailUser : null;
  const allKnownEmails = unique(
    [email, canonicalUser.email, duplicateUser?.email ?? null].filter((value): value is string => Boolean(value))
  );

  if (duplicateUser || canonicalUser.email !== email) {
    await reconcileIdentityTables(store, googleId, allKnownEmails, email);
  }

  if (duplicateUser) {
    await store.deleteUser(duplicateUser.id);
  }

  const userUpdates = buildUserUpdates(canonicalUser, duplicateUser, email, googleId);
  const shouldUpdateUser =
    canonicalUser.email !== userUpdates.email ||
    canonicalUser.google_id !== userUpdates.google_id ||
    canonicalUser.username !== userUpdates.username ||
    canonicalUser.bio !== userUpdates.bio ||
    canonicalUser.avatar_url !== userUpdates.avatar_url ||
    canonicalUser.leetcode_url !== userUpdates.leetcode_url ||
    canonicalUser.codeforces_url !== userUpdates.codeforces_url ||
    canonicalUser.github_url !== userUpdates.github_url ||
    canonicalUser.weekend_off_enabled !== userUpdates.weekend_off_enabled;

  if (shouldUpdateUser) {
    await store.updateUser(canonicalUser.id, userUpdates);
  }

  return {
    ...canonicalUser,
    ...userUpdates,
  };
}

function combineRows<T extends { email: string; google_id: string | null }>(
  rows: T[][]
): T[] {
  const combined = new Map<string, T>();

  for (const rowSet of rows) {
    for (const row of rowSet) {
      const key = JSON.stringify(row);
      if (!combined.has(key)) {
        combined.set(key, row);
      }
    }
  }

  return [...combined.values()];
}

function getGoogleAccountReconciliationStore(): GoogleAccountReconciliationStore {
  const supabase = getSupabaseAdminClient();

  async function queryRows<T extends { email: string; google_id: string | null }>(
    table: 'UserArticleProgress' | 'UserBadges' | 'UserConceptStats',
    select: string,
    googleId: string,
    emails: string[]
  ): Promise<T[]> {
    const queries: Array<Promise<{ data: unknown; error: { message: string } | null }>> = [];

    queries.push(
      (async () =>
        await supabase
          .from(table)
          .select(select)
          .eq('google_id', googleId))()
    );

    if (emails.length > 0) {
      queries.push(
        (async () =>
          await supabase
            .from(table)
            .select(select)
            .in('email', emails))()
      );
    }

    const results = await Promise.all(queries);
    for (const result of results) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    return combineRows(results.map((result) => (result.data as T[] | null) ?? []));
  }

  async function replaceRows<T extends { email: string; google_id: string | null }>(
    table: 'UserArticleProgress' | 'UserBadges' | 'UserConceptStats',
    googleId: string,
    emails: string[],
    rows: T[]
  ): Promise<void> {
    const deleteOperations: Array<Promise<{ error: { message: string } | null }>> = [];

    deleteOperations.push(
      (async () =>
        await supabase
          .from(table)
          .delete()
          .eq('google_id', googleId))()
    );

    if (emails.length > 0) {
      deleteOperations.push(
        (async () =>
          await supabase
            .from(table)
            .delete()
            .in('email', emails))()
      );
    }

    const deleteResults = await Promise.all(deleteOperations);
    for (const result of deleteResults) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    if (rows.length === 0) {
      return;
    }

    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    async findUserByGoogleId(googleId: string) {
      const { data, error } = await supabase
        .from('Users')
        .select('id, email, google_id, role, username, bio, avatar_url, leetcode_url, codeforces_url, github_url, weekend_off_enabled')
        .eq('google_id', googleId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data as ReconciledUser | null;
    },
    async findUserByEmail(email: string) {
      const { data, error } = await supabase
        .from('Users')
        .select('id, email, google_id, role, username, bio, avatar_url, leetcode_url, codeforces_url, github_url, weekend_off_enabled')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data as ReconciledUser | null;
    },
    async updateUser(userId: number, updates: UserUpdates) {
      const { error } = await supabase
        .from('Users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
    },
    async deleteUser(userId: number) {
      const { error } = await supabase
        .from('Users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
    },
    listArticleProgress(googleId: string, emails: string[]) {
      return queryRows<UserArticleProgressRow>(
        'UserArticleProgress',
        'article_id, completed_at, created_at, email, google_id',
        googleId,
        emails
      );
    },
    replaceArticleProgress(googleId: string, emails: string[], rows: UserArticleProgressRow[]) {
      return replaceRows('UserArticleProgress', googleId, emails, rows);
    },
    listUserBadges(googleId: string, emails: string[]) {
      return queryRows<UserBadgeRow>('UserBadges', 'badge_slug, earned_at, email, google_id', googleId, emails);
    },
    replaceUserBadges(googleId: string, emails: string[], rows: UserBadgeRow[]) {
      return replaceRows('UserBadges', googleId, emails, rows);
    },
    listUserConceptStats(googleId: string, emails: string[]) {
      return queryRows<UserConceptStatsRow>(
        'UserConceptStats',
        'concept_slug, track_slug, exposures, internalized_count, last_seen_at, email, google_id',
        googleId,
        emails
      );
    },
    replaceUserConceptStats(googleId: string, emails: string[], rows: UserConceptStatsRow[]) {
      return replaceRows('UserConceptStats', googleId, emails, rows);
    },
  };
}

export async function reconcileGoogleAccountWithSupabase(params: {
  email: string;
  googleId: string;
}): Promise<ReconciledUser | null> {
  return reconcileGoogleAccount(getGoogleAccountReconciliationStore(), params);
}
