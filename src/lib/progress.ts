import { supabase } from '@/lib/supabase';
import { getLearningLibrary } from '@/lib/content';
import type {
  LearningArticle,
  LearningPillar,
  LearningPillarWithTopics,
} from '@/types/content';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { deriveStateAwareIntent, deriveStaticIntent } from '@/lib/gate-intent';
import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';
import { planSessionItemsWithLLM } from '@/lib/session-llm-planner';
import { chunkArticleByHeadings } from '@/lib/article-chunking';
import { estimateReadingTimeMinutes } from '@/lib/reading-time';
import { getFromCache, setInCache } from '@/lib/redis';

const PROGRESS_TABLE = 'UserArticleProgress';
const BOOKMARKS_TABLE = 'UserBookmarks';
const PRACTICE_QUESTIONS_TABLE = 'InterviewQuestions';
const SESSION_PLAN_LOCK_TTL_SECONDS = 20 * 60;
const SESSION_FINALIZED_LOOKBACK_HOURS = 8;

interface SessionPlanLock {
  createdAt: number;
  itemHrefs: string[];
  items: SessionItem[];
}

interface ArticleLookupEntry {
  article: LearningArticle;
  pillar: LearningPillar;
}

export interface RecentActivityItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  completedAt: string;
}

export interface PillarProgress {
  id: string;
  slug: string;
  name: string;
  totalArticles: number;
  completedArticles: number;
  percent: number;
}

export interface NextArticle {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  readingTimeMinutes: number | null;
}

export interface ProgressSummary {
  totalArticles: number;
  completedArticles: number;
  percent: number;
  streakDays: number;
  pillars: PillarProgress[];
  recentActivity: RecentActivityItem[];
  nextArticle: NextArticle | null;
  completedIds: string[];
  allCompletionDates: string[];
}

export interface BookmarkItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  excerpt: string | null;
  readingTimeMinutes: number | null;
  savedAt: string;
}

export type SessionMode = 'pick_track' | 'normal' | 'just_finished';


export interface SessionIntent {
  type: 'bridge' | 'tradeoff' | 'foundation' | 'practice';
  from?: string[];
  to?: string[];
  text: string;
}

export interface SessionItem {
  type: 'learn' | 'practice';
  title: string;
  subtitle: string;
  pillarSlug: string;
  href: string;
  articleId?: string;
  slug?: string;
  estMinutes: number | null;
  intent: SessionIntent;
  confidence?: number;
  primaryConceptSlug?: string | null;
  targetConcept?: string | null;
  sessionChunkIndex?: number;
  sessionChunkCount?: number;
  sessionChunkTitle?: string | null;
  sourceArticleTitle?: string | null;
  practiceQuestionId?: string;
  practiceQuestionUrl?: string;
  practiceDifficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface LearningDelta {
  introduced: string[];
  reinforced: string[];
  unlocked: string[];
}

export interface SessionProof {
  streakDays: number;
  todayCount: number;
  last7: { date: string; count: number }[];
}

export interface SessionState {
  mode: SessionMode;
  now: SessionItem | null;
  upNext: SessionItem[];
  proof: SessionProof;
  track: { slug: string; name: string } | null;
}

interface PracticeQuestionRow {
  id: string;
  name: string;
  leetcode_number: number | null;
  leetcode_url: string | null;
  difficulty: string;
}

type PracticeDifficulty = 'Easy' | 'Medium' | 'Hard';

interface PracticePerformance {
  recentScores: number[];
  targetDifficulty: PracticeDifficulty;
  rationale: string;
}

function buildArticleLookup(library: LearningPillarWithTopics[]) {
  const lookup = new Map<string, ArticleLookupEntry>();

  library.forEach((pillar) => {
    pillar.topics.forEach((topic) => {
      topic.articles.forEach((article) => {
        lookup.set(article.id, { article, pillar });
      });
    });
  });

  return lookup;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStreakDays(completedAtDates: string[]) {
  if (!completedAtDates.length) {
    return 0;
  }

  const completedKeys = new Set(
    completedAtDates.map((completedAt) => getDateKey(new Date(completedAt)))
  );

  const todayKey = getDateKey(new Date());
  if (!completedKeys.has(todayKey)) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (completedKeys.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function normalizePracticeDifficulty(value: string): PracticeDifficulty | null {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }
  return null;
}

function estimatePracticeMinutes(difficulty: PracticeDifficulty): number {
  switch (difficulty) {
    case 'Easy':
      return 10;
    case 'Medium':
      return 15;
    case 'Hard':
      return 20;
    default:
      return 12;
  }
}

function isPracticeTrack(trackSlug: string): boolean {
  return trackSlug === 'dsa' || trackSlug === 'interviews';
}

function formatConceptLabel(conceptSlug: string | null | undefined): string | null {
  if (!conceptSlug) return null;

  const trailingSegment = conceptSlug.split('.').pop() || conceptSlug;
  const label = trailingSegment
    .replace(/[-_]/g, ' ')
    .trim();

  if (!label) return null;
  return label[0].toUpperCase() + label.slice(1);
}

function getDayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function rankDeterministicBySeed<T>(
  items: T[],
  seed: string,
  keySelector: (item: T) => string
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = simpleHash(`${seed}:${keySelector(a)}`);
    const scoreB = simpleHash(`${seed}:${keySelector(b)}`);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return keySelector(a).localeCompare(keySelector(b));
  });
}

async function derivePracticePerformance(userId: string, googleId?: string): Promise<PracticePerformance> {
  const { data, error } = await supabase
    .from('TestSession')
    .select('score_percentage, completed_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    return {
      recentScores: [],
      targetDifficulty: 'Easy',
      rationale: 'Starting at Easy because there is no recent assessment history yet.',
    };
  }

  const recentScores = data
    .map((row) => Number(row.score_percentage))
    .filter((score) => Number.isFinite(score));

  if (recentScores.length === 0) {
    return {
      recentScores: [],
      targetDifficulty: 'Easy',
      rationale: 'Starting at Easy because recent assessment scores were unavailable.',
    };
  }

  const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const lastTwo = recentScores.slice(0, 2);
  const hasConsistentHighRecent = lastTwo.length === 2 && lastTwo.every((score) => score >= 85);
  const hasConsistentLowRecent = lastTwo.length === 2 && lastTwo.every((score) => score < 60);

  if (hasConsistentHighRecent && avgScore >= 80) {
    return {
      recentScores,
      targetDifficulty: 'Hard',
      rationale: `Ramping to Hard because recent scores are strong (${Math.round(avgScore)}% avg).`,
    };
  }

  if (hasConsistentLowRecent || avgScore < 65) {
    return {
      recentScores,
      targetDifficulty: 'Easy',
      rationale: `Staying at Easy to rebuild fundamentals (${Math.round(avgScore)}% avg).`,
    };
  }

  return {
    recentScores,
    targetDifficulty: 'Medium',
    rationale: `Ramping to Medium based on steady recent performance (${Math.round(avgScore)}% avg).`,
  };
}

function toIdentity(userId: string, googleId?: string): EffectiveIdentity {
  return googleId ? { email: userId, googleId } : { email: userId };
}

export async function getArticleCompletionStatus(userId: string, articleId: string, googleId?: string) {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('completed_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { completed: false, completedAt: null };
  }

  return { completed: true, completedAt: data.completed_at };
}

export async function getBookmarkStatus(userId: string, articleId: string, googleId?: string) {
  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('id')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { bookmarked: false };
  }

  return { bookmarked: true };
}

export async function getProgressSummary(userId: string, googleId?: string): Promise<ProgressSummary> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data: progressRecords, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('article_id, completed_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .order('completed_at', { ascending: false });

  if (error) {
    throw error;
  }

  const filteredRecords = (progressRecords || []).filter((record) => lookup.has(record.article_id));
  const completedIds = new Set(filteredRecords.map((record) => record.article_id));

  const pillars: PillarProgress[] = library.map((pillar) => {
    const totalArticles = pillar.topics.reduce((sum, topic) => sum + topic.articles.length, 0);
    const completedArticles = pillar.topics.reduce((sum, topic) => {
      return (
        sum +
        topic.articles.reduce((articleSum, article) => {
          return articleSum + (completedIds.has(article.id) ? 1 : 0);
        }, 0)
      );
    }, 0);
    const percent = totalArticles ? Math.round((completedArticles / totalArticles) * 100) : 0;

    return {
      id: pillar.id,
      slug: pillar.slug,
      name: pillar.name,
      totalArticles,
      completedArticles,
      percent,
    };
  });

  const totalArticles = pillars.reduce((sum, pillar) => sum + pillar.totalArticles, 0);
  const completedArticles = pillars.reduce((sum, pillar) => sum + pillar.completedArticles, 0);
  const percent = totalArticles ? Math.round((completedArticles / totalArticles) * 100) : 0;

  const recentActivity = filteredRecords.slice(0, 5).map((record) => {
    const entry = lookup.get(record.article_id);
    return {
      articleId: record.article_id,
      articleSlug: entry?.article.slug ?? '',
      pillarSlug: entry?.pillar.slug ?? '',
      title: entry?.article.title ?? 'Unknown article',
      completedAt: record.completed_at,
    };
  });

  const streakDays = getStreakDays(filteredRecords.map((record) => record.completed_at));

  let nextArticle: NextArticle | null = null;
  for (const pillar of library) {
    for (const topic of pillar.topics) {
      for (const article of topic.articles) {
        if (!completedIds.has(article.id)) {
          nextArticle = {
            articleId: article.id,
            articleSlug: article.slug,
            pillarSlug: pillar.slug,
            title: article.title,
            readingTimeMinutes: article.reading_time_minutes,
          };
          break;
        }
      }
      if (nextArticle) break;
    }
    if (nextArticle) break;
  }

  return {
    totalArticles,
    completedArticles,
    percent,
    streakDays,
    pillars,
    recentActivity,
    nextArticle,
    completedIds: Array.from(completedIds),
    allCompletionDates: filteredRecords.map((r) => r.completed_at),
  };
}

export async function getUserBookmarks(userId: string, googleId?: string): Promise<BookmarkItem[]> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('article_id, created_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((record) => {
      const entry = lookup.get(record.article_id);
      if (!entry) {
        return null;
      }
      return {
        articleId: record.article_id,
        articleSlug: entry.article.slug,
        pillarSlug: entry.pillar.slug,
        title: entry.article.title,
        excerpt: entry.article.excerpt,
        readingTimeMinutes: entry.article.reading_time_minutes,
        savedAt: record.created_at,
      };
    })
    .filter((item): item is BookmarkItem => item !== null);
}

async function getPracticeSessionCandidates(
  trackSlug: string,
  targetDifficulty: PracticeDifficulty,
  rationale: string,
  seed: string
): Promise<SessionItem[]> {
  if (!isPracticeTrack(trackSlug)) {
    return [];
  }

  const [easyResult, mediumResult, hardResult] = await Promise.all([
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty')
      .eq('difficulty', 'Easy')
      .contains('source', ['MOCK_ASSESSMENTS'])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(18),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty')
      .eq('difficulty', 'Medium')
      .contains('source', ['MOCK_ASSESSMENTS'])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(18),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty')
      .eq('difficulty', 'Hard')
      .contains('source', ['MOCK_ASSESSMENTS'])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(12),
  ]);

  if (easyResult.error || mediumResult.error || hardResult.error) {
    return [];
  }

  const easy = ((easyResult.data || []) as PracticeQuestionRow[])
    .map((row) => ({ row, difficulty: normalizePracticeDifficulty(row.difficulty) }))
    .filter((entry): entry is { row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string }; difficulty: PracticeDifficulty } => (
      !!entry.difficulty &&
      entry.row.leetcode_number !== null &&
      entry.row.leetcode_url !== null
    ));
  const medium = ((mediumResult.data || []) as PracticeQuestionRow[])
    .map((row) => ({ row, difficulty: normalizePracticeDifficulty(row.difficulty) }))
    .filter((entry): entry is { row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string }; difficulty: PracticeDifficulty } => (
      !!entry.difficulty &&
      entry.row.leetcode_number !== null &&
      entry.row.leetcode_url !== null
    ));
  const hard = ((hardResult.data || []) as PracticeQuestionRow[])
    .map((row) => ({ row, difficulty: normalizePracticeDifficulty(row.difficulty) }))
    .filter((entry): entry is { row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string }; difficulty: PracticeDifficulty } => (
      !!entry.difficulty &&
      entry.row.leetcode_number !== null &&
      entry.row.leetcode_url !== null
    ));

  const rankedEasy = rankDeterministicBySeed(easy, `${seed}:easy`, ({ row }) => String(row.id));
  const rankedMedium = rankDeterministicBySeed(medium, `${seed}:medium`, ({ row }) => String(row.id));
  const rankedHard = rankDeterministicBySeed(hard, `${seed}:hard`, ({ row }) => String(row.id));

  const mixByTarget: Record<PracticeDifficulty, { easy: number; medium: number; hard: number }> = {
    Easy: { easy: 4, medium: 2, hard: 0 },
    Medium: { easy: 2, medium: 4, hard: 1 },
    Hard: { easy: 1, medium: 3, hard: 3 },
  };

  const mix = mixByTarget[targetDifficulty];
  const picked = [
    ...rankedEasy.slice(0, mix.easy),
    ...rankedMedium.slice(0, mix.medium),
    ...rankedHard.slice(0, mix.hard),
  ];
  const fallbackPool = [...rankedEasy, ...rankedMedium, ...rankedHard];
  const selected = picked.length > 0 ? picked : fallbackPool.slice(0, 6);

  return selected.map(({ row, difficulty }) => ({
    type: 'practice',
    title: row.name,
    subtitle: `${difficulty} coding assessment`,
    pillarSlug: trackSlug,
    href: `/session/practice/${row.leetcode_number}`,
    estMinutes: estimatePracticeMinutes(difficulty),
    intent: {
      type: 'practice',
      text: `${rationale} Solve ${row.name} because live reps convert recognition into retrieval speed.`,
    },
    confidence: 0.86,
    targetConcept: `${difficulty} interview problem solving`,
    practiceQuestionId: String(row.leetcode_number),
    practiceQuestionUrl: row.leetcode_url,
    practiceDifficulty: difficulty,
  }));
}

async function getRecentlyFinalizedItemHrefs(
  userId: string,
  trackSlug: string,
  googleId?: string
): Promise<Set<string>> {
  const lookbackISO = new Date(Date.now() - SESSION_FINALIZED_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('TelemetryEvents')
    .select('payload')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('track_slug', trackSlug)
    .eq('event_type', 'session_finalized')
    .gte('created_at', lookbackISO)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || typeof data !== 'object') {
    return new Set<string>();
  }

  const payload = (data as { payload?: unknown }).payload;
  if (!payload || typeof payload !== 'object') {
    return new Set<string>();
  }

  const completedItems = (payload as { completedItems?: unknown }).completedItems;
  if (!Array.isArray(completedItems)) {
    return new Set<string>();
  }

  return new Set(
    completedItems.filter((item): item is string => typeof item === 'string' && item.length > 0)
  );
}

interface LearnCandidateCollection {
  fullItems: SessionItem[];
  chunkItems: SessionItem[];
}

export async function getSessionState(userId: string, preferredTrackSlug?: string, googleId?: string): Promise<SessionState> {
  const summary = await getProgressSummary(userId, googleId);
  const library = await getLearningLibrary(false);
  const normalizedPreferredTrack = preferredTrackSlug?.toLowerCase();
  const preferredTrack = normalizedPreferredTrack
    ? library.find((pillar) => pillar.slug === normalizedPreferredTrack)
    : null;
  const resolvedTrackSlug = preferredTrack?.slug || normalizedPreferredTrack || 'dsa';

  const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS);
  const userState = useGenerative
    ? (await getUserLearningState(userId, resolvedTrackSlug, googleId)).userState
    : null;

  const completedIds = new Set(summary.completedIds);
  const collectItems = (
    pillars: LearningPillarWithTopics[],
    allowCompleted: boolean,
    maxItems: number = 8,
    includeChunkItems: boolean = false,
    maxChunkItems: number = 10,
    maxChunksPerArticle: number = 2
  ): LearnCandidateCollection => {
    const fullItems: SessionItem[] = [];
    const chunkItems: SessionItem[] = [];

    for (const pillar of pillars) {
      for (const topic of pillar.topics) {
        for (const article of topic.articles) {
          if (completedIds.has(article.id) && !allowCompleted) {
            continue;
          }

          const intent = useGenerative && userState
            ? deriveStateAwareIntent({
              primaryConceptSlug: article.primary_concept ?? null,
              userState,
              articleSlug: article.slug,
              pillarSlug: pillar.slug
            })
            : deriveStaticIntent(article.slug, pillar.slug);

          if (fullItems.length < maxItems) {
            fullItems.push({
              type: 'learn',
              title: article.title,
              subtitle: `${article.reading_time_minutes || 5} min read`,
              pillarSlug: pillar.slug,
              href: `/learn/${pillar.slug}/${article.slug}`,
              articleId: article.id,
              estMinutes: article.reading_time_minutes,
              intent,
              confidence: 0.9,
              primaryConceptSlug: article.primary_concept ?? null,
              targetConcept: formatConceptLabel(article.primary_concept) ?? article.title,
              sourceArticleTitle: article.title,
            });
          }

          if (includeChunkItems && chunkItems.length < maxChunkItems) {
            const chunks = chunkArticleByHeadings(article.body);
            const nonTrivial = chunks.filter((chunk) => chunk.content.trim().length >= 80);
            const selectedChunks = (nonTrivial.length > 0 ? nonTrivial : chunks).slice(0, maxChunksPerArticle);

            for (const chunk of selectedChunks) {
              if (chunkItems.length >= maxChunkItems) break;

              const chunkMinutes = estimateReadingTimeMinutes(chunk.content, {
                minMinutes: 2,
                maxMinutes: 15,
              });
              const sectionTitle = chunk.title?.trim() || `Section ${chunk.index + 1}`;
              chunkItems.push({
                type: 'learn',
                title: `${article.title} · ${sectionTitle}`,
                subtitle: `Section ${chunk.index + 1}/${chunks.length} · ${chunkMinutes} min read`,
                pillarSlug: pillar.slug,
                href: `/learn/${pillar.slug}/${article.slug}?sessionChunk=${chunk.index}`,
                articleId: article.id,
                slug: article.slug,
                estMinutes: chunkMinutes,
                intent: {
                  ...intent,
                  text: `${intent.text} Focus this section because targeted retrieval beats broad rereads in short sessions.`,
                },
                confidence: 0.88,
                primaryConceptSlug: article.primary_concept ?? null,
                targetConcept:
                  sectionTitle.toLowerCase() === 'introduction'
                    ? (formatConceptLabel(article.primary_concept) ?? article.title)
                    : sectionTitle,
                sessionChunkIndex: chunk.index,
                sessionChunkCount: chunks.length,
                sessionChunkTitle: sectionTitle,
                sourceArticleTitle: article.title,
              });
            }
          }

          if (fullItems.length >= maxItems && (!includeChunkItems || chunkItems.length >= maxChunkItems)) {
            return { fullItems, chunkItems };
          }
        }
      }
    }

    return { fullItems, chunkItems };
  };

  let articleCandidates: SessionItem[] = [];
  let sectionCandidates: SessionItem[] = [];
  if (preferredTrack) {
    const preferredCollection = collectItems([preferredTrack], false, 8, useGenerative, 10, 2);
    articleCandidates = preferredCollection.fullItems;
    sectionCandidates = preferredCollection.chunkItems;
    if (articleCandidates.length === 0) {
      const fallbackCollection = collectItems([preferredTrack], true, 8, useGenerative, 10, 2);
      articleCandidates = fallbackCollection.fullItems;
      sectionCandidates = fallbackCollection.chunkItems;
    }
  } else {
    const collection = collectItems(library, false, 8, useGenerative, 10, 2);
    articleCandidates = collection.fullItems;
    sectionCandidates = collection.chunkItems;
  }

  const plannerTrackSlug = preferredTrack?.slug || articleCandidates[0]?.pillarSlug || sectionCandidates[0]?.pillarSlug || resolvedTrackSlug;
  const plannerTrackName = preferredTrack?.name || getPillarName(plannerTrackSlug, library);
  const recentlyFinalizedItemHrefs = useGenerative
    ? await getRecentlyFinalizedItemHrefs(userId, plannerTrackSlug, googleId)
    : new Set<string>();
  if (recentlyFinalizedItemHrefs.size > 0) {
    articleCandidates = articleCandidates.filter((item) => !recentlyFinalizedItemHrefs.has(item.href));
    sectionCandidates = sectionCandidates.filter((item) => !recentlyFinalizedItemHrefs.has(item.href));
  }
  const dayKey = getDayKeyUTC();
  const practicePerformance = useGenerative
    ? await derivePracticePerformance(userId, googleId)
    : null;
  const practiceCandidates = useGenerative
    ? await getPracticeSessionCandidates(
      plannerTrackSlug,
      practicePerformance?.targetDifficulty || 'Easy',
      practicePerformance?.rationale || 'Build retrieval speed with timed interview reps.',
      `${userId}:${plannerTrackSlug}:${dayKey}`
    )
    : [];
  const filteredPracticeCandidates = recentlyFinalizedItemHrefs.size > 0
    ? practiceCandidates.filter((item) => !recentlyFinalizedItemHrefs.has(item.href))
    : practiceCandidates;
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weeklyCompletions = summary.allCompletionDates.filter((value) => new Date(value).getTime() >= sevenDaysAgo).length;
  const outcomeSignals = useGenerative ? {
    completionRate: summary.totalArticles > 0 ? summary.completedArticles / summary.totalArticles : 0.6,
    timeAdherence: Math.min(1, weeklyCompletions / 6),
    nextDayReturnRate: summary.streakDays >= 2 ? 1 : summary.streakDays === 1 ? 0.6 : 0.2,
    ritualQuality: userState?.lastInternalization
      ? (userState.lastInternalization.picked === 'learned' ? 0.9 : 0.65)
      : 0.45,
  } : undefined;

  let sessionItems = articleCandidates.slice(0, 3);

  if (useGenerative) {
    const learnPlannerPool = [...sectionCandidates.slice(0, 8), ...articleCandidates.slice(0, 6)];
    const plannerCandidates = [
      ...learnPlannerPool.map((item) => ({
        id: item.sessionChunkIndex !== undefined
          ? `learn:${item.articleId || item.href}:chunk:${item.sessionChunkIndex}`
          : `learn:${item.articleId || item.href}`,
        item,
      })),
      ...filteredPracticeCandidates.map((item) => ({
        id: `practice:${item.practiceQuestionId || item.href}`,
        item,
      })),
    ];
    const plannerCandidateSet = new Set(plannerCandidates.map((candidate) => candidate.item.href));
    const sessionPlanLockKey = `session-plan-lock:v1:${userId}:${plannerTrackSlug}`;
    const existingPlanLock = await getFromCache<SessionPlanLock>(sessionPlanLockKey);

    if (
      existingPlanLock &&
      Array.isArray(existingPlanLock.items) &&
      existingPlanLock.items.length > 0 &&
      Array.isArray(existingPlanLock.itemHrefs) &&
      existingPlanLock.itemHrefs.every((href) => plannerCandidateSet.has(href))
    ) {
      sessionItems = existingPlanLock.items.slice(0, 3);
    } else {
      const plannedItems = await planSessionItemsWithLLM({
        cacheKey: `${userId}:${plannerTrackSlug}:${dayKey}:${plannerCandidates.map((c) => c.id).join('|')}`,
        budgetKey: `${userId}:${dayKey}`,
        trackSlug: plannerTrackSlug,
        trackName: plannerTrackName,
        userState,
        recentActivityTitles: summary.recentActivity.map((activity) => activity.title),
        outcomeSignals,
        practiceTargetDifficulty: practicePerformance?.targetDifficulty || null,
        requirePracticeItem: isPracticeTrack(plannerTrackSlug) && filteredPracticeCandidates.length > 0,
        candidates: plannerCandidates,
        maxItems: 3,
      });

      if (plannedItems && plannedItems.length > 0) {
        sessionItems = plannedItems;
      } else if (filteredPracticeCandidates.length > 0) {
        const baseLearn = sectionCandidates[0] || articleCandidates[0] || null;
        sessionItems = baseLearn
          ? [baseLearn, filteredPracticeCandidates[0]]
          : [filteredPracticeCandidates[0]];
      }

      if (sessionItems.length > 0) {
        await setInCache(
          sessionPlanLockKey,
          {
            createdAt: Date.now(),
            itemHrefs: sessionItems.map((item) => item.href),
            items: sessionItems,
          },
          SESSION_PLAN_LOCK_TTL_SECONDS
        );
      }
    }
  }

  const now = sessionItems[0] || null;
  const upNext = sessionItems.slice(1, 4);

  let mode: SessionMode = 'normal';
  if (!now) {
    mode = 'pick_track';
  } else if (summary.recentActivity.length > 0) {
    const lastCompletedAt = new Date(summary.recentActivity[0].completedAt);
    const hoursSinceCompletion = (Date.now() - lastCompletedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompletion < 1) {
      mode = 'just_finished';
    }
  }

  const last7Map = new Map<string, number>();
  const now7 = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now7);
    d.setDate(d.getDate() - i);
    last7Map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const completedAt of summary.allCompletionDates) {
    const dateKey = completedAt.slice(0, 10);
    if (last7Map.has(dateKey)) {
      last7Map.set(dateKey, (last7Map.get(dateKey) || 0) + 1);
    }
  }
  const last7 = Array.from(last7Map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = last7Map.get(todayKey) || 0;

  const track = now
    ? { slug: now.pillarSlug, name: getPillarName(now.pillarSlug, library) }
    : preferredTrack
      ? { slug: preferredTrack.slug, name: preferredTrack.name }
      : articleCandidates[0]
        ? { slug: articleCandidates[0].pillarSlug, name: getPillarName(articleCandidates[0].pillarSlug, library) }
        : null;

  return {
    mode,
    now,
    upNext,
    proof: {
      streakDays: summary.streakDays,
      todayCount,
      last7,
    },
    track,
  };
}

function getPillarName(slug: string, library: LearningPillarWithTopics[]): string {
  const pillar = library.find((p) => p.slug === slug);
  return pillar?.name || slug.replace(/-/g, ' ');
}
