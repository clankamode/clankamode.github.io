import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveTutorSessionContext } from '@/app/ai/_components/TutorChat';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('tutor session-aware wiring', () => {
  it('derives checklistProgress correctly from session completion', () => {
    const baseState = {
      execution: {
        sessionId: 'sess-1',
        completedItems: [] as string[],
        startedAt: new Date().toISOString(),
        currentIndex: 0,
      },
      scope: {
        items: [{ title: 'Step 1' }, { title: 'Step 2' }],
      },
    };

    const noItemsComplete = deriveTutorSessionContext(baseState, true);
    expect(noItemsComplete.checklistProgress).toBe(0);

    const allItemsComplete = deriveTutorSessionContext(
      {
        ...baseState,
        execution: {
          ...baseState.execution,
          completedItems: ['a', 'b'],
        },
      },
      true
    );
    expect(allItemsComplete.checklistProgress).toBe(100);
  });

  it('derives positive sessionElapsedMs when a session is active', () => {
    const now = Date.now();
    const derived = deriveTutorSessionContext(
      {
        execution: {
          sessionId: 'sess-2',
          completedItems: [],
          startedAt: new Date(now - 5_000).toISOString(),
          currentIndex: 0,
        },
        scope: { items: [{ title: 'Step 1' }] },
      },
      true,
      now
    );

    expect(derived.sessionElapsedMs).toBeGreaterThan(0);
  });

  it('returns undefined currentChecklistItem when not in session', () => {
    const derived = deriveTutorSessionContext(
      {
        execution: {
          sessionId: 'sess-3',
          completedItems: [],
          startedAt: new Date().toISOString(),
          currentIndex: 0,
        },
        scope: { items: [{ title: 'Step 1' }] },
      },
      false
    );

    expect(derived.currentChecklistItem).toBeUndefined();
  });

  it('API route accepts and stores session_uuid', () => {
    const source = readWorkspaceFile('src/app/api/tutor/route.ts');

    expect(source).toContain('sessionId?: string | null;');
    expect(source).toContain('currentChecklistItem?: string;');
    expect(source).toContain('conversationId: rawConversationId');
    expect(source).toContain('const resolvedConversationId = normalizeConversationId(rawConversationId);');
    expect(source).toContain('session_uuid: resolvedSessionUuid');
  });

  it('passes currentChecklistItem into buildTutorSystemPrompt as checklistItem', () => {
    const source = readWorkspaceFile('src/app/api/tutor/route.ts');

    expect(source).toContain('checklistItem: resolvedChecklistItem');
  });

  it('rate limits tutor requests by counting per-request events instead of conversations', () => {
    const source = readWorkspaceFile('src/app/api/tutor/route.ts');

    expect(source).toContain("from('TutorRequestEvents')");
    expect(source).toContain(".select('id', { count: 'exact', head: true })");
    expect(source).toContain('.insert({ user_id: userId })');
  });
});
