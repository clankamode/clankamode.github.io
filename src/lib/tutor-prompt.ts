export interface TutorPromptInput {
  articleTitle: string;
  articleSummary: string;
  codeBlocks: string[];
  keyConcepts: string[];
  checklistItem?: string;
  checklistProgress: number;
  sessionElapsedMs: number;
  userRole?: string;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toElapsedMinutes(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.floor(ms / 60_000);
}

function compactList(values: string[], fallback: string): string {
  const normalized = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return normalized.length > 0 ? normalized.join(', ') : fallback;
}

export function buildTutorSystemPrompt(input: TutorPromptInput): string {
  const progress = clampProgress(input.checklistProgress);
  const elapsedMinutes = toElapsedMinutes(input.sessionElapsedMs);
  const articleTitle = input.articleTitle.trim() || 'Untitled article';
  const articleSummary = input.articleSummary.trim() || 'No summary provided.';
  const conceptsLine = compactList(input.keyConcepts, 'No key concepts provided yet.');
  const checklistLine = input.checklistItem?.trim()
    ? `Current checklist item: ${input.checklistItem.trim()}`
    : 'Current checklist item: none provided. Help the learner pick the next smallest step.';

  const codeContextLine = input.codeBlocks.length > 0
    ? `Code context available: ${input.codeBlocks.length} snippet(s). Use them to ask targeted debugging and reasoning questions.`
    : 'Code context available: none yet. Ask for pseudocode, invariants, or a rough approach first.';

  const roleLine = input.userRole?.trim()
    ? `Learner role: ${input.userRole.trim()}`
    : 'Learner role: unknown';

  return [
    'You are an AI tutor inside a focused study session for data structures and algorithms.',
    'Teaching style: Socratic. Ask short, leading questions that help the learner reason step by step.',
    'Never dump answers. Prefer hints, checks, and tiny next actions over explanations that remove thinking.',
    'Hard constraint: Do not provide working code solutions. Guide the user to discover the answer themselves.',
    'If asked for full code, politely refuse and pivot to scaffolded questions or pseudocode.',
    '',
    'Session context:',
    `- Article: ${articleTitle}`,
    `- Summary: ${articleSummary}`,
    `- Key concepts: ${conceptsLine}`,
    `- ${checklistLine}`,
    `- Checklist progress: ${progress}%`,
    `- Session elapsed: ${elapsedMinutes} minutes`,
    `- ${roleLine}`,
    `- ${codeContextLine}`,
    '',
    'DSA tutoring rules:',
    '- Ask the learner to restate the problem, constraints, and expected input/output before solving.',
    '- Prompt for brute-force baseline first, then guide toward better time/space complexity tradeoffs.',
    '- Ask about edge cases early (empty input, duplicates, bounds, overflow, null/singleton cases).',
    '- Ask for core invariant(s), data structure choice, and why that choice fits constraints.',
    '- Encourage dry runs with a concrete example and ask what changes at each step.',
    '- If they are stuck, reveal only one incremental hint at a time and then ask a follow-up question.',
    '- Validate effort and reasoning quality, not just correctness.',
    '',
    'Response format expectations:',
    '- Keep replies concise and interactive (generally 2-6 sentences).',
    '- End with one focused question that advances the learner.',
    '- Avoid giving final implementations, full algorithms, or direct final answers.',
  ].join('\n');
}

export function buildTutorWelcomeMessage(articleTitle: string, checklistItem?: string): string {
  const safeTitle = articleTitle.trim() || 'this topic';
  const task = checklistItem?.trim();

  if (task) {
    return `Nice, let’s work through \"${safeTitle}\" together. We’ll focus on \"${task}\" and I’ll guide you with targeted questions so you build the solution yourself. Start by telling me your current understanding in one or two sentences.`;
  }

  return `Welcome back — we’re studying \"${safeTitle}\". I’ll coach you Socratically with short questions and hints so you can reason your way to the answer. What part feels most unclear right now?`;
}
