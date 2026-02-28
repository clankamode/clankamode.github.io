import type { MicroSessionProposal } from '@/lib/session-micro';
import type { MicroProposal } from '@/types/micro';
import {
  LAST_MICRO_CONCEPT_STORAGE_KEY,
  SESSION_STATE_STORAGE_KEY,
  type SessionState,
} from '@/contexts/session-context/types';

export function toSessionProposal(p: MicroProposal): MicroSessionProposal {
  return {
    id: crypto.randomUUID(),
    label: `Next: ${p.item.title} (${p.item.estMinutes} min)`,
    estimatedMinutes: p.item.estMinutes,
    intent: { type: p.intent.type, text: p.intent.text },
    items: [{ title: p.item.title, href: p.item.href, type: p.item.type === 'learn' ? 'article' : 'exercise' }],
  };
}

export function getLastMicroConcept(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(LAST_MICRO_CONCEPT_STORAGE_KEY);
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function setLastMicroConcept(conceptSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_MICRO_CONCEPT_STORAGE_KEY, conceptSlug);
  } catch {
  }
}

export function loadPersistedSessionState(): SessionState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(SESSION_STATE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed || !parsed.phase || parsed.phase === 'idle') return null;

    const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;
    if (parsed.execution?.startedAt) {
      const age = Date.now() - new Date(parsed.execution.startedAt).getTime();
      if (age > SESSION_MAX_AGE_MS) {
        window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
        return null;
      }
    }

    return {
      ...parsed,
      execution: parsed.execution
        ? {
          ...parsed.execution,
          startedAt: new Date(parsed.execution.startedAt),
          transitionStatus: 'ready',
        }
        : null,
      transitionStatus: 'ready',
    };
  } catch {
    window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
    return null;
  }
}

export function persistSessionState(state: SessionState): void {
  if (typeof window === 'undefined') return;

  if (state.phase === 'idle') {
    window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_STATE_STORAGE_KEY, JSON.stringify(state));
}
