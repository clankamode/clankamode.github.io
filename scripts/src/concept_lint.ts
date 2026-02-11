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

interface LintReport {
    generatedAt: string;
    summary: {
        invalidTags: number;
        tagSpam: number;
        primaryNotInTags: number;
        cycles: number;
        stubbornNoPractice: number;
    };
    issues: {
        type: string;
        article?: string;
        concept?: string;
        details: string;
    }[];
    stubbornTop20: { concept: string; count: number }[];
    stubbornNoPractice: string[];
}

async function main() {
    console.log('--- O2 Concept Lint Report ---');

    // 1. Fetch Data
    const { data: articles } = await supabase.from('LearningArticles').select('slug, title, primary_concept, concept_tags');
    const { data: concepts } = await supabase.from('Concepts').select('slug');
    const { data: deps } = await supabase.from('ConceptDependencies').select('concept_slug, depends_on_slug');
    const { data: stats } = await supabase.from('UserConceptStats').select('concept_slug, exposures, internalized_count');
    const { data: indexData } = await supabase.from('LearningArticles').select('slug, concept_tags').eq('is_published', true);

    if (!articles || !concepts || !deps || !stats) {
        console.error('Failed to fetch data from Supabase');
        process.exit(1);
    }

    const conceptSlugs = new Set(concepts.map(c => c.slug));
    const report: LintReport = {
        generatedAt: new Date().toISOString(),
        summary: { invalidTags: 0, tagSpam: 0, primaryNotInTags: 0, cycles: 0, stubbornNoPractice: 0 },
        issues: [],
        stubbornTop20: [],
        stubbornNoPractice: []
    };

    // Build practice availability map
    const practiceAvailable = new Set<string>();
    (indexData || []).forEach(a => {
        const isPractice = a.slug.includes('practice') || a.slug.includes('quiz') || a.slug.includes('exercise');
        if (isPractice) {
            (a.concept_tags || []).forEach((tag: string) => practiceAvailable.add(tag));
        }
    });

    // 2. Tag Audits
    console.log('\n[1/5] Auditing Tags...');
    articles.forEach(a => {
        const tags = a.concept_tags || [];

        // Invalid tags
        tags.forEach((tag: string) => {
            if (!conceptSlugs.has(tag)) {
                report.summary.invalidTags++;
                report.issues.push({ type: 'invalid_tag', article: a.slug, details: `Tag "${tag}" not found in Concepts table` });
            }
        });

        // Tag spam
        if (tags.length > 6) {
            report.summary.tagSpam++;
            report.issues.push({ type: 'tag_spam', article: a.slug, details: `Has ${tags.length} tags (max 6)` });
        }

        // Primary-in-tags
        if (a.primary_concept && !tags.includes(a.primary_concept)) {
            report.summary.primaryNotInTags++;
            report.issues.push({ type: 'primary_not_in_tags', article: a.slug, details: `Primary "${a.primary_concept}" not in tags` });
        }
    });

    // 3. Cycle Detection
    console.log('[2/5] Detecting Cycles...');
    const adj = new Map<string, string[]>();
    deps.forEach(d => {
        if (!adj.has(d.concept_slug)) adj.set(d.concept_slug, []);
        adj.get(d.concept_slug)!.push(d.depends_on_slug);
    });

    const visited = new Set<string>();
    const stack = new Set<string>();

    function hasCycle(u: string): boolean {
        visited.add(u);
        stack.add(u);
        for (const v of adj.get(u) || []) {
            if (stack.has(v)) return true;
            if (!visited.has(v) && hasCycle(v)) return true;
        }
        stack.delete(u);
        return false;
    }

    conceptSlugs.forEach(slug => {
        if (!visited.has(slug)) {
            if (hasCycle(slug)) {
                report.summary.cycles++;
                report.issues.push({ type: 'cycle', concept: slug, details: `Dependency cycle detected` });
            }
        }
    });

    // 4. Stubborn Concepts
    console.log('[3/5] Aggregating Stubborn Concepts...');
    const stubbornMap = new Map<string, number>();
    stats.forEach(s => {
        if (s.exposures >= 3 && s.internalized_count === 0) {
            stubbornMap.set(s.concept_slug, (stubbornMap.get(s.concept_slug) || 0) + 1);
        }
    });

    report.stubbornTop20 = Array.from(stubbornMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([slug, count]) => ({ concept: slug, count }));

    // 5. Stubborn without practice (the critical check)
    console.log('[4/5] Checking Stubborn Concepts Without Practice...');
    stubbornMap.forEach((_, slug) => {
        if (!practiceAvailable.has(slug)) {
            report.stubbornNoPractice.push(slug);
            report.summary.stubbornNoPractice++;
            report.issues.push({ type: 'stubborn_no_practice', concept: slug, details: `Stubborn concept has no practice content` });
        }
    });

    // 6. Output
    const totalIssues = Object.values(report.summary).reduce((a, b) => a + b, 0);

    if (totalIssues > 0) {
        console.log(`\n❌ ISSUES DETECTED: ${totalIssues}`);
        console.log(`   - Invalid tags: ${report.summary.invalidTags}`);
        console.log(`   - Tag spam: ${report.summary.tagSpam}`);
        console.log(`   - Primary not in tags: ${report.summary.primaryNotInTags}`);
        console.log(`   - Cycles: ${report.summary.cycles}`);
        console.log(`   - Stubborn w/o practice: ${report.summary.stubbornNoPractice}`);
    } else {
        console.log('\n✅ NO ISSUES DETECTED');
    }

    console.log('\n🔥 TOP 20 STUBBORN CONCEPTS:');
    if (report.stubbornTop20.length === 0) console.log(' (None detected yet)');
    report.stubbornTop20.forEach((item, i) => {
        console.log(` ${i + 1}. ${item.concept} (${item.count} users stuck)`);
    });

    // Write JSON report
    const outputPath = path.join(process.cwd(), 'concept_lint_report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 JSON report written to: ${outputPath}`);

    console.log('\n--- End of Report ---');
}

main().catch(console.error);
