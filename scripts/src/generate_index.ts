import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const GENERATED_INDEX_PATH = path.join(process.cwd(), 'src/lib', 'concept-index.generated.ts');

function estimatePracticeMinutes(difficulty: string): number {
    switch (difficulty) {
        case 'Easy':
            return 10;
        case 'Medium':
            return 15;
        case 'Hard':
            return 20;
        default:
            return 12;
    }
}

function loadExistingGeneratedIndex(): Record<string, any[]> {
    if (!fs.existsSync(GENERATED_INDEX_PATH)) {
        return {};
    }

    const source = fs.readFileSync(GENERATED_INDEX_PATH, 'utf-8');
    const marker = 'export const GENERATED_CONCEPT_INDEX: ConceptIndex = ';
    const markerIndex = source.indexOf(marker);
    if (markerIndex === -1) {
        return {};
    }

    const payload = source.slice(markerIndex + marker.length);
    const semicolonIndex = payload.lastIndexOf(';');
    if (semicolonIndex === -1) {
        return {};
    }

    try {
        return JSON.parse(payload.slice(0, semicolonIndex));
    } catch {
        return {};
    }
}

async function main() {
    console.log('--- Generating Concept Index ---');

    const [{ data: articles, error: articlesError }, { data: questions, error: questionsError }] = await Promise.all([
        supabase
            .from('LearningArticles')
            .select('slug, title, reading_time_minutes, concept_tags, primary_concept')
            .eq('is_published', true),
        supabase
            .from('InterviewQuestions')
            .select('name, leetcode_number, difficulty, concept_slug, concept_tags, source')
            .contains('source', ['PERALTA_75'])
            .not('leetcode_number', 'is', null),
    ]);

    if (articlesError || !articles) {
        console.error('Failed to fetch articles:', articlesError?.message);
        process.exit(1);
    }
    if (questionsError || !questions) {
        console.error('Failed to fetch practice questions:', questionsError?.message);
        process.exit(1);
    }

    const index: Record<string, any[]> = {};

    articles.forEach(a => {
        const tags = a.concept_tags || [];
        tags.forEach((tag: string) => {
            if (!index[tag]) index[tag] = [];

            const isPractice = a.slug.includes('practice') || a.slug.includes('quiz') || a.slug.includes('exercise');

            index[tag].push({
                href: `/learn/dsa/${a.slug}`, // Defaulting to DSA for now based on project context
                title: a.title,
                type: isPractice ? 'practice' : 'learn',
                estMinutes: a.reading_time_minutes || 5,
                isPrimary: a.primary_concept === tag
            });
        });
    });

    questions.forEach((q) => {
        const normalizedTags: string[] = [];
        if (Array.isArray(q.concept_tags)) {
            for (const rawTag of q.concept_tags) {
                if (typeof rawTag !== 'string') continue;
                const tag = rawTag.trim().toLowerCase();
                if (!tag || normalizedTags.includes(tag)) continue;
                normalizedTags.push(tag);
            }
        }

        if (typeof q.concept_slug === 'string') {
            const primary = q.concept_slug.trim().toLowerCase();
            if (primary && !normalizedTags.includes(primary)) {
                normalizedTags.push(primary);
            }
        }

        if (normalizedTags.length === 0 || !q.leetcode_number) {
            return;
        }

        normalizedTags.forEach((tag) => {
            if (!index[tag]) index[tag] = [];

            index[tag].push({
                href: `/session/practice/${q.leetcode_number}`,
                title: q.name,
                type: 'practice',
                estMinutes: estimatePracticeMinutes(q.difficulty || 'Medium'),
                isPrimary: tag === (q.concept_slug || '').trim().toLowerCase(),
            });
        });
    });

    const existingIndex = loadExistingGeneratedIndex();
    Object.entries(existingIndex).forEach(([tag, items]) => {
        if (!Array.isArray(items)) return;
        if (!index[tag]) index[tag] = [];

        const seen = new Set(index[tag].map((item: { href: string; title: string; type: string }) => `${item.href}::${item.title}::${item.type}`));
        items.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const key = `${(item as { href?: string }).href || ''}::${(item as { title?: string }).title || ''}::${(item as { type?: string }).type || ''}`;
            if (seen.has(key)) return;
            index[tag].push(item);
            seen.add(key);
        });
    });

    // Sort deterministically for stable code generation
    const sortedIndex: Record<string, any[]> = {};
    const sortedTags = Object.keys(index).sort();

    sortedTags.forEach(tag => {
        const items = index[tag];
        items.sort((a, b) => {
            // 1. Primary first
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
            // 2. Shorter estMinutes first
            if (a.estMinutes !== b.estMinutes) return a.estMinutes - b.estMinutes;
            // 3. Alphabetical title
            return a.title.localeCompare(b.title);
        });
        sortedIndex[tag] = items;
    });

    const outputPath = GENERATED_INDEX_PATH;

    const content = `// Generated by scripts/src/generate_index.ts
// DO NOT EDIT MANUALLY
import type { ConceptIndex } from '@/types/micro';

export const GENERATED_CONCEPT_INDEX: ConceptIndex = ${JSON.stringify(sortedIndex, null, 4)};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`✅ Successfully generated ${outputPath}`);
    console.log(`📊 Indexed ${articles.length} articles + ${questions.length} practice questions across ${sortedTags.length} concepts.`);
}

main().catch(console.error);
