import { config } from 'dotenv';

config({ path: '.env.local' });

function printUsage() {
  console.log('Usage: npm run test:daily-brief -- [url]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev');
  console.log('  npm run test:daily-brief');
  console.log('  npm run test:daily-brief -- http://localhost:3000/api/admin/daily-brief');
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }

  const url = process.argv[2] || 'http://localhost:3000/api/admin/daily-brief';

  console.log(`Calling daily brief endpoint: ${url}`);

  const response = await fetch(url, { method: 'GET' });
  const body = await response.text();

  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Response body:');
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Failed to run daily brief test:', error);
  console.error('Tip: start the app first with `npm run dev`.');
  process.exit(1);
});
