import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * CI Check: Ensures that the generated concept index is in sync with the database.
 * Run this in CI after generate_index.ts. If there are changes, the build should fail
 * if the user forgot to commit the updated index.
 */
function main() {
    console.log('--- CI: Checking Concept Index Sync ---');

    const indexFile = path.join(process.cwd(), 'src/lib/concept-index.generated.ts');
    const oldContent = fs.readFileSync(indexFile, 'utf-8');

    console.log('Regenerating index...');
    execSync('npx tsx scripts/src/generate_index.ts', { stdio: 'inherit' });

    const newContent = fs.readFileSync(indexFile, 'utf-8');

    if (oldContent !== newContent) {
        console.error('❌ ERROR: Generated concept index is out of sync with database.');
        console.error('Run "npx tsx scripts/src/generate_index.ts" and commit the changes.');
        process.exit(1);
    }

    console.log('✅ Concept index is in sync.');
}

main();
