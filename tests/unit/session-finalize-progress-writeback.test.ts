import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('session finalize progress writeback', () => {
  it('writes completed learn items into UserArticleProgress', () => {
    const source = readWorkspaceFile('src/app/api/session/finalize/route.ts');

    expect(source).toContain("const PROGRESS_TABLE = 'UserArticleProgress'");
    expect(source).toContain('extractLearnArticleSlugsFromCompletedItems');
    expect(source).toContain(".from(PROGRESS_TABLE)");
    expect(source).toContain(".upsert(progressRows, { onConflict: 'email,article_id' })");
  });
});
