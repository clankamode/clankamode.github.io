import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';

const PROGRESS_TABLE = 'UserPracticeProgress';
const QUESTION_TABLE = 'InterviewQuestions';
const PERALTA_SOURCE = 'PERALTA_75';

type ProgressStatus = 'attempted' | 'solved';
type ProgressOrigin = 'manual' | 'execution';

interface ProgressUpdate {
  leetcodeNumber: number;
  status: ProgressStatus;
  origin: ProgressOrigin;
}

interface PracticeProgressUpsertRow {
  email: string;
  google_id: string | null;
  problem_id: string;
  leetcode_number: number;
  status: ProgressStatus;
  attempted_at: string | null;
  solved_at: string | null;
  updated_at: string;
}

function getProgressUpsertConflictTarget(googleId?: string): 'google_id,problem_id' | 'email,problem_id' {
  return googleId ? 'google_id,problem_id' : 'email,problem_id';
}

function normalizeProgressStatus(value: unknown): ProgressStatus | null {
  if (value === 'attempted' || value === 'solved') {
    return value;
  }
  return null;
}

function normalizeProgressOrigin(value: unknown): ProgressOrigin {
  if (value === 'manual') {
    return 'manual';
  }
  return 'execution';
}

function normalizeUpdates(payload: unknown): ProgressUpdate[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { updates?: unknown }).updates)) {
    return [];
  }

  const deduped = new Map<number, { status: ProgressStatus; origin: ProgressOrigin }>();
  for (const entry of (payload as { updates: unknown[] }).updates) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const leetcodeNumber = Number((entry as { leetcodeNumber?: unknown }).leetcodeNumber);
    const status = normalizeProgressStatus((entry as { status?: unknown }).status);
    const origin = normalizeProgressOrigin((entry as { origin?: unknown }).origin);

    if (!Number.isInteger(leetcodeNumber) || leetcodeNumber <= 0 || !status) {
      continue;
    }

    deduped.set(leetcodeNumber, { status, origin });
  }

  return Array.from(deduped.entries()).map(([leetcodeNumber, value]) => ({
    leetcodeNumber,
    status: value.status,
    origin: value.origin,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing identity' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data: peraltaQuestions, error: peraltaLookupError } = await admin
      .from(QUESTION_TABLE)
      .select('id, leetcode_number')
      .contains('source', [PERALTA_SOURCE])
      .not('leetcode_number', 'is', null);

    if (peraltaLookupError) {
      console.error('[peralta75/progress][GET] peralta lookup failed:', peraltaLookupError.message);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    const peraltaProblemIds = Array.from(new Set(
      (peraltaQuestions || [])
        .map((row) => row.id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    ));
    const peraltaNumbers = Array.from(new Set(
      (peraltaQuestions || [])
        .map((row) => row.leetcode_number)
        .filter((value): value is number => Number.isInteger(value) && value > 0)
    ));

    if (peraltaProblemIds.length === 0 || peraltaNumbers.length === 0) {
      return NextResponse.json({ progress: {} });
    }

    const { data, error } = await admin
      .from(PROGRESS_TABLE)
      .select('problem_id, leetcode_number, status, attempted_at, solved_at')
      .or(buildUserIdentityOrFilter(identity))
      .in('problem_id', peraltaProblemIds)
      .order('leetcode_number', { ascending: true });

    if (error) {
      console.error('[peralta75/progress][GET] failed:', error.message);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    const progressByLeetCode: Record<string, {
      status: ProgressStatus;
      attemptedAt: string | null;
      solvedAt: string | null;
    }> = {};

    for (const row of data || []) {
      if (!Number.isInteger(row.leetcode_number) || row.leetcode_number <= 0) {
        continue;
      }

      const status = normalizeProgressStatus(row.status);
      if (!status) {
        continue;
      }

      if (status === 'attempted' && !row.attempted_at) {
        continue;
      }

      progressByLeetCode[String(row.leetcode_number)] = {
        status,
        attemptedAt: row.attempted_at ?? null,
        solvedAt: row.solved_at ?? null,
      };
    }

    return NextResponse.json({ progress: progressByLeetCode });
  } catch (error) {
    console.error('[peralta75/progress][GET] unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing identity' }, { status: 400 });
    }

    const payload = await req.json();
    const updates = normalizeUpdates(payload);

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    const { data: questionRows, error: questionsError } = await admin
      .from(QUESTION_TABLE)
      .select('id, leetcode_number, source')
      .in('leetcode_number', updates.map((item) => item.leetcodeNumber))
      .contains('source', [PERALTA_SOURCE]);

    if (questionsError) {
      console.error('[peralta75/progress][POST] question lookup failed:', questionsError.message);
      return NextResponse.json({ error: 'Failed to resolve questions' }, { status: 500 });
    }

    const questionByLeetCode = new Map<number, { id: string; leetcode_number: number }>();
    for (const row of questionRows || []) {
      if (!Number.isInteger(row.leetcode_number) || row.leetcode_number <= 0) {
        continue;
      }

      questionByLeetCode.set(row.leetcode_number, {
        id: row.id,
        leetcode_number: row.leetcode_number,
      });
    }

    const problemIds = Array.from(questionByLeetCode.values()).map((row) => row.id);
    if (problemIds.length === 0) {
      return NextResponse.json({ error: 'No matching Peralta questions found' }, { status: 404 });
    }

    const { data: existingRows, error: existingError } = await admin
      .from(PROGRESS_TABLE)
      .select('problem_id, attempted_at, solved_at')
      .or(buildUserIdentityOrFilter(identity))
      .in('problem_id', problemIds);

    if (existingError) {
      console.error('[peralta75/progress][POST] existing lookup failed:', existingError.message);
      return NextResponse.json({ error: 'Failed to load current progress' }, { status: 500 });
    }

    const existingByProblemId = new Map<string, {
      attempted_at: string | null;
      solved_at: string | null;
    }>();

    for (const row of existingRows || []) {
      existingByProblemId.set(row.problem_id, {
        attempted_at: row.attempted_at ?? null,
        solved_at: row.solved_at ?? null,
      });
    }

    const nowIso = new Date().toISOString();

    const rowsToUpsert: PracticeProgressUpsertRow[] = [];
    for (const update of updates) {
      const question = questionByLeetCode.get(update.leetcodeNumber);
      if (!question) {
        continue;
      }

      const existing = existingByProblemId.get(question.id);

      if (update.status === 'solved') {
        const attemptedAt = existing?.attempted_at || (update.origin === 'execution' ? nowIso : null);
        rowsToUpsert.push({
          email: identity.email,
          google_id: identity.googleId ?? null,
          problem_id: question.id,
          leetcode_number: question.leetcode_number,
          status: 'solved' as const,
          attempted_at: attemptedAt,
          solved_at: nowIso,
          updated_at: nowIso,
        });
        continue;
      }

      if (update.origin === 'manual') {
        if (!existing) {
          continue;
        }

        // Manual "unsolve" should not fabricate attempt history.
        const looksSyntheticAttempt =
          !!existing.attempted_at &&
          !!existing.solved_at &&
          existing.attempted_at === existing.solved_at;

        if ((!existing.attempted_at && existing.solved_at) || looksSyntheticAttempt) {
          rowsToUpsert.push({
            email: identity.email,
            google_id: identity.googleId ?? null,
            problem_id: question.id,
            leetcode_number: question.leetcode_number,
            status: 'attempted' as const,
            attempted_at: null,
            solved_at: null,
            updated_at: nowIso,
          });
          continue;
        }
      }

      const attemptedAt = existing?.attempted_at || nowIso;
      rowsToUpsert.push({
        email: identity.email,
        google_id: identity.googleId ?? null,
        problem_id: question.id,
        leetcode_number: question.leetcode_number,
        status: 'attempted' as const,
        attempted_at: attemptedAt,
        solved_at: null,
        updated_at: nowIso,
      });
    }

    if (rowsToUpsert.length === 0) {
      return NextResponse.json({ error: 'No valid Peralta updates found' }, { status: 404 });
    }

    const { error: upsertError } = await admin
      .from(PROGRESS_TABLE)
      .upsert(rowsToUpsert, { onConflict: getProgressUpsertConflictTarget(identity.googleId) });

    if (upsertError) {
      console.error('[peralta75/progress][POST] upsert failed:', upsertError.message);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ updated: rowsToUpsert.length });
  } catch (error) {
    console.error('[peralta75/progress][POST] unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
