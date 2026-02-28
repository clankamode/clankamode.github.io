import fs from 'fs';
import path from 'path';
import {
  NAVIGATION_CONTRACT,
  NAVIGATION_MIDDLEWARE_MATCHERS,
  PUBLIC_PRACTICE_NAV_ITEMS,
  PUBLIC_PRIMARY_NAV_ITEMS,
  SESSION_DESKTOP_NAV_ITEMS,
  SESSION_MOBILE_NAV_ITEMS,
} from '../../src/config/navigationContract';

interface ContractError {
  file: string;
  line: number;
  message: string;
}

const ROOT = process.cwd();
const CONTRACT_PATH = 'src/config/navigationContract.ts';
const NAVBAR_PATH = 'src/components/layout/Navbar.tsx';
const MIDDLEWARE_PATH = 'src/middleware.ts';

const errors: ContractError[] = [];

function addError(file: string, line: number, message: string) {
  errors.push({ file, line, message });
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function findLineNumber(source: string, pattern: string): number {
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes(pattern)) {
      return i + 1;
    }
  }
  return 1;
}

function checkContractIntegrity(contractSource: string) {
  const seenHrefs = new Map<string, number>();

  for (const entry of NAVIGATION_CONTRACT) {
    const entryLine = findLineNumber(contractSource, `href: '${entry.href}'`);

    if (seenHrefs.has(entry.href)) {
      addError(CONTRACT_PATH, entryLine, `Duplicate href in contract: ${entry.href}`);
    } else {
      seenHrefs.set(entry.href, entryLine);
    }

    const routeAbsolutePath = path.join(ROOT, entry.routeFile);
    if (!fs.existsSync(routeAbsolutePath)) {
      addError(CONTRACT_PATH, entryLine, `Route file does not exist: ${entry.routeFile}`);
    }

    if (entry.authLevel === 'session-feature' && !entry.middlewareMatcher) {
      addError(
        CONTRACT_PATH,
        entryLine,
        `Session-feature route must define middleware matcher: ${entry.href}`,
      );
    }

    if (entry.middlewareMatcher && !NAVIGATION_MIDDLEWARE_MATCHERS.includes(entry.middlewareMatcher)) {
      addError(
        CONTRACT_PATH,
        entryLine,
        `Matcher missing from NAVIGATION_MIDDLEWARE_MATCHERS: ${entry.middlewareMatcher}`,
      );
    }
  }

  const groupedHrefSet = new Set<string>([
    ...PUBLIC_PRIMARY_NAV_ITEMS.map((entry) => entry.href),
    ...PUBLIC_PRACTICE_NAV_ITEMS.map((entry) => entry.href),
    ...SESSION_DESKTOP_NAV_ITEMS.map((entry) => entry.href),
    ...SESSION_MOBILE_NAV_ITEMS.map((entry) => entry.href),
  ]);

  for (const entry of NAVIGATION_CONTRACT) {
    const entryLine = findLineNumber(contractSource, `href: '${entry.href}'`);
    if ((entry.desktopGroup !== 'none' || entry.mobileGroup !== 'none') && !groupedHrefSet.has(entry.href)) {
      addError(
        CONTRACT_PATH,
        entryLine,
        `Route is assigned to a nav group but not present in grouped exports: ${entry.href}`,
      );
    }
  }
}

function checkNavbarWiring(navbarSource: string) {
  const requiredTokens = [
    'PUBLIC_PRIMARY_NAV_ITEMS',
    'PUBLIC_PRACTICE_NAV_ITEMS',
    'SESSION_DESKTOP_NAV_ITEMS',
    'SESSION_MOBILE_NAV_ITEMS',
    "from '@/config/navigationContract'",
  ];

  for (const token of requiredTokens) {
    if (!navbarSource.includes(token)) {
      addError(NAVBAR_PATH, 1, `Navbar is not wired to navigation contract token: ${token}`);
    }
  }
}

function checkMiddlewareWiring(middlewareSource: string) {
  if (!middlewareSource.includes('matcher: [')) {
    addError(MIDDLEWARE_PATH, 1, 'Middleware is missing config.matcher array');
  }

  for (const matcher of NAVIGATION_MIDDLEWARE_MATCHERS) {
    if (!middlewareSource.includes(`'${matcher}'`)) {
      addError(
        MIDDLEWARE_PATH,
        1,
        `Middleware config.matcher is missing contract matcher: ${matcher}`,
      );
    }
  }

  for (const entry of NAVIGATION_CONTRACT) {
    if (!entry.middlewareMatcher) {
      continue;
    }

    if (!middlewareSource.includes(entry.href)) {
      addError(
        MIDDLEWARE_PATH,
        1,
        `Middleware logic is missing route guard/reference for contract route: ${entry.href}`,
      );
    }
  }
}

function main() {
  const contractSource = read(CONTRACT_PATH);
  const navbarSource = read(NAVBAR_PATH);
  const middlewareSource = read(MIDDLEWARE_PATH);

  checkContractIntegrity(contractSource);
  checkNavbarWiring(navbarSource);
  checkMiddlewareWiring(middlewareSource);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR: [${error.file}:${error.line}] ${error.message}`);
    }
    process.exit(1);
  }

  console.log('✅ Navigation contract checks passed.');
}

main();
