import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('session writeback integration', () => {
  it('calls updateUserConceptStats from session completion delta path', () => {
    const sessionContextSource = [
      'src/contexts/SessionContext.tsx',
      'src/contexts/session-context/advance.ts',
      'src/contexts/session-context/finalize.ts',
    ].map((f) => readWorkspaceFile(f)).join('\n');

    expect(sessionContextSource).toContain('updateUserConceptStats');
    expect(sessionContextSource).toContain('result.debugInfo.seenTags');
    expect(sessionContextSource).toContain('await updateUserConceptStats(');
  });
});

