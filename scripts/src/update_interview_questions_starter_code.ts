/**
 * Updates InterviewQuestions: adds full prompt_full as docstring in starter_code,
 * and adds visualizable examples for tree/graph/linked-list questions.
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

interface Row {
  id: string;
  name: string;
  prompt_full: string;
  starter_code: string;
  category: string | null;
  pattern: string | null;
}

/** Strip the first docstring ("""...""" or '''...''') from Python code, wherever it appears. */
function stripFirstDocstring(code: string): string {
  const tripleDouble = code.match(/"""([\s\S]*?)"""/);
  const tripleSingle = code.match(/'''([\s\S]*?)'''/);
  if (tripleDouble && (!tripleSingle || code.indexOf('"""') < code.indexOf("'''"))) {
    return code.replace(/"""[\s\S]*?"""/, '').replace(/\n{3,}/g, '\n\n').trim();
  }
  if (tripleSingle) {
    return code.replace(/'''[\s\S]*?'''/, '').replace(/\n{3,}/g, '\n\n').trim();
  }
  return code.trim();
}

/** Format 2D arrays so each row is on its own line. Uses bracket matching to handle nested arrays. */
function format2DArrays(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('[[', i);
    if (start === -1) {
      result += text.slice(i);
      break;
    }
    result += text.slice(i, start);
    let depth = 0;
    let j = start;
    while (j < text.length) {
      if (text.slice(j, j + 2) === '[[') {
        depth++;
        j += 2;
        continue;
      }
      if (text.slice(j, j + 2) === ']]') {
        depth--;
        if (depth === 0) {
          j += 2;
          break;
        }
        j += 2;
        continue;
      }
      if (text[j] === '[') depth++;
      else if (text[j] === ']') depth--;
      j++;
    }
    const match = text.slice(start, j);
    const inner = match.slice(2, -2);
    const rowParts = inner.split(/\]\s*,\s*\[/);
    const rows = rowParts.map((part) => {
      const cleaned = part.replace(/^\[/, '').replace(/\]$/, '');
      return '  [' + cleaned + ']';
    });
    result += '[\n' + rows.join(',\n') + '\n]';
    i = j;
  }
  return result;
}

/** Wrap long lines to maxLen characters, breaking at spaces. Preserves paragraph structure. */
function wrapLines(text: string, maxLen: number = 80): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.length <= maxLen) return line;
      const indent = line.match(/^(\s*)/)?.[1] ?? '';
      const trimmed = line.trimStart();
      const words = trimmed.split(/\s+/);
      const result: string[] = [];
      let current = indent;

      for (const w of words) {
        const space = current.length > indent.length ? ' ' : '';
        let candidate = current + space + w;
        if (candidate.length <= maxLen) {
          current = candidate;
        } else if (w.length > maxLen - indent.length) {
          if (current.trimEnd().length > 0) result.push(current.trimEnd());
          let rest = w;
          while (rest.length > maxLen - indent.length) {
            const chunkLen = maxLen - indent.length;
            result.push(indent + rest.slice(0, chunkLen));
            rest = rest.slice(chunkLen);
          }
          current = indent + rest;
        } else {
          if (current.trimEnd().length > 0) result.push(current.trimEnd());
          current = indent + w;
        }
      }
      if (current.trimEnd().length > 0) result.push(current.trimEnd());
      return result.join('\n');
    })
    .join('\n');
}

/** Build docstring with proper delimiter (avoid breaking if prompt contains """). */
function buildDocstring(prompt: string): string {
  const useSingle = prompt.includes('"""');
  const delim = useSingle ? "'''" : '"""';
  return `${delim}\n${prompt}\n${delim}`;
}

/** Visual diagrams to append for non-linear questions. Keyed by question name. */
const VISUAL_ADDITIONS: Record<string, string> = {
  'Alien Dictionary': `
Example 1: words = ["wrt","wrf","er","ett","rftt"] -> "wertf"
  Order derived: w->e->r->t->f

Example 2: words = ["z","x"] -> "zx"
  z -> x

Example 3: words = ["z","x","z"] -> "" (invalid: z before and after x)
`,

  'Bus Routes': `
Example 1: routes = [[1,2,7],[3,6,7]], source = 1, target = 6 -> 2

  Bus 0: 1 <-> 2 <-> 7
  Bus 1: 3 <-> 6 <-> 7

  Path: 1 (bus0) -> 7 (bus0) -> 6 (bus1) = 2 buses
`,

  'Cheapest Flights Within K Stops': `
Example: n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1 -> 700

  0 --100--> 1 --600--> 3
   \\         |  --100--> 2 --200--> 3
    \\_____100_____/
  Cheapest with at most 1 stop: 0->1->2->3 = 100+100+200 = 400? No: 0->1->3 = 100+600 = 700 (only 1 stop)
  With k=1, cannot do 0->1->2->3 (2 stops). So 700.
`,

  'Shortest Distance from All Buildings': `
Example: grid = [[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]]
  1 = building, 0 = empty, 2 = obstacle
  Find empty cell with minimum total distance to all buildings.
`,

  'The Earliest Moment When Everyone Become Friends': `
Example: logs = [[20190101,0,1],[20190104,3,4],[20190107,2,3],[20190211,1,5],[20190224,2,4],[20190301,0,3],[20190312,1,2],[20190322,4,5]], n = 6 -> 20190301
  Initially: 6 isolated people. Each log [t,a,b] connects a and b at time t.
  Trace Union-Find to find when all become one component.
`,

  'The Maze II': `
Example: maze with 0=empty, 1=wall. Ball rolls until hitting wall.
  start = [0,4], destination = [4,4]
  Grid: ball rolls down column 4 to reach destination.
`,

  'Walls and Gates': `
Example: rooms (INF=empty, -1=wall, 0=gate). Fill each empty with shortest dist to nearest gate.
  INF  -1   0  INF
  INF  INF INF  -1
  INF  -1  INF  -1
  0   -1  INF  INF
`,

  'Add Two Numbers': `
Example 1: l1 = [2,4,3], l2 = [5,6,4] -> [7,0,8] (342 + 465 = 807)

  2->4->3      5->6->4
       \\     /
  7->0->8
`,

  'Intersection of Two Linked Lists': `
Example: listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA=2, skipB=3
  listA: 4->1->(8->4->5)
  listB: 5->6->1->(8->4->5)
  Intersection at node with value 8.
`,

  'Linked List Cycle II': `
Example 1: head = [3,2,0,-4], pos = 1 (cycle at index 1)
  3 -> 2 -> 0 -> -4
       ^_________|
  Return node with value 2.

Example 2: head = [1,2], pos = 0
  1 -> 2
  ^____|
  Return node with value 1.
`,

  'Merge k Sorted Lists': `
Example: [[1,4,5],[1,3,4],[2,6]] -> [1,1,2,3,4,4,5,6]

  list0: 1->4->5
  list1: 1->3->4
  list2: 2->6
  Merge: 1,1,2,3,4,4,5,6
`,

  'Merge Two Sorted Lists': `
Example 1: list1 = [1,2,4], list2 = [1,3,4] -> [1,1,2,3,4,4]

  1->2->4    1->3->4
      \\   /
  1->1->2->3->4->4
`,

  'Reorder List': `
Example: [1,2,3,4] -> [1,4,2,3]
  Original: 1 -> 2 -> 3 -> 4
  Reorder:  1 -> 4 -> 2 -> 3 (L0, Ln, L1, Ln-1, ...)
`,

  'Search Suggestions System': `
Example: products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"
  Trie: m -> o -> u -> s -> e
  Suggestions at "m": mobile, moneypot, monitor
  at "mo": mobile, moneypot, monitor
  at "mou": mouse, mousepad
  at "mous": mouse, mousepad
  at "mouse": mouse, mousepad
`,

  'Unique Binary Search Trees': `
Example: n = 3 -> 5
  Unique BSTs with keys 1,2,3:
    1         1          2        3      3
     \\         \\       / \\      /      /
      2          3    1   3   1      2
       \\       /               \\   /
        3    2                  2 1
  Total: 5 unique structures.
`,
};

function buildNewStarterCode(row: Row): string {
  const codeWithoutDocstring = stripFirstDocstring(row.starter_code);
  let docstringContent = row.prompt_full;

  const visual = VISUAL_ADDITIONS[row.name];
  if (visual) {
    docstringContent = docstringContent.trimEnd() + '\n' + visual.trim();
  }

  docstringContent = format2DArrays(docstringContent);
  docstringContent = wrapLines(docstringContent, 80);
  const docstring = buildDocstring(docstringContent);
  return docstring + '\n\n' + codeWithoutDocstring;
}

async function main() {
  console.log('Fetching all InterviewQuestions...');
  const { data: rows, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name, prompt_full, starter_code, category, pattern');

  if (error) {
    throw new Error(`Failed to fetch: ${error.message}`);
  }
  if (!rows || rows.length === 0) {
    console.log('No rows found.');
    return;
  }

  console.log(`Processing ${rows.length} questions...`);

  let updated = 0;
  let failed = 0;

  for (const row of rows as Row[]) {
    try {
      const newStarterCode = buildNewStarterCode(row);
      const { error: updateError } = await supabase
        .from('InterviewQuestions')
        .update({ starter_code: newStarterCode })
        .eq('id', row.id);

      if (updateError) {
        console.error(`  ✗ ${row.name}: ${updateError.message}`);
        failed++;
      } else {
        updated++;
        if (updated % 20 === 0) {
          console.log(`  Progress: ${updated}/${rows.length}`);
        }
      }
    } catch (e) {
      console.error(`  ✗ ${row.name}:`, e);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
