import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('SessionRail', () => {
  test('styles current step louder than completed steps', () => {
    const source = readWorkspaceFile('src/components/session/SessionRail.tsx');

    expect(source).toContain('data-session-rail-state={railState}');
    expect(source).toContain("const railState = isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming';");
    expect(source).toContain("border-accent-primary bg-accent-primary/12 text-accent-primary ring-1 ring-accent-primary/25");
    expect(source).toContain("border-border-interactive/60 bg-surface-interactive/22 text-text-secondary");
    expect(source).toContain('{isCurrent ? null : (');
    expect(source).toContain("isCompleted ? 'text-text-secondary' : 'text-text-muted'");
    expect(source).toContain('title={itemLabel}');
  });
});
