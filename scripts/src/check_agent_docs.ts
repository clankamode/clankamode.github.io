import fs from 'fs';
import path from 'path';

interface DocError {
  file: string;
  line: number;
  message: string;
}

interface TableEntry {
  value: string;
  line: number;
}

const ROOT = process.cwd();
const AGENTS_PATH = 'AGENTS.md';
const CANONICAL_DOCS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  'README.md',
  'docs/QUICK_REFERENCE.md',
];

const KNOWN_ROOT_SEGMENTS = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  'README.md',
  'package.json',
  'src',
  'docs',
  'scripts',
  'supabase',
  'tests',
  'playwright',
  '.agent',
  '.cursor',
  '.github',
]);

const errors: DocError[] = [];

function addError(file: string, line: number, message: string) {
  errors.push({ file, line, message });
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function resolveDocPath(docPath: string, rawPath: string): string {
  if (rawPath.startsWith('./') || rawPath.startsWith('../')) {
    return path.resolve(path.dirname(path.join(ROOT, docPath)), rawPath);
  }
  return path.resolve(ROOT, rawPath);
}

function isLocalLink(linkTarget: string): boolean {
  return !(
    linkTarget.startsWith('http://') ||
    linkTarget.startsWith('https://') ||
    linkTarget.startsWith('mailto:') ||
    linkTarget.startsWith('#')
  );
}

function parseTableEntries(lines: string[], sectionHeader: string): TableEntry[] {
  const sectionStart = lines.findIndex((line) => line.trim() === sectionHeader);
  if (sectionStart === -1) {
    addError(AGENTS_PATH, 1, `Missing section header: ${sectionHeader}`);
    return [];
  }

  const entries: TableEntry[] = [];
  for (let i = sectionStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      break;
    }

    const match = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (!match) {
      continue;
    }

    entries.push({
      value: match[1],
      line: i + 1,
    });
  }

  return entries;
}

function checkAgentsTables() {
  const agentsText = readFile(AGENTS_PATH);
  const lines = agentsText.split(/\r?\n/);

  const documentedSkills = parseTableEntries(lines, '## Skills');
  const documentedWorkflows = parseTableEntries(lines, '## Workflows');

  const skillDir = path.join(ROOT, '.agent/skills');
  const workflowDir = path.join(ROOT, '.agent/workflows');

  const actualSkills = fs
    .readdirSync(skillDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const actualWorkflowCommands = fs
    .readdirSync(workflowDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort();

  const documentedSkillMap = new Map(documentedSkills.map((entry) => [entry.value, entry.line]));
  const documentedWorkflowMap = new Map(
    documentedWorkflows.map((entry) => [entry.value.replace(/^\//, ''), entry.line]),
  );

  for (const skill of actualSkills) {
    if (!documentedSkillMap.has(skill)) {
      addError(AGENTS_PATH, 1, `Skill directory exists but is missing from Skills table: ${skill}`);
    }
  }

  for (const documentedSkill of documentedSkillMap.keys()) {
    if (!actualSkills.includes(documentedSkill)) {
      addError(
        AGENTS_PATH,
        documentedSkillMap.get(documentedSkill) || 1,
        `Skill is documented but directory does not exist: ${documentedSkill}`,
      );
    }
  }

  for (const workflow of actualWorkflowCommands) {
    if (!documentedWorkflowMap.has(workflow)) {
      addError(AGENTS_PATH, 1, `Workflow file exists but is missing from Workflows table: /${workflow}`);
    }
  }

  for (const documentedWorkflow of documentedWorkflowMap.keys()) {
    if (!actualWorkflowCommands.includes(documentedWorkflow)) {
      addError(
        AGENTS_PATH,
        documentedWorkflowMap.get(documentedWorkflow) || 1,
        `Workflow is documented but file does not exist: /${documentedWorkflow}`,
      );
    }
  }
}

function checkNpmRunReferences() {
  const packageJson = JSON.parse(readFile('package.json')) as { scripts?: Record<string, string> };
  const scripts = new Set(Object.keys(packageJson.scripts || {}));

  for (const docPath of CANONICAL_DOCS) {
    const lines = readFile(docPath).split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const regex = /npm run ([a-zA-Z0-9:_-]+)/g;
      let match = regex.exec(line);

      while (match) {
        const scriptName = match[1];
        if (!scripts.has(scriptName)) {
          addError(docPath, i + 1, `Unknown npm script referenced: npm run ${scriptName}`);
        }
        match = regex.exec(line);
      }
    }
  }
}

function shouldCheckInlinePath(token: string): boolean {
  if (!token.includes('/')) return false;
  if (token.startsWith('http://') || token.startsWith('https://')) return false;
  if (token.startsWith('/')) return false;
  if (token.includes('*') || token.includes('[') || token.includes(']') || token.includes('{') || token.includes('}')) {
    return false;
  }

  const normalized = token.replace(/^[./]+/, '');
  if (!normalized) return false;

  const firstSegment = normalized.split('/')[0];
  return KNOWN_ROOT_SEGMENTS.has(firstSegment);
}

function checkLocalPathReferences() {
  for (const docPath of CANONICAL_DOCS) {
    const lines = readFile(docPath).split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
      let linkMatch = linkRegex.exec(line);
      while (linkMatch) {
        const rawTarget = linkMatch[1].split('#')[0].trim();
        if (rawTarget && isLocalLink(rawTarget)) {
          const absoluteTarget = resolveDocPath(docPath, rawTarget);
          if (!fs.existsSync(absoluteTarget)) {
            addError(docPath, i + 1, `Linked path does not exist: ${rawTarget}`);
          }
        }
        linkMatch = linkRegex.exec(line);
      }

      const inlineCodeRegex = /`([^`]+)`/g;
      let codeMatch = inlineCodeRegex.exec(line);
      while (codeMatch) {
        const rawToken = codeMatch[1].trim().replace(/[.,:;]+$/, '');
        if (!shouldCheckInlinePath(rawToken)) {
          codeMatch = inlineCodeRegex.exec(line);
          continue;
        }

        const absoluteTarget = resolveDocPath(docPath, rawToken);
        if (!fs.existsSync(absoluteTarget)) {
          addError(docPath, i + 1, `Inline path does not exist: ${rawToken}`);
        }

        codeMatch = inlineCodeRegex.exec(line);
      }
    }
  }
}

function main() {
  checkAgentsTables();
  checkNpmRunReferences();
  checkLocalPathReferences();

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR: [${error.file}:${error.line}] ${error.message}`);
    }
    process.exit(1);
  }

  console.log('✅ Agent docs checks passed.');
}

main();
