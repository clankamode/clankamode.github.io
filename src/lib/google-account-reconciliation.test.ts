import { describe, expect, test } from 'vitest';
import {
  mergeArticleProgressRows,
  mergeUserBadgeRows,
  mergeUserConceptStatRows,
  mergeUserQuestionSubmissionRows,
  reconcileGoogleAccount,
  type GoogleAccountReconciliationStore,
  type ReconciledUser,
} from '@/lib/google-account-reconciliation';

interface TestState {
  users: ReconciledUser[];
  articleProgress: Array<{
    article_id: string;
    completed_at: string;
    created_at: string;
    email: string;
    google_id: string | null;
  }>;
  userBadges: Array<{
    badge_slug: string;
    earned_at: string;
    email: string;
    google_id: string | null;
  }>;
  userQuestionSubmissions: Array<{
    id: string;
    question_id: string;
    solved: boolean;
    source_code: string | null;
    created_at: string;
    updated_at: string;
    email: string;
    google_id: string | null;
  }>;
  userConceptStats: Array<{
    concept_slug: string;
    track_slug: string;
    exposures: number;
    internalized_count: number;
    last_seen_at: string | null;
    email: string;
    google_id: string | null;
  }>;
}

function createStore(
  state: TestState,
  options?: { failAtomicReplace?: boolean }
): GoogleAccountReconciliationStore {
  const matchesIdentity = (row: { email: string; google_id: string | null }, googleId: string, emails: string[]) =>
    row.google_id === googleId || emails.includes(row.email);

  return {
    async findUserByGoogleId(googleId) {
      return state.users.find((user) => user.google_id === googleId) ?? null;
    },
    async findUserByEmail(email) {
      return state.users.find((user) => user.email === email) ?? null;
    },
    async updateUser(userId, updates) {
      state.users = state.users.map((user) => (user.id === userId ? { ...user, ...updates } : user));
    },
    async deleteUser(userId) {
      state.users = state.users.filter((user) => user.id !== userId);
    },
    async listArticleProgress(googleId, emails) {
      return state.articleProgress.filter((row) => matchesIdentity(row, googleId, emails));
    },
    async listUserBadges(googleId, emails) {
      return state.userBadges.filter((row) => matchesIdentity(row, googleId, emails));
    },
    async listUserQuestionSubmissions(googleId, emails) {
      return state.userQuestionSubmissions.filter((row) => matchesIdentity(row, googleId, emails));
    },
    async listUserConceptStats(googleId, emails) {
      return state.userConceptStats.filter((row) => matchesIdentity(row, googleId, emails));
    },
    async replaceIdentityRows(googleId, emails, rows) {
      if (options?.failAtomicReplace) {
        throw new Error('atomic replace failed');
      }

      state.articleProgress = [
        ...state.articleProgress.filter((row) => !matchesIdentity(row, googleId, emails)),
        ...rows.articleProgress,
      ];
      state.userBadges = [
        ...state.userBadges.filter((row) => !matchesIdentity(row, googleId, emails)),
        ...rows.userBadges,
      ];
      state.userQuestionSubmissions = [
        ...state.userQuestionSubmissions.filter((row) => !matchesIdentity(row, googleId, emails)),
        ...rows.userQuestionSubmissions,
      ];
      state.userConceptStats = [
        ...state.userConceptStats.filter((row) => !matchesIdentity(row, googleId, emails)),
        ...rows.userConceptStats,
      ];
    },
  };
}

describe('google account reconciliation merges', () => {
  test('mergeArticleProgressRows keeps one row per article and preserves timestamps', () => {
    const merged = mergeArticleProgressRows(
      [
        {
          article_id: 'article-1',
          completed_at: '2026-03-10T10:00:00.000Z',
          created_at: '2026-03-01T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          article_id: 'article-1',
          completed_at: '2026-03-12T10:00:00.000Z',
          created_at: '2026-03-05T10:00:00.000Z',
          email: 'new@example.com',
          google_id: 'gid-1',
        },
      ],
      'new@example.com',
      'gid-1'
    );

    expect(merged).toEqual([
      {
        article_id: 'article-1',
        completed_at: '2026-03-12T10:00:00.000Z',
        created_at: '2026-03-01T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);
  });

  test('mergeUserBadgeRows keeps the earliest earned timestamp', () => {
    const merged = mergeUserBadgeRows(
      [
        {
          badge_slug: 'bookworm',
          earned_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          badge_slug: 'bookworm',
          earned_at: '2026-03-11T10:00:00.000Z',
          email: 'new@example.com',
          google_id: 'gid-1',
        },
      ],
      'new@example.com',
      'gid-1'
    );

    expect(merged).toEqual([
      {
        badge_slug: 'bookworm',
        earned_at: '2026-03-09T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);
  });

  test('mergeUserConceptStatRows sums counters and keeps the latest last_seen_at', () => {
    const merged = mergeUserConceptStatRows(
      [
        {
          concept_slug: 'arrays',
          track_slug: 'dsa',
          exposures: 2,
          internalized_count: 1,
          last_seen_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          concept_slug: 'arrays',
          track_slug: 'dsa',
          exposures: 3,
          internalized_count: 0,
          last_seen_at: '2026-03-12T10:00:00.000Z',
          email: 'new@example.com',
          google_id: 'gid-1',
        },
      ],
      'new@example.com',
      'gid-1'
    );

    expect(merged).toEqual([
      {
        concept_slug: 'arrays',
        track_slug: 'dsa',
        exposures: 5,
        internalized_count: 1,
        last_seen_at: '2026-03-12T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);
  });

  test('mergeUserQuestionSubmissionRows preserves solved history and latest source code', () => {
    const merged = mergeUserQuestionSubmissionRows(
      [
        {
          id: 'sub-1',
          question_id: 'question-1',
          solved: false,
          source_code: 'old code',
          created_at: '2026-03-01T10:00:00.000Z',
          updated_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          id: 'sub-2',
          question_id: 'question-1',
          solved: true,
          source_code: 'new code',
          created_at: '2026-03-05T10:00:00.000Z',
          updated_at: '2026-03-12T10:00:00.000Z',
          email: 'new@example.com',
          google_id: null,
        },
      ],
      'new@example.com',
      'gid-1'
    );

    expect(merged).toEqual([
      {
        id: 'sub-2',
        question_id: 'question-1',
        solved: true,
        source_code: 'new code',
        created_at: '2026-03-01T10:00:00.000Z',
        updated_at: '2026-03-12T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);
  });
});

describe('reconcileGoogleAccount', () => {
  test('rekeys duplicate email-change rows onto the stable google_id user', async () => {
    const state: TestState = {
      users: [
        {
          id: 1,
          email: 'old@example.com',
          google_id: 'gid-1',
          role: 'USER',
          username: 'alice',
          bio: null,
          avatar_url: null,
          leetcode_url: null,
          codeforces_url: null,
          github_url: null,
          weekend_off_enabled: null,
        },
        {
          id: 2,
          email: 'new@example.com',
          google_id: null,
          role: 'USER',
          username: null,
          bio: 'duplicate bio',
          avatar_url: null,
          leetcode_url: null,
          codeforces_url: null,
          github_url: null,
          weekend_off_enabled: true,
        },
      ],
      articleProgress: [
        {
          article_id: 'article-1',
          completed_at: '2026-03-10T10:00:00.000Z',
          created_at: '2026-03-01T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          article_id: 'article-1',
          completed_at: '2026-03-12T10:00:00.000Z',
          created_at: '2026-03-05T10:00:00.000Z',
          email: 'new@example.com',
          google_id: null,
        },
      ],
      userBadges: [
        {
          badge_slug: 'bookworm',
          earned_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          badge_slug: 'bookworm',
          earned_at: '2026-03-11T10:00:00.000Z',
          email: 'new@example.com',
          google_id: null,
        },
      ],
      userQuestionSubmissions: [
        {
          id: 'sub-1',
          question_id: 'question-1',
          solved: false,
          source_code: 'old code',
          created_at: '2026-03-01T10:00:00.000Z',
          updated_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          id: 'sub-2',
          question_id: 'question-1',
          solved: true,
          source_code: 'new code',
          created_at: '2026-03-05T10:00:00.000Z',
          updated_at: '2026-03-12T10:00:00.000Z',
          email: 'new@example.com',
          google_id: null,
        },
      ],
      userConceptStats: [
        {
          concept_slug: 'arrays',
          track_slug: 'dsa',
          exposures: 2,
          internalized_count: 1,
          last_seen_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
        {
          concept_slug: 'arrays',
          track_slug: 'dsa',
          exposures: 3,
          internalized_count: 0,
          last_seen_at: '2026-03-12T10:00:00.000Z',
          email: 'new@example.com',
          google_id: null,
        },
      ],
    };

    const user = await reconcileGoogleAccount(createStore(state), {
      email: 'new@example.com',
      googleId: 'gid-1',
    });

    expect(user?.email).toBe('new@example.com');
    expect(user?.google_id).toBe('gid-1');
    expect(user?.bio).toBe('duplicate bio');
    expect(user?.weekend_off_enabled).toBe(true);

    expect(state.users).toEqual([
      expect.objectContaining({
        id: 1,
        email: 'new@example.com',
        google_id: 'gid-1',
        username: 'alice',
        bio: 'duplicate bio',
        weekend_off_enabled: true,
      }),
    ]);

    expect(state.articleProgress).toEqual([
      {
        article_id: 'article-1',
        completed_at: '2026-03-12T10:00:00.000Z',
        created_at: '2026-03-01T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);

    expect(state.userBadges).toEqual([
      {
        badge_slug: 'bookworm',
        earned_at: '2026-03-09T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);

    expect(state.userQuestionSubmissions).toEqual([
      {
        id: 'sub-2',
        question_id: 'question-1',
        solved: true,
        source_code: 'new code',
        created_at: '2026-03-01T10:00:00.000Z',
        updated_at: '2026-03-12T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);

    expect(state.userConceptStats).toEqual([
      {
        concept_slug: 'arrays',
        track_slug: 'dsa',
        exposures: 5,
        internalized_count: 1,
        last_seen_at: '2026-03-12T10:00:00.000Z',
        email: 'new@example.com',
        google_id: 'gid-1',
      },
    ]);
  });

  test('links google_id onto an existing email row when no google-backed user exists yet', async () => {
    const state: TestState = {
      users: [
        {
          id: 1,
          email: 'user@example.com',
          google_id: null,
          role: 'USER',
          username: 'user',
          bio: null,
          avatar_url: null,
          leetcode_url: null,
          codeforces_url: null,
          github_url: null,
          weekend_off_enabled: null,
        },
      ],
      articleProgress: [],
      userBadges: [],
      userQuestionSubmissions: [],
      userConceptStats: [],
    };

    const user = await reconcileGoogleAccount(createStore(state), {
      email: 'user@example.com',
      googleId: 'gid-1',
    });

    expect(user).toEqual(expect.objectContaining({ email: 'user@example.com', google_id: 'gid-1' }));
    expect(state.users).toEqual([
      expect.objectContaining({
        id: 1,
        email: 'user@example.com',
        google_id: 'gid-1',
      }),
    ]);
  });

  test('keeps identity tables unchanged when the atomic rewrite fails', async () => {
    const state: TestState = {
      users: [
        {
          id: 1,
          email: 'old@example.com',
          google_id: 'gid-1',
          role: 'USER',
          username: 'alice',
          bio: null,
          avatar_url: null,
          leetcode_url: null,
          codeforces_url: null,
          github_url: null,
          weekend_off_enabled: null,
        },
        {
          id: 2,
          email: 'new@example.com',
          google_id: null,
          role: 'USER',
          username: null,
          bio: null,
          avatar_url: null,
          leetcode_url: null,
          codeforces_url: null,
          github_url: null,
          weekend_off_enabled: null,
        },
      ],
      articleProgress: [
        {
          article_id: 'article-1',
          completed_at: '2026-03-10T10:00:00.000Z',
          created_at: '2026-03-01T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
      ],
      userBadges: [
        {
          badge_slug: 'bookworm',
          earned_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
      ],
      userQuestionSubmissions: [
        {
          id: 'sub-1',
          question_id: 'question-1',
          solved: true,
          source_code: 'code',
          created_at: '2026-03-01T10:00:00.000Z',
          updated_at: '2026-03-10T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
      ],
      userConceptStats: [
        {
          concept_slug: 'arrays',
          track_slug: 'dsa',
          exposures: 2,
          internalized_count: 1,
          last_seen_at: '2026-03-09T10:00:00.000Z',
          email: 'old@example.com',
          google_id: 'gid-1',
        },
      ],
    };

    const snapshot = structuredClone(state);

    await expect(
      reconcileGoogleAccount(createStore(state, { failAtomicReplace: true }), {
        email: 'new@example.com',
        googleId: 'gid-1',
      })
    ).rejects.toThrow('atomic replace failed');

    expect(state).toEqual(snapshot);
  });
});
