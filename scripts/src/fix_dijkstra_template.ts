/**
 * Fix Dijkstra's algorithm template: replace `d != dist[u]` with `d > dist[u]`
 *
 * The stale-node check in Dijkstra's should use `>` (greater-than), not `!=`.
 * Both are functionally equivalent when distances only decrease, but `d > dist[u]`
 * is the standard form taught in textbooks and expected by learners.
 *
 * Usage:
 *   npx tsx scripts/src/fix_dijkstra_template.ts          # dry-run (default)
 *   npx tsx scripts/src/fix_dijkstra_template.ts --apply   # apply the fix
 *
 * Run against production by setting NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) env vars.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = !process.argv.includes('--apply');

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}\n`);

  // Find all articles containing the Dijkstra stale-node pattern with !=
  const { data: articles, error } = await supabase
    .from('LearningArticles')
    .select('id, slug, title, body')
    .or('body.ilike.*d != dist*,body.ilike.*d \\!= dist*');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log('No articles found with `d != dist[u]` pattern. Nothing to fix.');
    process.exit(0);
  }

  console.log(`Found ${articles.length} article(s) to check:\n`);

  for (const article of articles) {
    const body: string = article.body || '';

    // Match patterns like: d != dist[u], d!=dist[u], d != dist[node], etc.
    const pattern = /(\bd\s*)(!=)(\s*dist\[)/g;

    if (!pattern.test(body)) {
      console.log(`  ⏭  "${article.title}" (${article.slug}) — no matching pattern in body`);
      continue;
    }

    const newBody = body.replace(/(\bd\s*)(!=)(\s*dist\[)/g, '$1>$3');

    // Show diff context
    const oldLines = body.split('\n');
    const newLines = newBody.split('\n');
    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        console.log(`  📄 "${article.title}" (${article.slug})`);
        console.log(`     Line ${i + 1}:`);
        console.log(`     - ${oldLines[i].trim()}`);
        console.log(`     + ${newLines[i].trim()}`);
      }
    }

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('LearningArticles')
        .update({ body: newBody })
        .eq('id', article.id);

      if (updateError) {
        console.log(`     ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`     ✅ Updated`);
      }
    } else {
      console.log(`     (dry run — no changes applied)`);
    }
  }

  console.log('\nDone.');
  if (DRY_RUN) {
    console.log('Re-run with --apply to commit changes.');
  }
}

main().catch(console.error);
