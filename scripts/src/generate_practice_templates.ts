import { config } from 'dotenv';
config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PracticeTemplate {
    slug: string;
    title: string;
    conceptSlug: string;
    estMinutes: number;
    body: string;
}

async function main() {
    console.log('--- Practice Content Template Generator ---\n');

    // Get backlog priorities
    const reportPath = path.join(process.cwd(), 'concept_lint_report.json');
    if (!fs.existsSync(reportPath)) {
        console.log('No lint report found. Run concept_lint.ts first.');
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const priorityConcepts = report.stubbornNoPractice?.slice(0, 3) || [];

    // Also get top stubborn concepts
    const stubbornTop = report.stubbornTop20?.slice(0, 3)?.map((s: { concept: string }) => s.concept) || [];

    // Merge and dedupe
    const allTargets = [...new Set([...priorityConcepts, ...stubbornTop])].slice(0, 3);

    if (allTargets.length === 0) {
        // Fall back to concepts without practice content
        const { data: concepts } = await supabase.from('Concepts').select('slug').eq('track_slug', 'dsa');
        const { data: articles } = await supabase.from('LearningArticles').select('slug, concept_tags').eq('is_published', true);

        const practiceConceptSlugs = new Set<string>();
        (articles || []).forEach(a => {
            if (a.slug.includes('practice') || a.slug.includes('quiz')) {
                (a.concept_tags || []).forEach((t: string) => practiceConceptSlugs.add(t));
            }
        });

        const missing = (concepts || []).filter((c: { slug: string }) => !practiceConceptSlugs.has(c.slug)).slice(0, 3);
        allTargets.push(...missing.map(m => m.slug));
    }

    if (allTargets.length === 0) {
        console.log('✅ All concepts have practice coverage. No templates needed.');
        process.exit(0);
    }

    console.log(`📋 Generating ${allTargets.length} practice templates:\n`);

    const templates: PracticeTemplate[] = allTargets.map(conceptSlug => ({
        slug: `practice-${conceptSlug.replace(/\./g, '-')}`,
        title: `Practice: ${conceptSlug.split('.').pop()?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
        conceptSlug,
        estMinutes: 5,
        body: `---
title: "Practice: ${conceptSlug}"
concept: "${conceptSlug}"
estMinutes: 5
---

## Problem

[TODO: Add a short problem statement here]

## Expected Behavior

[TODO: Describe what the learner should produce]

## Solution

\`\`\`typescript
// [TODO: Add solution code]
\`\`\`

## Key Insight

[TODO: One sentence explaining the core takeaway]
`
    }));

    templates.forEach((t, i) => {
        console.log(`${i + 1}. ${t.title}`);
        console.log(`   Concept: ${t.conceptSlug}`);
        console.log(`   Slug: ${t.slug}`);
        console.log(`   Est: ${t.estMinutes} min`);
        console.log('');
    });

    // Write templates to files
    const templatesDir = path.join(process.cwd(), 'content', 'practice-templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    templates.forEach(t => {
        const filePath = path.join(templatesDir, `${t.slug}.md`);
        fs.writeFileSync(filePath, t.body);
    });

    console.log(`\n📁 Templates written to: ${templatesDir}`);
    console.log('\n--- End of Generator ---');
}

main().catch(console.error);
