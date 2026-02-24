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
import { applySessionPlanPolicySelection, buildHeuristicPlan, planSessionItemsWithLLM } from '@/lib/session-llm-planner';
import { chunkArticleByHeadings } from '@/lib/article-chunking';
import { estimateReadingTimeMinutes } from '@/lib/reading-time';
import { getFromCache, setInCache } from '@/lib/redis';
import {
  applyPersonalizationScopeExperiment,
  type PersonalizationScopeExperiment,
} from '@/lib/session-personalization-experiment';
import { buildSessionPersonalizationProfile, type SessionPersonalizationProfile } from '@/lib/session-personalization';
import { decideScopePolicy, decideSessionPlanPolicy } from '@/lib/ai-policy/runtime';
import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import type { UserLearningState } from '@/types/micro';
import type { OnboardingGoal } from '@/types/onboarding';

const PROGRESS_TABLE = 'UserArticleProgress';
const BOOKMARKS_TABLE = 'UserBookmarks';
const PRACTICE_QUESTIONS_TABLE = 'InterviewQuestions';
const SESSION_PLAN_LOCK_TTL_SECONDS = 20 * 60;
const SESSION_FINALIZED_LOOKBACK_HOURS = 8;
const SESSION_FINALIZED_LOOKBACK_ROWS = 12;
const ITEM_COMPLETED_LOOKBACK_DAYS = 7;
const ITEM_COMPLETED_LOOKBACK_ROWS = 120;
const SESSION_COMMITTED_LOOKBACK_DAYS = 7;
const SESSION_COMMITTED_LOOKBACK_ROWS = 120;
const ONBOARDING_BIAS_MAX_COMMITTED_SESSIONS = 5;
const POLICY_PROMPT_VERSION = 'ai_policy_os_v1';

interface OnboardingProfileRow {
  goal: OnboardingGoal;
  first_launch_track_slug: string | null;
  first_launch_path: string;
}

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

interface ProgressSummaryWithLibrary {
  summary: ProgressSummary;
  library: LearningPillarWithTopics[];
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
  practiceQuestionDescription?: string;
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
  personalization: SessionPersonalizationProfile | null;
  personalizationExperiment: PersonalizationScopeExperiment | null;
  planPolicyDecisionId?: string | null;
  scopePolicyDecisionId?: string | null;
  policyFallbackUsed?: boolean;
}

interface GetSessionStateOptions {
  enablePersonalizationScopeExperiment?: boolean;
  viewer?: { role?: string } | null;
}

interface PracticeQuestionRow {
  id: string;
  name: string;
  leetcode_number: number | null;
  leetcode_url: string | null;
  difficulty: string;
  prompt_full: string;
  source: string[];
  concept_slug: string | null;
  concept_tags: unknown;
}

type PracticeDifficulty = 'Easy' | 'Medium' | 'Hard';

interface RankedPracticeQuestion {
  row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string };
  difficulty: PracticeDifficulty;
  matchedConceptSlug: string | null;
}

interface PracticePerformance {
  recentScores: number[];
  targetDifficulty: PracticeDifficulty;
  rationale: string;
}

interface PracticeRowSources {
  peraltaRows: PracticeQuestionRow[];
  fallbackRows: PracticeQuestionRow[];
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
  return trackSlug === 'dsa' || trackSlug === 'job-hunt' || trackSlug === 'interviews';
}

function normalizeTrackSlug(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  const aliases: Record<string, string> = {
    interviews: 'job-hunt',
    'interview-prep': 'job-hunt',
    interviewprep: 'job-hunt',
    jobhunt: 'job-hunt',
    systemdesign: 'system-design',
    system_design: 'system-design',
  };
  return aliases[normalized] || normalized;
}

function mapOnboardingGoalToTrackSlug(goal: OnboardingGoal): string {
  if (goal === 'work') return 'system-design';
  return 'dsa';
}

async function getOnboardingProfile(userId: string, googleId?: string): Promise<OnboardingProfileRow | null> {
  const { data, error } = await supabase
    .from('UserOnboardingProfiles')
    .select('goal, first_launch_track_slug, first_launch_path')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const goal = data.goal;
  if (goal !== 'interview' && goal !== 'work' && goal !== 'fundamentals') {
    return null;
  }

  return {
    goal,
    first_launch_track_slug: data.first_launch_track_slug ?? null,
    first_launch_path: data.first_launch_path,
  };
}

async function getCommittedSessionCount(userId: string, googleId?: string): Promise<number> {
  const { count, error } = await supabase
    .from('TelemetryEvents')
    .select('*', { count: 'exact', head: true })
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('event_type', 'session_committed');

  if (error || typeof count !== 'number') {
    return 0;
  }

  return count;
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

export function normalizeSessionItemHref(href: string): string {
  return href.split('?')[0].split('#')[0];
}

export function resolvePrimaryConceptSlug(article: LearningArticle): string {
  if (article.primary_concept?.trim()) {
    return article.primary_concept.trim();
  }
  return `article.${article.slug}`;
}

function getDayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumSessionItemMinutes(items: SessionItem[]): number {
  return items.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
}

function trimSessionItemsByScope(items: SessionItem[], limits: { maxItems: number; maxMinutes: number }): SessionItem[] {
  const selected: SessionItem[] = [];
  let usedMinutes = 0;

  for (const item of items) {
    if (selected.length >= limits.maxItems) break;
    const minutes = item.estMinutes ?? 5;
    if (selected.length > 0 && usedMinutes + minutes > limits.maxMinutes) {
      continue;
    }
    selected.push(item);
    usedMinutes += minutes;
  }

  if (selected.length === 0 && items[0]) {
    return [items[0]];
  }

  return selected;
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizeConceptSlug(value: string): string {
  return value.trim().toLowerCase();
}

function extractPracticeConceptTags(row: PracticeQuestionRow): string[] {
  const tags: string[] = [];
  if (Array.isArray(row.concept_tags)) {
    for (const value of row.concept_tags) {
      if (typeof value !== 'string') continue;
      const normalized = normalizeConceptSlug(value);
      if (!normalized || tags.includes(normalized)) continue;
      tags.push(normalized);
    }
  }

  if (typeof row.concept_slug === 'string') {
    const normalized = normalizeConceptSlug(row.concept_slug);
    if (normalized && !tags.includes(normalized)) {
      tags.push(normalized);
    }
  }

  return tags;
}

export function buildPracticePriorityConcepts(userState?: UserLearningState | null): string[] {
  if (!userState) return [];

  const deduped = new Set<string>();
  const ordered: string[] = [];
  for (const slug of [...userState.stubbornConcepts, ...userState.recentConcepts]) {
    if (typeof slug !== 'string') continue;
    const normalized = normalizeConceptSlug(slug);
    if (!normalized || deduped.has(normalized)) continue;
    deduped.add(normalized);
    ordered.push(normalized);
  }

  return ordered;
}

function rankPracticeRowsForSelection(
  rows: PracticeQuestionRow[],
  seed: string,
  priorityConcepts: string[],
  sourceRank: number
): RankedPracticeQuestion[] {
  const priorityIndex = new Map<string, number>(
    priorityConcepts.map((slug, index) => [slug, index])
  );

  const scored = rows
    .map((row) => ({ row, difficulty: normalizePracticeDifficulty(row.difficulty) }))
    .filter((entry): entry is { row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string }; difficulty: PracticeDifficulty } => (
      !!entry.difficulty &&
      entry.row.leetcode_number !== null &&
      entry.row.leetcode_url !== null
    ))
    .map((entry) => {
      const conceptTags = extractPracticeConceptTags(entry.row);
      let bestRank = Number.MAX_SAFE_INTEGER;
      let matchedConceptSlug: string | null = null;

      for (const slug of conceptTags) {
        const rank = priorityIndex.get(slug);
        if (rank === undefined) continue;
        if (rank < bestRank) {
          bestRank = rank;
          matchedConceptSlug = slug;
        }
      }

      return {
        row: entry.row,
        difficulty: entry.difficulty,
        matchedConceptSlug,
        conceptRank: bestRank,
        sourceRank,
      };
    });

  return scored.sort((a, b) => {
    if (a.conceptRank !== b.conceptRank) {
      return a.conceptRank - b.conceptRank;
    }

    if (a.sourceRank !== b.sourceRank) {
      return a.sourceRank - b.sourceRank;
    }

    const scoreA = simpleHash(`${seed}:${a.row.id}`);
    const scoreB = simpleHash(`${seed}:${b.row.id}`);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    return a.row.id.localeCompare(b.row.id);
  }).map(({ row, difficulty, matchedConceptSlug }) => ({
    row,
    difficulty,
    matchedConceptSlug,
  }));
}

export function selectPracticeRowsForSession(input: {
  peraltaRows: PracticeQuestionRow[];
  fallbackRows: PracticeQuestionRow[];
  targetDifficulty: PracticeDifficulty;
  seed: string;
  priorityConcepts: string[];
}): RankedPracticeQuestion[] {
  const rankedPeralta = rankPracticeRowsForSelection(input.peraltaRows, `${input.seed}:peralta`, input.priorityConcepts, 0);
  const rankedFallback = rankPracticeRowsForSelection(input.fallbackRows, `${input.seed}:fallback`, input.priorityConcepts, 1);

  const byDifficulty = {
    Easy: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Easy'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Easy'),
    },
    Medium: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Medium'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Medium'),
    },
    Hard: {
      peralta: rankedPeralta.filter((entry) => entry.difficulty === 'Hard'),
      fallback: rankedFallback.filter((entry) => entry.difficulty === 'Hard'),
    },
  } as const;

  const mixByTarget: Record<PracticeDifficulty, { Easy: number; Medium: number; Hard: number }> = {
    Easy: { Easy: 4, Medium: 2, Hard: 0 },
    Medium: { Easy: 2, Medium: 4, Hard: 1 },
    Hard: { Easy: 1, Medium: 3, Hard: 3 },
  };

  const selected: RankedPracticeQuestion[] = [];
  const selectedIds = new Set<string>();
  const mix = mixByTarget[input.targetDifficulty];

  for (const difficulty of ['Easy', 'Medium', 'Hard'] as const) {
    const queue = [...byDifficulty[difficulty].peralta, ...byDifficulty[difficulty].fallback];
    for (const entry of queue) {
      if (selected.length >= 7) break;
      if (selectedIds.has(entry.row.id)) continue;
      selected.push(entry);
      selectedIds.add(entry.row.id);
      if (selected.filter((item) => item.difficulty === difficulty).length >= mix[difficulty]) {
        break;
      }
    }
  }

  const fallbackPool = [...rankedPeralta, ...rankedFallback];
  for (const entry of fallbackPool) {
    if (selected.length >= 7) break;
    if (selectedIds.has(entry.row.id)) continue;
    selected.push(entry);
    selectedIds.add(entry.row.id);
  }

  return selected.slice(0, 7);
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

async function getProgressSummaryWithLibrary(
  userId: string,
  googleId?: string
): Promise<ProgressSummaryWithLibrary> {
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

  const summary: ProgressSummary = {
    totalArticles,
    completedArticles,
    percent,
    streakDays,
    pillars,
    recentActivity,
    nextArticle,
    completedIds: Array.from(completedIds) as string[],
    allCompletionDates: filteredRecords.map((r) => r.completed_at),
  };

  return {
    summary,
    library,
  };
}

export async function getProgressSummary(userId: string, googleId?: string): Promise<ProgressSummary> {
  const { summary } = await getProgressSummaryWithLibrary(userId, googleId);
  return summary;
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

async function fetchPracticeRowsBySource(source: 'PERALTA_75' | 'MOCK_ASSESSMENTS'): Promise<PracticeQuestionRow[]> {
  const [easyResult, mediumResult, hardResult] = await Promise.all([
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Easy')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(24),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Medium')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(24),
    supabase
      .from(PRACTICE_QUESTIONS_TABLE)
      .select('id, name, leetcode_number, leetcode_url, difficulty, prompt_full, source, concept_slug, concept_tags')
      .eq('difficulty', 'Hard')
      .contains('source', [source])
      .not('leetcode_number', 'is', null)
      .not('leetcode_url', 'is', null)
      .limit(16),
  ]);

  if (easyResult.error || mediumResult.error || hardResult.error) {
    return [];
  }

  return [
    ...((easyResult.data || []) as PracticeQuestionRow[]),
    ...((mediumResult.data || []) as PracticeQuestionRow[]),
    ...((hardResult.data || []) as PracticeQuestionRow[]),
  ];
}

async function fetchPracticeRowSources(): Promise<PracticeRowSources> {
  const [peraltaRows, fallbackRows] = await Promise.all([
    fetchPracticeRowsBySource('PERALTA_75'),
    fetchPracticeRowsBySource('MOCK_ASSESSMENTS'),
  ]);

  return { peraltaRows, fallbackRows };
}

async function fetchConceptLabelMap(trackSlug: string, conceptSlugs: string[]): Promise<Map<string, string>> {
  if (conceptSlugs.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from('Concepts')
    .select('slug, label')
    .eq('track_slug', trackSlug)
    .in('slug', conceptSlugs);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map<string, string>(data.map((row) => [row.slug, row.label]));
}

async function buildPracticeSessionCandidatesFromRows(
  trackSlug: string,
  targetDifficulty: PracticeDifficulty,
  rationale: string,
  seed: string,
  rowSources: PracticeRowSources,
  userState?: UserLearningState | null
): Promise<SessionItem[]> {
  if (!isPracticeTrack(trackSlug)) {
    return [];
  }

  const priorityConcepts = buildPracticePriorityConcepts(userState);
  const selectedRows = selectPracticeRowsForSession({
    peraltaRows: rowSources.peraltaRows,
    fallbackRows: rowSources.fallbackRows,
    targetDifficulty,
    seed,
    priorityConcepts,
  });

  if (selectedRows.length === 0) {
    return [];
  }

  const conceptSlugs = Array.from(new Set(
    selectedRows.flatMap((entry) => extractPracticeConceptTags(entry.row))
  ));
  const conceptLabelMap = await fetchConceptLabelMap(trackSlug, conceptSlugs);

  return selectedRows.map(({ row, difficulty, matchedConceptSlug }) => {
    const fallbackConceptSlug = extractPracticeConceptTags(row)[0] || null;
    const resolvedConceptSlug = matchedConceptSlug || fallbackConceptSlug;
    const resolvedConceptLabel = resolvedConceptSlug
      ? (conceptLabelMap.get(resolvedConceptSlug) || formatConceptLabel(resolvedConceptSlug))
      : null;

    return {
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
      targetConcept: resolvedConceptLabel || `${difficulty} interview problem solving`,
      practiceQuestionId: String(row.leetcode_number),
      practiceQuestionUrl: row.leetcode_url,
      practiceDifficulty: difficulty,
      practiceQuestionDescription: row.prompt_full,
      primaryConceptSlug: resolvedConceptSlug,
    };
  });
}

async function getRecentlyItemHrefSets(
  userId: string,
  trackSlug: string,
  googleId?: string
): Promise<{
  finalized: Set<string>;
  completed: Set<string>;
  committed: Set<string>;
}> {
  const maxLookbackMs = Math.max(
    SESSION_FINALIZED_LOOKBACK_HOURS * 60 * 60 * 1000,
    ITEM_COMPLETED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    SESSION_COMMITTED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  );
  const lookbackISO = new Date(Date.now() - maxLookbackMs).toISOString();
  const { data, error } = await supabase
    .from('TelemetryEvents')
    .select('event_type, payload, created_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('track_slug', trackSlug)
    .in('event_type', ['session_finalized', 'item_completed', 'session_committed'])
    .gte('created_at', lookbackISO)
    .order('created_at', { ascending: false })
    .limit(1000);

  const finalized = new Set<string>();
  const completed = new Set<string>();
  const committed = new Set<string>();
  const nowMs = Date.now();
  const finalizedLookbackMs = SESSION_FINALIZED_LOOKBACK_HOURS * 60 * 60 * 1000;
  let finalizedRows = 0;
  let completedRows = 0;
  let committedRows = 0;

  if (error || !data) {
    return { finalized, completed, committed };
  }

  for (const row of data) {
    const eventType = (row as { event_type?: string }).event_type;

    if (eventType === 'session_finalized') {
      const createdAt = (row as { created_at?: string }).created_at;
      const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
      if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs > finalizedLookbackMs) continue;
      if (finalizedRows >= SESSION_FINALIZED_LOOKBACK_ROWS) continue;
      finalizedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const completedItems = (payload as { completedItems?: unknown }).completedItems;
      if (!Array.isArray(completedItems)) continue;
      for (const item of completedItems) {
        if (typeof item !== 'string' || item.length === 0) continue;
        finalized.add(normalizeSessionItemHref(item));
      }
      continue;
    }

    if (eventType === 'item_completed') {
      if (completedRows >= ITEM_COMPLETED_LOOKBACK_ROWS) continue;
      completedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const itemHref = (payload as { itemHref?: unknown }).itemHref;
      if (typeof itemHref !== 'string' || itemHref.length === 0) continue;
      completed.add(normalizeSessionItemHref(itemHref));
    } else if (eventType === 'session_committed') {
      if (committedRows >= SESSION_COMMITTED_LOOKBACK_ROWS) continue;
      committedRows += 1;
      const payload = (row as { payload?: unknown }).payload;
      if (!payload || typeof payload !== 'object') continue;
      const itemHref = (payload as { itemHref?: unknown }).itemHref;
      if (typeof itemHref !== 'string' || itemHref.length === 0) continue;
      committed.add(normalizeSessionItemHref(itemHref));
    }
  }

  return { finalized, completed, committed };
}

interface LearnCandidateCollection {
  fullItems: SessionItem[];
  chunkItems: SessionItem[];
}

export async function getSessionState(
  userId: string,
  preferredTrackSlug?: string,
  googleId?: string,
  options: GetSessionStateOptions = {}
): Promise<SessionState> {
  const normalizedPreferredTrack = normalizeTrackSlug(preferredTrackSlug);
  const [{ summary, library }, onboardingProfile, committedSessionCount] = await Promise.all([
    getProgressSummaryWithLibrary(userId, googleId),
    getOnboardingProfile(userId, googleId),
    getCommittedSessionCount(userId, googleId),
  ]);
  let onboardingBiasedTrackSlug: string | undefined;

  if (!normalizedPreferredTrack && onboardingProfile && committedSessionCount < ONBOARDING_BIAS_MAX_COMMITTED_SESSIONS) {
    onboardingBiasedTrackSlug = normalizeTrackSlug(onboardingProfile.first_launch_track_slug || undefined)
      || mapOnboardingGoalToTrackSlug(onboardingProfile.goal);
  }

  const effectivePreferredTrackSlug = normalizedPreferredTrack || onboardingBiasedTrackSlug;
  const preferredTrack = normalizedPreferredTrack
    ? library.find((pillar) => pillar.slug === normalizedPreferredTrack)
    : effectivePreferredTrackSlug
      ? library.find((pillar) => pillar.slug === effectivePreferredTrackSlug)
      : null;
  const resolvedTrackSlug = preferredTrack?.slug || effectivePreferredTrackSlug || 'dsa';

  const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, options.viewer ?? null);
  const aiPolicySessionPlanEnabled = useGenerative && isFeatureEnabled(
    FeatureFlags.AI_POLICY_SESSION_PLAN,
    options.viewer ?? null
  );
  const aiPolicyScopeEnabled = useGenerative && isFeatureEnabled(
    FeatureFlags.AI_POLICY_SCOPE,
    options.viewer ?? null
  );
  const userState: UserLearningState | null = useGenerative
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

          const primaryConceptSlug = resolvePrimaryConceptSlug(article);
          const intent = useGenerative && userState
            ? deriveStateAwareIntent({
              primaryConceptSlug,
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
              primaryConceptSlug,
              targetConcept: formatConceptLabel(primaryConceptSlug) ?? article.title,
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
                primaryConceptSlug,
                targetConcept:
                  sectionTitle.toLowerCase() === 'introduction'
                    ? (formatConceptLabel(primaryConceptSlug) ?? article.title)
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
  const {
    finalized: recentlyFinalizedItemHrefs,
    completed: recentlyCompletedItemHrefs,
    committed: recentlyCommittedItemHrefs,
  } = useGenerative
    ? await getRecentlyItemHrefSets(userId, plannerTrackSlug, googleId)
    : { finalized: new Set<string>(), completed: new Set<string>(), committed: new Set<string>() };
  const recentExclusionHrefs = new Set<string>([
    ...Array.from(recentlyFinalizedItemHrefs),
    ...Array.from(recentlyCompletedItemHrefs),
    ...Array.from(recentlyCommittedItemHrefs),
  ]);
  if (recentExclusionHrefs.size > 0) {
    articleCandidates = articleCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)));
    sectionCandidates = sectionCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)));
  }
  const dayKey = getDayKeyUTC();
  let practicePerformance: PracticePerformance | null = null;
  let practiceCandidates: SessionItem[] = [];
  if (useGenerative) {
    const [derivedPracticePerformance, practiceRowSources] = await Promise.all([
      derivePracticePerformance(userId, googleId),
      fetchPracticeRowSources(),
    ]);
    practicePerformance = derivedPracticePerformance;
    practiceCandidates = await buildPracticeSessionCandidatesFromRows(
      plannerTrackSlug,
      practicePerformance.targetDifficulty,
      practicePerformance.rationale,
      `${userId}:${plannerTrackSlug}:${dayKey}`,
      practiceRowSources,
      userState
    );
  }
  const filteredPracticeCandidates = recentExclusionHrefs.size > 0
    ? practiceCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)))
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
  const personalizationProfile = buildSessionPersonalizationProfile({
    selectedTrackSlug: plannerTrackSlug,
    onboardingGoal: onboardingProfile?.goal ?? null,
    onboardingTrackSlug: normalizeTrackSlug(onboardingProfile?.first_launch_track_slug || undefined) ?? null,
    onboardingBiasActive: Boolean(onboardingBiasedTrackSlug && !normalizedPreferredTrack),
    committedSessionCount,
    stubbornConceptCount: userState?.stubbornConcepts.length ?? 0,
    failureModeCount: userState?.failureModes.length ?? 0,
    outcomeSignals: outcomeSignals ?? {
      completionRate: summary.totalArticles > 0 ? summary.completedArticles / summary.totalArticles : 0.6,
      timeAdherence: Math.min(1, weeklyCompletions / 6),
      nextDayReturnRate: summary.streakDays >= 2 ? 1 : summary.streakDays === 1 ? 0.6 : 0.2,
      ritualQuality: userState?.lastInternalization ? 0.65 : 0.45,
    },
  });

  let sessionItems = articleCandidates.slice(0, 3);
  let planPolicyDecisionId: string | null = null;
  let scopePolicyDecisionId: string | null = null;
  let policyFallbackUsed = false;

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
    const requirePracticeItem = isPracticeTrack(plannerTrackSlug) && filteredPracticeCandidates.length > 0 && articleCandidates.length < 2;
    const deterministicPlan = buildHeuristicPlan({
      candidates: plannerCandidates,
      maxItems: 3,
      requirePracticeItem,
      userState,
      personalizationProfile,
      outcomeSignals,
      recentActivityTitles: summary.recentActivity.map((activity) => activity.title),
    });
    const plannerCandidateSet = new Set(plannerCandidates.map((candidate) => candidate.item.href));
    const sessionPlanLockKey = `session-plan-lock:v1:${userId}:${plannerTrackSlug}`;
    const existingPlanLock = await getFromCache<SessionPlanLock>(sessionPlanLockKey);

    const isLockValid = existingPlanLock &&
      Array.isArray(existingPlanLock.items) &&
      existingPlanLock.items.length > 0 &&
      Array.isArray(existingPlanLock.itemHrefs) &&
      existingPlanLock.itemHrefs.every((href) => {
        const normalized = normalizeSessionItemHref(href);
        const itemInLock = existingPlanLock.items.find(i => i.href === href);
        const inDbCompletions = itemInLock?.articleId ? completedIds.has(itemInLock.articleId) : false;
        return plannerCandidateSet.has(href) && !recentExclusionHrefs.has(normalized) && !inDbCompletions;
      });

    if (isLockValid) {
      sessionItems = existingPlanLock.items.slice(0, 3);
      if (aiPolicySessionPlanEnabled) {
        const selectedIds = sessionItems
          .map((item) => plannerCandidates.find((candidate) => candidate.item.href === item.href)?.id)
          .filter((id): id is string => Boolean(id));
        const lockedPlanDecision = await logAIDecision({
          decisionType: 'session_plan',
          decisionMode: 'auto',
          trackSlug: plannerTrackSlug,
          stepIndex: null,
          actorEmail: userId,
          model: 'locked-plan',
          promptVersion: POLICY_PROMPT_VERSION,
          confidence: 1,
          rationale: 'Reused valid session plan lock.',
          inputJson: {
            source: 'session_plan_lock',
            candidateCount: plannerCandidates.length,
            requirePracticeItem,
          },
          outputJson: {
            selectedIds,
            selectedHrefs: sessionItems.map((item) => item.href),
          },
          applied: true,
          source: 'ai_policy',
          decisionScope: 'planner',
          decisionTarget: `home_gate:${userId}`,
          fallbackUsed: false,
          latencyMs: 0,
          errorCode: null,
          dedupeKey: buildAIDecisionDedupeKey({
            decisionType: 'session_plan',
            decisionMode: 'auto',
            decisionScope: 'planner',
            trackSlug: plannerTrackSlug,
            stepIndex: null,
            source: 'ai_policy',
            decisionTarget: `home_gate:${userId}`,
          }),
        });
        planPolicyDecisionId = lockedPlanDecision.id;
      }
    } else {
      if (aiPolicySessionPlanEnabled && plannerCandidates.length > 0) {
        const baseLearnCandidate = sectionCandidates[0] || articleCandidates[0] || null;
        const deterministicFallbackItems = deterministicPlan.length > 0
          ? deterministicPlan
          : (filteredPracticeCandidates[0]
            ? (baseLearnCandidate
              ? [baseLearnCandidate, filteredPracticeCandidates[0]]
              : [filteredPracticeCandidates[0]])
            : []);
        const fallbackSelectedIds = deterministicFallbackItems
          .map((item) => plannerCandidates.find((candidate) => candidate.item.href === item.href)?.id)
          .filter((id): id is string => !!id);

        const planPolicy = await decideSessionPlanPolicy({
          trackSlug: plannerTrackSlug,
          trackName: plannerTrackName,
          maxItems: 3,
          requirePracticeItem,
          recentActivityTitles: summary.recentActivity.map((activity) => activity.title),
          candidates: plannerCandidates.slice(0, 12).map((candidate) => ({
            id: candidate.id,
            type: candidate.item.type,
            title: candidate.item.title,
            estMinutes: candidate.item.estMinutes ?? 5,
            targetConcept: candidate.item.targetConcept ?? null,
          })),
          fallbackOutput: {
            selectedIds: fallbackSelectedIds.length > 0
              ? fallbackSelectedIds
              : plannerCandidates.slice(0, 3).map((candidate) => candidate.id),
            reasonSummary: 'Deterministic fallback session plan.',
          },
        });

        const selectedByPolicy = applySessionPlanPolicySelection({
          selectedIds: planPolicy.output.selectedIds,
          candidates: plannerCandidates,
          maxItems: 3,
          requirePracticeItem,
        });
        sessionItems = selectedByPolicy.length > 0 ? selectedByPolicy : deterministicFallbackItems;
        if (selectedByPolicy.length === 0) {
          policyFallbackUsed = true;
        }
        policyFallbackUsed = policyFallbackUsed || planPolicy.fallbackUsed;

        const planDecision = await logAIDecision({
          decisionType: 'session_plan',
          decisionMode: 'auto',
          trackSlug: plannerTrackSlug,
          stepIndex: null,
          actorEmail: userId,
          model: planPolicy.model,
          promptVersion: POLICY_PROMPT_VERSION,
          confidence: planPolicy.confidence,
          rationale: planPolicy.output.reasonSummary,
          inputJson: {
            candidateCount: plannerCandidates.length,
            requirePracticeItem,
            recentActivityTitles: summary.recentActivity.map((activity) => activity.title).slice(0, 6),
          },
          outputJson: {
            selectedIds: planPolicy.output.selectedIds,
            selectedHrefs: sessionItems.map((item) => item.href),
          },
          applied: true,
          source: 'ai_policy',
          decisionScope: 'planner',
          decisionTarget: `home_gate:${userId}`,
          fallbackUsed: planPolicy.fallbackUsed,
          latencyMs: planPolicy.latencyMs,
          errorCode: planPolicy.errorCode === 'none' ? null : planPolicy.errorCode,
          dedupeKey: buildAIDecisionDedupeKey({
            decisionType: 'session_plan',
            decisionMode: 'auto',
            decisionScope: 'planner',
            trackSlug: plannerTrackSlug,
            stepIndex: null,
            source: 'ai_policy',
            decisionTarget: `home_gate:${userId}`,
          }),
        });
        planPolicyDecisionId = planDecision.id;
      } else {
        const plannedItems = await planSessionItemsWithLLM({
          cacheKey: `${userId}:${plannerTrackSlug}:${dayKey}:${plannerCandidates.map((c) => c.id).join('|')}`,
          budgetKey: `${userId}:${dayKey}`,
          trackSlug: plannerTrackSlug,
          trackName: plannerTrackName,
          userState,
          personalizationProfile,
          recentActivityTitles: summary.recentActivity.map((activity) => activity.title),
          outcomeSignals,
          practiceTargetDifficulty: practicePerformance?.targetDifficulty || null,
          requirePracticeItem,
          candidates: plannerCandidates,
          maxItems: 3,
        });

        if (plannedItems && plannedItems.length > 0) {
          sessionItems = plannedItems;
          console.log('[AI Session Planner] Selected Items:', sessionItems.map(item => ({
            id: item.slug || item.practiceQuestionId,
            estMinutes: item.estMinutes,
            articleId: item.articleId,
            concepts: item.primaryConceptSlug ? [item.primaryConceptSlug] : [],
            intent: item.intent.text
          })));
        } else if (filteredPracticeCandidates.length > 0) {
          if (articleCandidates.length >= 2) {
            sessionItems = articleCandidates.slice(0, 3);
          } else {
            const baseLearn = sectionCandidates[0] || articleCandidates[0] || null;
            sessionItems = baseLearn
              ? [baseLearn, filteredPracticeCandidates[0]]
              : [filteredPracticeCandidates[0]];
          }
        } else if (deterministicPlan.length > 0) {
          sessionItems = deterministicPlan;
        }
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

  let personalizationExperiment: PersonalizationScopeExperiment | null = null;
  if (useGenerative && options.enablePersonalizationScopeExperiment && sessionItems.length > 0) {
    const baselineItems = sessionItems.slice(0, 3);
    const scopeResult = applyPersonalizationScopeExperiment({
      userId,
      items: baselineItems,
      profile: personalizationProfile,
    });
    sessionItems = scopeResult.items as SessionItem[];
    personalizationExperiment = scopeResult.experiment;
  }

  if (useGenerative && aiPolicyScopeEnabled && sessionItems.length > 0) {
    const baselineItems = sessionItems.slice(0, 3);
    const fallbackScope = {
      maxItems: personalizationExperiment?.maxItems ?? 3,
      maxMinutes: personalizationExperiment?.maxMinutes ?? 22,
      reasonSummary: 'Deterministic scope fallback.',
    };
    const scopePolicy = await decideScopePolicy({
      trackSlug: plannerTrackSlug,
      goal: onboardingProfile?.goal ?? null,
      profileSegment: personalizationProfile.segment,
      baselineItemCount: baselineItems.length,
      baselineMinutes: sumSessionItemMinutes(baselineItems),
      candidateMinutes: baselineItems.map((item) => item.estMinutes ?? 5),
      fallbackOutput: fallbackScope,
    });

    sessionItems = trimSessionItemsByScope(baselineItems, {
      maxItems: scopePolicy.output.maxItems,
      maxMinutes: scopePolicy.output.maxMinutes,
    });
    if (personalizationExperiment) {
      personalizationExperiment = {
        ...personalizationExperiment,
        maxItems: scopePolicy.output.maxItems,
        maxMinutes: scopePolicy.output.maxMinutes,
        finalItemCount: sessionItems.length,
        finalMinutes: sumSessionItemMinutes(sessionItems),
      };
    }
    policyFallbackUsed = policyFallbackUsed || scopePolicy.fallbackUsed;

    const scopeDecision = await logAIDecision({
      decisionType: 'scope_policy',
      decisionMode: 'auto',
      trackSlug: plannerTrackSlug,
      stepIndex: null,
      actorEmail: userId,
      model: scopePolicy.model,
      promptVersion: POLICY_PROMPT_VERSION,
      confidence: scopePolicy.confidence,
      rationale: scopePolicy.output.reasonSummary,
      inputJson: {
        baselineItemCount: baselineItems.length,
        baselineMinutes: sumSessionItemMinutes(baselineItems),
        profileSegment: personalizationProfile.segment,
        onboardingGoal: onboardingProfile?.goal ?? null,
      },
      outputJson: {
        maxItems: scopePolicy.output.maxItems,
        maxMinutes: scopePolicy.output.maxMinutes,
        finalItemCount: sessionItems.length,
        finalMinutes: sumSessionItemMinutes(sessionItems),
      },
      applied: true,
      source: 'ai_policy',
      decisionScope: 'scope',
      decisionTarget: `home_gate:${userId}`,
      fallbackUsed: scopePolicy.fallbackUsed,
      latencyMs: scopePolicy.latencyMs,
      errorCode: scopePolicy.errorCode === 'none' ? null : scopePolicy.errorCode,
      dedupeKey: buildAIDecisionDedupeKey({
        decisionType: 'scope_policy',
        decisionMode: 'auto',
        decisionScope: 'scope',
        trackSlug: plannerTrackSlug,
        stepIndex: null,
        source: 'ai_policy',
        decisionTarget: `home_gate:${userId}`,
      }),
    });
    scopePolicyDecisionId = scopeDecision.id;
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
    personalization: personalizationProfile,
    personalizationExperiment,
    planPolicyDecisionId,
    scopePolicyDecisionId,
    policyFallbackUsed,
  };
}

function getPillarName(slug: string, library: LearningPillarWithTopics[]): string {
  const pillar = library.find((p) => p.slug === slug);
  return pillar?.name || slug.replace(/-/g, ' ');
}
