import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXECUTION_SURFACE_LAYOUT_CLASS,
  EXECUTION_SURFACE_MAX_WIDTH_CLASS,
  EXECUTION_SURFACE_MAX_WIDTH_PX,
} from '@/components/session/ExecutionSurface';
import {
  READING_GRID_MEASURE_CH,
  READING_GRID_VERTICAL_CADENCE_PX,
} from '@/components/session/ReadingGrid';

const readWorkspaceFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('execution reading surface invariants', () => {
  it('uses a single canonical execution width between 720px and 760px', () => {
    expect(EXECUTION_SURFACE_MAX_WIDTH_PX).toBeGreaterThanOrEqual(720);
    expect(EXECUTION_SURFACE_MAX_WIDTH_PX).toBeLessThanOrEqual(760);
    expect(EXECUTION_SURFACE_MAX_WIDTH_CLASS).toBe('max-w-[744px]');
    expect(EXECUTION_SURFACE_LAYOUT_CLASS).toContain(EXECUTION_SURFACE_MAX_WIDTH_CLASS);
  });

  it('defines reading grid tokens for measure and cadence', () => {
    expect(READING_GRID_MEASURE_CH).toBeGreaterThanOrEqual(60);
    expect(READING_GRID_MEASURE_CH).toBeLessThanOrEqual(75);
    expect(READING_GRID_VERTICAL_CADENCE_PX).toBeGreaterThan(0);
  });

  it('applies execution surface token classes in shell and hud without legacy width classes', () => {
    const shellSource = readWorkspaceFile('src/components/session/SessionReaderShell.tsx');
    const hudSource = readWorkspaceFile('src/components/session/SessionHUD.tsx');
    const surfaceSource = readWorkspaceFile('src/components/session/ExecutionSurface.tsx');
    const layoutSwitcherSource = readWorkspaceFile('src/app/learn/_components/ArticleLayoutSwitcher.tsx');

    expect(shellSource).toContain('ExecutionSurface');
    expect(shellSource).toContain('SessionRail');
    expect(shellSource).not.toContain('max-w-3xl');
    expect(surfaceSource).toContain('ReadingGrid');
    expect(hudSource).toContain('EXECUTION_SURFACE_LAYOUT_CLASS');
    expect(hudSource).not.toContain('max-w-screen-xl');
    expect(layoutSwitcherSource).toContain('SessionReaderShell');
    expect(layoutSwitcherSource).not.toContain('SessionCommitControl');
  });
});
