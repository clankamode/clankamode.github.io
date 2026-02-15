import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('session finalize durability', () => {
  it('finalizes on page hide with beacon/keepalive fallback', () => {
    const source = readWorkspaceFile('src/app/home/_components/SessionExitView.tsx');

    expect(source).toContain('navigator.sendBeacon');
    expect(source).toContain("window.addEventListener('pagehide'");
    expect(source).toContain("document.addEventListener('visibilitychange'");
    expect(source).toContain('keepalive: true');
  });
});

