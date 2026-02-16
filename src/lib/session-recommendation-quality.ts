export interface CommittedEventInput {
  userKey: string;
  createdAt: string;
  href: string;
  sessionId: string;
}

export interface CompletedEventInput {
  sessionId: string;
  createdAt: string;
  href: string;
}

export interface FinalizedEventInput {
  sessionId: string;
  createdAt: string;
}

export interface DailyRepeatMetric {
  date: string;
  totalCommitted: number;
  repeatedCommitted: number;
  repeatRate: number;
}

export interface UserDailyRepeatMetric extends DailyRepeatMetric {
  userKey: string;
}

export interface ItemRepeatMetric {
  href: string;
  repeatedCount: number;
  totalCommitted: number;
  repeatRate: number;
}

export interface FunnelMetric {
  href: string;
  committedSessions: number;
  completedFirstItemSessions: number;
  finalizedSessions: number;
}

export interface RepeatAnalysisResult {
  daily: DailyRepeatMetric[];
  userDailyAlerts: UserDailyRepeatMetric[];
  itemRepeats: ItemRepeatMetric[];
}

export function normalizeTelemetryHref(href: string): string {
  return href.split('?')[0].split('#')[0];
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildRepeatAnalysis(
  committedEvents: CommittedEventInput[],
  options?: { lookbackDays?: number; alertThreshold?: number }
): RepeatAnalysisResult {
  const lookbackDays = options?.lookbackDays ?? 7;
  const alertThreshold = options?.alertThreshold ?? 0.2;
  const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;

  const byUser = new Map<string, Array<{ ts: number; href: string }>>();
  const daily = new Map<string, { totalCommitted: number; repeatedCommitted: number }>();
  const userDaily = new Map<string, { userKey: string; date: string; totalCommitted: number; repeatedCommitted: number }>();
  const item = new Map<string, { totalCommitted: number; repeatedCommitted: number }>();

  const sorted = [...committedEvents].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const event of sorted) {
    const ts = new Date(event.createdAt).getTime();
    if (!Number.isFinite(ts)) continue;

    const date = dayKey(new Date(ts));
    const history = byUser.get(event.userKey) || [];
    const recentHistory = history.filter((entry) => ts - entry.ts <= lookbackMs);
    const repeated = recentHistory.some((entry) => entry.href === event.href);

    recentHistory.push({ ts, href: event.href });
    byUser.set(event.userKey, recentHistory);

    const dailyCurrent = daily.get(date) || { totalCommitted: 0, repeatedCommitted: 0 };
    dailyCurrent.totalCommitted += 1;
    if (repeated) dailyCurrent.repeatedCommitted += 1;
    daily.set(date, dailyCurrent);

    const userDateKey = `${event.userKey}::${date}`;
    const userCurrent = userDaily.get(userDateKey) || {
      userKey: event.userKey,
      date,
      totalCommitted: 0,
      repeatedCommitted: 0,
    };
    userCurrent.totalCommitted += 1;
    if (repeated) userCurrent.repeatedCommitted += 1;
    userDaily.set(userDateKey, userCurrent);

    const itemCurrent = item.get(event.href) || { totalCommitted: 0, repeatedCommitted: 0 };
    itemCurrent.totalCommitted += 1;
    if (repeated) itemCurrent.repeatedCommitted += 1;
    item.set(event.href, itemCurrent);
  }

  const dailyRows = Array.from(daily.entries())
    .map(([date, value]) => ({
      date,
      totalCommitted: value.totalCommitted,
      repeatedCommitted: value.repeatedCommitted,
      repeatRate: value.totalCommitted > 0 ? value.repeatedCommitted / value.totalCommitted : 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const userDailyRows = Array.from(userDaily.values())
    .map((row) => ({
      ...row,
      repeatRate: row.totalCommitted > 0 ? row.repeatedCommitted / row.totalCommitted : 0,
    }))
    .filter((row) => row.repeatRate > alertThreshold)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.repeatRate - a.repeatRate;
    });

  const itemRows = Array.from(item.entries())
    .map(([href, value]) => ({
      href,
      repeatedCount: value.repeatedCommitted,
      totalCommitted: value.totalCommitted,
      repeatRate: value.totalCommitted > 0 ? value.repeatedCommitted / value.totalCommitted : 0,
    }))
    .sort((a, b) => b.repeatedCount - a.repeatedCount);

  return {
    daily: dailyRows,
    userDailyAlerts: userDailyRows,
    itemRepeats: itemRows,
  };
}

export function buildFunnelByFirstItem(
  committedEvents: CommittedEventInput[],
  completedEvents: CompletedEventInput[],
  finalizedEvents: FinalizedEventInput[]
): FunnelMetric[] {
  const completedBySession = new Map<string, Set<string>>();
  const finalizedSessions = new Set(finalizedEvents.map((event) => event.sessionId));

  for (const event of completedEvents) {
    const current = completedBySession.get(event.sessionId) || new Set<string>();
    current.add(event.href);
    completedBySession.set(event.sessionId, current);
  }

  const funnel = new Map<string, { committed: Set<string>; completed: Set<string>; finalized: Set<string> }>();

  for (const committed of committedEvents) {
    const row = funnel.get(committed.href) || {
      committed: new Set<string>(),
      completed: new Set<string>(),
      finalized: new Set<string>(),
    };

    row.committed.add(committed.sessionId);

    if (completedBySession.get(committed.sessionId)?.has(committed.href)) {
      row.completed.add(committed.sessionId);
    }

    if (finalizedSessions.has(committed.sessionId)) {
      row.finalized.add(committed.sessionId);
    }

    funnel.set(committed.href, row);
  }

  return Array.from(funnel.entries())
    .map(([href, row]) => ({
      href,
      committedSessions: row.committed.size,
      completedFirstItemSessions: row.completed.size,
      finalizedSessions: row.finalized.size,
    }))
    .sort((a, b) => b.committedSessions - a.committedSessions);
}
