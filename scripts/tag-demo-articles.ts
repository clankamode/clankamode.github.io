import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function tagArticles() {
    const updates = [
        { slug: 'array-basics', primary: 'array.contiguous-memory', tags: ['array.contiguous-memory', 'big-o.time-complexity'] },
        { slug: 'insert-delete', primary: 'array.insertion-cost', tags: ['array.insertion-cost', 'array.deletion-cost', 'big-o.time-complexity'] },
        { slug: 'amortized-arrays', primary: 'array.dynamic-resizing', tags: ['array.dynamic-resizing', 'big-o.amortized-analysis'] },
        { slug: 'singly-linked-list', primary: 'list.pointer-invariants', tags: ['list.pointer-invariants', 'list.traversal-cost', 'big-o.time-complexity'] },
        { slug: 'stack-implementation', primary: 'stack.lifo-model', tags: ['stack.lifo-model', 'list.pointer-invariants'] }
    ];

    for (const update of updates) {
        const { error } = await supabase
            .from('LearningArticles')
            .update({
                primary_concept: update.primary,
                concept_tags: update.tags
            })
            .eq('slug', update.slug);

        if (error) console.error(`Error updating ${update.slug}:`, error);
        else console.log(`Updated ${update.slug}`);
    }
}

tagArticles().catch(console.error);
