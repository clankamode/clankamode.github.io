/**
 * Validates InterviewQuestions table integrity:
 * - Prompt in starter_code comments
 * - Line length <= 80 chars in docstrings
 * - 2D arrays formatted with each row on new line
 * - Trees/graphs/linked lists have visual diagrams
 * - Test cases exist and pass sanity checks
 * - Required fields, valid difficulty, etc.
 *
 * Run: npm run validate_interview_questions
 * Exit: 0 if all pass, 1 if any errors (for future use as test)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_LINE_LEN = 80;
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** Categories and name patterns that should have visual diagrams. */
function needsVisualDiagram(category: string | null, name: string): boolean {
  if (['Trees', 'Graphs', 'Linked Lists'].includes(category ?? '')) return true;
  const lower = name.toLowerCase();
  return (
    lower.includes('tree') ||
    lower.includes('graph') ||
    lower.includes('linked list') ||
    lower.includes('trie') ||
    lower.includes('maze') ||
    lower.includes('island') ||
    lower.includes('province') ||
    lower.includes('route') ||
    lower.includes('flights')
  );
}

interface Issue {
  severity: 'error' | 'warning';
  message: string;
}

interface ValidationResult {
  name: string;
  id: string;
  issues: Issue[];
}

/** Extract docstring content from starter_code. */
function extractDocstring(code: string): string | null {
  const dq = code.match(/"""([\s\S]*?)"""/);
  const sq = code.match(/'''([\s\S]*?)'''/);
  if (dq && (!sq || code.indexOf('"""') < code.indexOf("'''"))) {
    return dq[1];
  }
  if (sq) return sq[1];
  return null;
}

/** Check if 2D array is inline (not formatted with rows on separate lines). */
function hasInline2DArray(text: string): boolean {
  return /\[\[\d[^\]]*\],\[/.test(text) || /\[\["[^"]*"[^\]]*\],\[/.test(text);
}

/** Check if text has visual diagram elements (arrows, tree chars). */
function hasVisualDiagram(text: string): boolean {
  return (
    /[\\\/|]/.test(text) ||
    /->/.test(text) ||
    /<->/.test(text) ||
    /<--/.test(text) ||
    /\^[_\-]*\|/.test(text) ||
    /\/ \\/.test(text)
  );
}

/** Extract main solution function name (excludes __init__ and class helpers). */
function extractMainFunction(code: string): string | null {
  const matches = [...code.matchAll(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)];
  const names = matches.map((m) => m[1]).filter((n) => n !== '__init__');
  return names.length > 0 ? names[names.length - 1] : null;
}

function validate(row: Record<string, unknown>): ValidationResult {
  const issues: Issue[] = [];
  const name = row.name as string;
  const id = row.id as string;
  const promptFull = (row.prompt_full as string) ?? '';
  const starterCode = (row.starter_code as string) ?? '';
  const testCases = (row.test_cases as unknown[]) ?? [];
  const difficulty = (row.difficulty as string) ?? '';
  const category = (row.category as string) ?? '';
  const leetcodeNumber = row.leetcode_number as number | null | undefined;

  // Required fields
  if (!name?.trim()) issues.push({ severity: 'error', message: 'Missing name' });
  if (!promptFull?.trim()) issues.push({ severity: 'error', message: 'Missing prompt_full' });
  if (!starterCode?.trim()) issues.push({ severity: 'error', message: 'Missing starter_code' });
  if (!difficulty) issues.push({ severity: 'error', message: 'Missing difficulty' });
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    issues.push({ severity: 'error', message: `Invalid difficulty: ${difficulty}` });
  }
  if (
    leetcodeNumber != null &&
    (typeof leetcodeNumber !== 'number' || leetcodeNumber < 1 || !Number.isInteger(leetcodeNumber))
  ) {
    issues.push({ severity: 'warning', message: 'leetcode_number should be a positive integer' });
  }

  const docstring = extractDocstring(starterCode);

  // Prompt in starter_code
  if (docstring && promptFull) {
    const promptStart = promptFull.trim().slice(0, 100).replace(/\s+/g, ' ');
    const docNormalized = docstring.replace(/\s+/g, ' ');
    if (!docNormalized.includes(promptStart.slice(0, 50))) {
      issues.push({
        severity: 'error',
        message: 'Starter code docstring does not contain prompt_full (key content missing)',
      });
    }
  } else if (!docstring && starterCode.trim()) {
    issues.push({ severity: 'error', message: 'Starter code has no docstring' });
  }

  // Line length
  if (docstring) {
    const lines = docstring.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > MAX_LINE_LEN) {
        issues.push({
          severity: 'error',
          message: `Line ${i + 1} exceeds ${MAX_LINE_LEN} chars (${lines[i].length})`,
        });
      }
    }
  }

  // 2D arrays formatted
  if (docstring && hasInline2DArray(docstring)) {
    issues.push({
      severity: 'error',
      message: 'Docstring has inline 2D array; each row should be on its own line',
    });
  }

  // Trees/graphs/linked lists need visual diagrams
  if (needsVisualDiagram(category, name) && docstring && !hasVisualDiagram(docstring)) {
    issues.push({
      severity: 'warning',
      message: 'Tree/graph/linked-list question should have ASCII diagram for visualization',
    });
  }

  // Test cases
  if (!Array.isArray(testCases) || testCases.length === 0) {
    issues.push({ severity: 'error', message: 'No test cases' });
  } else {
    const ids = new Set<number | string>();
    const mainFn = extractMainFunction(starterCode);
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i] as Record<string, unknown>;
      if (tc.id !== undefined && ids.has(tc.id as number | string)) {
        issues.push({ severity: 'warning', message: `Test case ${i}: duplicate id ${tc.id}` });
      }
      ids.add((tc.id ?? i) as number | string);
      if (!tc.fnCall || typeof tc.fnCall !== 'string') {
        issues.push({ severity: 'error', message: `Test case ${i}: missing fnCall` });
      } else if (!tc.fnCall.includes('(')) {
        issues.push({ severity: 'error', message: `Test case ${i}: fnCall should be a function call` });
      }
      const validExpected =
        tc.expected !== undefined &&
        tc.expected !== null &&
        ['string', 'number', 'boolean'].includes(typeof tc.expected);
      if (!validExpected) {
        issues.push({ severity: 'error', message: `Test case ${i}: missing or invalid expected` });
      }
      if (typeof tc.id !== 'number' && typeof tc.id !== 'string') {
        issues.push({ severity: 'warning', message: `Test case ${i}: id should be number` });
      }
      if (
        mainFn &&
        tc.fnCall &&
        typeof tc.fnCall === 'string' &&
        !tc.fnCall.includes(mainFn)
      ) {
        issues.push({
          severity: 'warning',
          message: `Test case ${i}: fnCall does not reference "${mainFn}"`,
        });
      }
    }
  }

  // Sanity: starter_code has function or class
  if (starterCode && !/\bdef\s+/.test(starterCode) && !/\bclass\s+/.test(starterCode)) {
    issues.push({ severity: 'warning', message: 'Starter code has no def or class' });
  }

  return { name, id, issues };
}

async function main() {
  console.log('Fetching InterviewQuestions...\n');

  const { data: rows, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name, difficulty, prompt_full, starter_code, test_cases, category, pattern, leetcode_number');

  if (error) {
    console.error('Failed to fetch:', error.message);
    process.exit(1);
  }

  if (!rows?.length) {
    console.log('No questions found.');
    process.exit(0);
  }

  const results: ValidationResult[] = rows.map((r) => validate(r));

  // Cross-row: duplicate names
  const nameCounts = new Map<string, number>();
  for (const r of results) {
    nameCounts.set(r.name, (nameCounts.get(r.name) ?? 0) + 1);
  }
  for (const [name, count] of nameCounts) {
    if (count > 1) {
      const first = results.find((r) => r.name === name);
      if (first) {
        first.issues.push({
          severity: 'error',
          message: `Duplicate name "${name}" (${count} rows)`,
        });
      }
    }
  }
  const withErrors = results.filter((r) => r.issues.some((i) => i.severity === 'error'));
  const withWarnings = results.filter((r) =>
    r.issues.some((i) => i.severity === 'warning' && !r.issues.some((j) => j.severity === 'error'))
  );

  let errorCount = 0;
  let warningCount = 0;

  for (const r of results) {
    if (r.issues.length === 0) continue;
    const errs = r.issues.filter((i) => i.severity === 'error');
    const warns = r.issues.filter((i) => i.severity === 'warning');
    errorCount += errs.length;
    warningCount += warns.length;
    console.log(`${r.name} (${r.id.slice(0, 8)}...)`);
    for (const i of errs) {
      console.log(`  [ERROR] ${i.message}`);
    }
    for (const i of warns) {
      console.log(`  [WARN]  ${i.message}`);
    }
    console.log('');
  }

  const ok = results.length - withErrors.length;
  console.log('─'.repeat(60));
  console.log(`Total: ${results.length} | OK: ${ok} | Errors: ${errorCount} | Warnings: ${warningCount}`);

  if (withErrors.length > 0) {
    console.log(`\n${withErrors.length} question(s) have errors.`);
    process.exit(1);
  }

  console.log('\nAll checks passed.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
