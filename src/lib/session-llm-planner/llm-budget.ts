import { getFromCache, setInCache } from '@/lib/redis';
import { PLANNER_DAILY_CALL_BUDGET } from '@/lib/session-llm-planner/config';

function secondsUntilNextUTCDay(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
}

export async function consumeBudgetCall(budgetKey: string | null): Promise<boolean> {
  if (!budgetKey) return true;
  const cacheKey = `session-plan-budget:v1:${budgetKey}`;
  const current = await getFromCache<{ calls: number }>(cacheKey);
  const calls = current?.calls ?? 0;
  if (calls >= PLANNER_DAILY_CALL_BUDGET) return false;
  await setInCache(cacheKey, { calls: calls + 1 }, secondsUntilNextUTCDay());
  return true;
}

export function deriveBudgetKeyFromCacheKey(cacheKey?: string): string | null {
  if (!cacheKey) return null;
  const parts = cacheKey.split(':');
  if (parts.length < 3) return null;
  return `${parts[0]}:${parts[2]}`;
}

export function getCacheTTLSeconds(): number {
  return secondsUntilNextUTCDay();
}
