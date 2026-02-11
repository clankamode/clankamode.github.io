import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = [
    { slug: 'arrays', tags: ['array.contiguous-memory', 'array.random-access-o1'], primary: 'array.contiguous-memory' },
    { slug: 'linked-lists', tags: ['list.pointer-invariants', 'list.traversal-cost'], primary: 'list.pointer-invariants' },
    { slug: 'graphs', tags: ['graph.traversal-bfs', 'graph.traversal-dfs'], primary: 'graph.traversal-bfs' },
    { slug: 'trees', tags: ['tree.traversal-inorder'], primary: 'tree.traversal-inorder' },
    { slug: 'templates', tags: ['big-o.time-complexity'], primary: 'big-o.time-complexity' }
];

async function main() {
    console.log('--- Backfilling Article Tags ---');
    for (const item of mapping) {
        const { error } = await supabase
            .from('LearningArticles')
            .update({
                concept_tags: item.tags,
                primary_concept: item.primary,
                is_published: true
            })
            .eq('slug', item.slug);

        if (error) {
            console.error(`Failed to update ${item.slug}:`, error.message);
        } else {
            console.log(`✅ Updated ${item.slug}`);
        }
    }
}

main();
