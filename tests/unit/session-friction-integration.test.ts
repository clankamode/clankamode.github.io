import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('session friction integration wiring', () => {
  it('wires classifier and silent emissions in SessionContext', () => {
    const source = readWorkspaceFile('src/contexts/SessionContext.tsx');

    expect(source).toContain('classifyFriction');
    expect(source).toContain('logFrictionSnapshotAction');
    expect(source).toContain("eventType: 'friction_state_changed'");
    expect(source).toContain('emitFrictionSnapshot');
    expect(source).toContain("PRACTICE_BLOCKED_EVENT_NAME = 'session:practice-blocked'");
  });

  it('keeps progression lock path intact', () => {
    const source = readWorkspaceFile('src/contexts/SessionContext.tsx');

    expect(source).toContain('runWithTransitionLock');
    expect(source).toContain("runWithTransitionLock('advancing'");
    expect(source).toContain("runWithTransitionLock('finalizing'");
  });
});
