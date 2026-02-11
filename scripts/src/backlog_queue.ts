import fs from 'fs';
import path from 'path';

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

function main() {
    const reportPath = path.join(process.cwd(), 'concept_lint_report.json');
    if (!fs.existsSync(reportPath)) {
        console.error('Lint report not found. Run concept_lint.ts first.');
        process.exit(1);
    }

    const report: LintReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    console.log('\n--- O2 Action Queue (Priority Backlog) ---\n');

    // 1. Critical ontology gaps
    const uniqueInvalidTags = Array.from(new Set(
        report.issues
            .filter(i => i.type === 'invalid_tag')
            .map(i => i.details.match(/"([^"]+)"/)?.[1])
            .filter(Boolean)
    ));

    if (uniqueInvalidTags.length > 0) {
        console.log('🚨 URGENT: Missing Concepts (Add to DB)');
        uniqueInvalidTags.forEach(tag => console.log(` [ ] Add concept: ${tag}`));
        console.log('');
    }

    // 2. Practice coverage gaps
    if (report.stubbornNoPractice.length > 0) {
        console.log('🛠️ CONTENT: Stubborn Concepts Missing Practice (Top 3)');
        report.stubbornNoPractice.slice(0, 3).forEach(slug => {
            const userCount = report.stubbornTop20.find(s => s.concept === slug)?.count || '?';
            console.log(` [ ] Create practice item for: ${slug} (${userCount} users stuck)`);
        });
        console.log('');
    }

    // 3. Hygiene
    const spamArticles = report.issues.filter(i => i.type === 'tag_spam');
    if (spamArticles.length > 0) {
        console.log('🧹 HYGIENE: Tag Spam (Simplify)');
        spamArticles.forEach(i => console.log(` [ ] Fix article: ${i.article} (${i.details})`));
        console.log('');
    }

    if (uniqueInvalidTags.length === 0 && report.stubbornNoPractice.length === 0) {
        console.log('✅ Flywheel is healthy. No urgent content gaps.');
    }

    console.log('--- End of Queue ---');
}

main();
