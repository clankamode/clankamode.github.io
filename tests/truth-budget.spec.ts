import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Truth Budget (Static Analysis)', () => {

    const SRC_DIR = path.join(process.cwd(), 'src');

    // Helper to recursively find files
    function getFiles(dir: string): string[] {
        const files: string[] = [];
        fs.readdirSync(dir).forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                files.push(...getFiles(fullPath));
            } else {
                files.push(fullPath);
            }
        });
        return files;
    }

    const allFiles = getFiles(SRC_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    test('No "Extend session" negotiation anywhere', () => {
        // We banned negotiation. It must not sneak back in.
        let violation = false;
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes('Extend session') && !file.includes('.spec.ts')) {
                console.error(`Violation in ${file}: Found "Extend session"`);
                violation = true;
            }
        }
        expect(violation).toBe(false);
    });

    test('No "Focus endurance" filler delta', () => {
        // We banned fake praise.
        let violation = false;
        for (const file of allFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes('Focus endurance') && !file.includes('.spec.ts')) {
                console.error(`Violation in ${file}: Found "Focus endurance"`);
                violation = true;
            }
        }
        expect(violation).toBe(false);
    });

    test('Micro-session CTA is strictly backed by proposal', () => {
        // SessionExitView must check `microSessionProposal` before rendering the button.
        const exitViewPath = path.join(SRC_DIR, 'app/home/_components/SessionExitView.tsx');
        const content = fs.readFileSync(exitViewPath, 'utf-8');

        // Naive static check: ensure the button rendering is guarded
        // We look for the variable check close to the rendering.
        // This is hard to regex perfectly, but we can check if the code *looks* like it guards it.

        const hasGuard = content.includes('state.exit.microSessionProposal &&');
        expect(hasGuard).toBe(true);
    });

});
