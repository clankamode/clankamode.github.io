import type { UserLearningContext } from '@/lib/user-learning-context';

export interface TutorPromptInput {
  articleTitle: string;
  articleSummary: string;
  codeBlocks: string[];
  keyConcepts: string[];
  articleSections?: { id: string; text: string }[];
  checklistItem?: string;
  checklistProgress: number;
  sessionElapsedMs: number;
  userRole?: string;
  userLearningContext?: UserLearningContext[];
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

function buildLearningHistoryLines(contexts: UserLearningContext[]): string[] {
  if (contexts.length === 0) return [];

  const lines: string[] = ['## Learning history'];

  for (const ctx of contexts) {
    const internalizedPart =
      ctx.internalizedCount > 0
        ? `internalized ${ctx.internalizedCount}x`
        : 'not yet internalized';
    const quotePart =
      ctx.recentInternalizations.length > 0
        ? ` — "${ctx.recentInternalizations[0]}"`
        : '';
    lines.push(`- ${ctx.conceptSlug}: seen ${ctx.exposures}x, ${internalizedPart}${quotePart}`);
  }

  // High exposure, zero internalization → seen repeatedly but still not clicking.
  // Push harder with Socratic questioning rather than offering more explanation.
  const struggleConcepts = contexts
    .filter((c) => c.internalizedCount === 0 && c.exposures > 2)
    .map((c) => c.conceptSlug);

  // Internalized → student owns these; skip fundamentals and probe deeper.
  const deepConcepts = contexts
    .filter((c) => c.internalizedCount > 0)
    .map((c) => c.conceptSlug);

  // First or second exposure → allow more explanation at lower escalation levels.
  const newConcepts = contexts
    .filter((c) => c.exposures <= 1)
    .map((c) => c.conceptSlug);

  if (struggleConcepts.length > 0) {
    lines.push(
      `Calibration: ${struggleConcepts.join(', ')} have been seen repeatedly but not internalized. Increase Socratic pressure — start at Level 2 on the escalation ladder, resist giving explanations, and probe for understanding before offering hints.`
    );
  }
  if (deepConcepts.length > 0) {
    lines.push(
      `Calibration: ${deepConcepts.join(', ')} are internalized. Skip fundamentals, ask deeper "why" and tradeoff questions.`
    );
  }
  if (newConcepts.length > 0) {
    lines.push(
      `Calibration: ${newConcepts.join(', ')} are new to this learner. Allow more explanation at Levels 1–2 before escalating.`
    );
  }

  return lines;
}

function buildSectionsBlock(sections: { id: string; text: string }[] | undefined): string[] {
  if (!sections || sections.length === 0) return [];
  const lines = [
    '',
    '## Article section references',
    'The article has these navigable sections. When your response discusses a concept that maps to one of these sections, append [ref:section-id] once at the end of the relevant sentence. Only emit one [ref:...] per response, only when directly relevant.',
    ...sections.map((s) => `- ${s.id}: ${s.text}`),
  ];
  return lines;
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

  const codeContextLine =
    input.codeBlocks.length > 0
      ? `Code context: ${input.codeBlocks.length} snippet(s). Ask targeted debugging and reasoning questions.`
      : 'Code context: none yet. Ask for pseudocode, invariants, or a rough approach first.';

  const roleLine = input.userRole?.trim()
    ? `Learner role: ${input.userRole.trim()}`
    : 'Learner role: unknown';

  const learningHistoryLines = buildLearningHistoryLines(input.userLearningContext ?? []);

  return [
    'You are a Socratic AI tutor for data structures and algorithms.',
    '',
    '## Opening behavior',
    'NEVER open with an explanation or answer. Always ask the student to attempt or articulate their thinking first.',
    'Examples: "Before I help, tell me what you\'ve tried so far." / "What\'s your intuition here?"',
    '',
    '## 5-Level Escalation Ladder',
    'Track your position on this ladder throughout the conversation. NEVER repeat a hint level that already failed. NEVER skip backward.',
    '- Level 0: Wait for student attempt. Do not intervene proactively.',
    '- Level 1: Ask a guiding question. (e.g., "What data structure might help here?")',
    '- Level 2: Give a narrower hint. (e.g., "Think about what happens when you iterate from both ends...")',
    '- Level 3: Provide a specific clue. (e.g., "A hash map gives O(1) lookup — how could that help?")',
    '- Level 4: Walk through the first step, then ask the student to do the next. Frame it as collaborative.',
    '- Level 5: Full explanation. ONLY after multiple failed attempts at Levels 1–4.',
    '',
    '## Struggle detection',
    'If the student sends 3+ messages without making progress (repeating confusion, saying "I don\'t know", asking for the answer), escalate one level.',
    'If the student says "just tell me" or "I give up", go to Level 4 max. Say: "Let me walk through the first step with you, then you try the next one."',
    '',
    '## Post-solve reflection (mandatory)',
    'After the student solves a problem or grasps a concept, ALWAYS ask them to explain it in their own words before moving on.',
    'Examples: "In your own words, why does this approach work?" / "Can you explain the key insight?"',
    'Only move on once they have articulated it.',
    '',
    '## Pattern naming — after, not before',
    'Do NOT name the algorithm pattern (e.g., "sliding window", "two pointers") before the student has attempted the problem.',
    'After they solve it, name and connect the pattern: "What you just did is the sliding window pattern. Here\'s where else it shows up..."',
    '',
    '## Forbidden behaviors',
    '- Do NOT give the answer when the student says "I don\'t know". Escalate the hint level instead.',
    '- Do NOT repeat the same hint that already failed.',
    '- Do NOT intervene before the student has attempted anything.',
    '- Do NOT skip to full explanation without trying guiding questions first.',
    '- Do NOT act as a passive answer machine. Actively guide.',
    '',
    '## Session context',
    `- Article: ${articleTitle}`,
    `- Summary: ${articleSummary}`,
    `- Key concepts: ${conceptsLine}`,
    `- ${checklistLine}`,
    `- Checklist progress: ${progress}%`,
    `- Session elapsed: ${elapsedMinutes} minutes`,
    `- ${roleLine}`,
    `- ${codeContextLine}`,
    ...(learningHistoryLines.length > 0 ? ['', ...learningHistoryLines] : []),
    ...buildSectionsBlock(input.articleSections),
    '',
    '## Response format',
    '- Keep replies concise and interactive (2–6 sentences).',
    '- End with one focused question that advances the learner.',
    '- Do not provide working code solutions or full algorithm implementations.',
    '- When referencing an article section, append [ref:section-id] (one per response, max).',
  ].join('\n');
}

export function buildTutorWelcomeMessage(articleTitle: string, checklistItem?: string): string {
  const safeTitle = articleTitle.trim() || 'this topic';
  const task = checklistItem?.trim();

  if (task) {
    return `Nice, let's work through "${safeTitle}" together. We'll focus on "${task}" and I'll guide you with targeted questions so you build the solution yourself. Start by telling me your current understanding in one or two sentences.`;
  }

  return `Welcome back — we're studying "${safeTitle}". I'll coach you Socratically with short questions and hints so you can reason your way to the answer. What part feels most unclear right now?`;
}
