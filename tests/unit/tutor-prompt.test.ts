import { describe, expect, it } from 'vitest';
import { buildTutorSystemPrompt } from '@/lib/tutor-prompt';
import type { UserLearningContext } from '@/lib/user-learning-context';

const baseInput = {
  articleTitle: 'Two Pointers',
  articleSummary: 'A technique for solving array problems efficiently.',
  codeBlocks: [],
  keyConcepts: ['two-pointers', 'sliding-window'],
  checklistProgress: 0,
  sessionElapsedMs: 0,
};

describe('buildTutorSystemPrompt — escalation ladder', () => {
  it('includes all 6 levels (0–5)', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    for (const level of ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']) {
      expect(prompt).toContain(level);
    }
  });

  it('instructs the tutor to track its position and never skip backward', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/track your position/i);
    expect(prompt).toMatch(/never skip backward/i);
  });

  it('caps capitulation response at Level 4', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/just tell me/i);
    expect(prompt).toMatch(/i give up/i);
    expect(prompt).toMatch(/level 4 max/i);
  });
});

describe('buildTutorSystemPrompt — opening behavior', () => {
  it('forbids opening with an explanation', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/never open with an explanation/i);
  });

  it('requires asking the student to attempt first', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/attempt or articulate their thinking/i);
  });
});

describe('buildTutorSystemPrompt — post-solve reflection', () => {
  it('requires the student to explain in their own words', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/own words/i);
  });

  it('marks reflection as mandatory', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/mandatory|always ask/i);
  });
});

describe('buildTutorSystemPrompt — struggle detection', () => {
  it('triggers escalation after 3+ messages without progress', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/3\+\s*messages/i);
  });
});

describe('buildTutorSystemPrompt — pattern naming', () => {
  it('forbids naming the pattern before the student attempts', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/do not name the algorithm pattern/i);
  });

  it('instructs naming the pattern after solving', () => {
    const prompt = buildTutorSystemPrompt(baseInput);
    expect(prompt).toMatch(/after they solve it/i);
  });
});

describe('buildTutorSystemPrompt — learning context calibration', () => {
  it('increases Socratic pressure for high-exposure, low-internalization concepts', () => {
    const context: UserLearningContext[] = [
      {
        conceptSlug: 'two-pointers',
        exposures: 5,
        internalizedCount: 0,
        lastSeenAt: null,
        recentInternalizations: [],
      },
    ];
    const prompt = buildTutorSystemPrompt({ ...baseInput, userLearningContext: context });
    expect(prompt).toMatch(/socratic pressure/i);
    expect(prompt).toMatch(/start at level 2/i);
  });

  it('skips fundamentals for internalized concepts', () => {
    const context: UserLearningContext[] = [
      {
        conceptSlug: 'sliding-window',
        exposures: 4,
        internalizedCount: 3,
        lastSeenAt: null,
        recentInternalizations: ['understood the window shrink'],
      },
    ];
    const prompt = buildTutorSystemPrompt({ ...baseInput, userLearningContext: context });
    expect(prompt).toMatch(/skip fundamentals/i);
  });

  it('allows more explanation for first-exposure concepts', () => {
    const context: UserLearningContext[] = [
      {
        conceptSlug: 'binary-search',
        exposures: 1,
        internalizedCount: 0,
        lastSeenAt: null,
        recentInternalizations: [],
      },
    ];
    const prompt = buildTutorSystemPrompt({ ...baseInput, userLearningContext: context });
    expect(prompt).toMatch(/new to this learner/i);
    expect(prompt).toMatch(/allow more explanation/i);
  });

  it('omits learning history section when no context is provided', () => {
    const prompt = buildTutorSystemPrompt({ ...baseInput, userLearningContext: [] });
    expect(prompt).not.toContain('## Learning history');
  });

  it('includes learning history section when context is provided', () => {
    const context: UserLearningContext[] = [
      {
        conceptSlug: 'hash-map',
        exposures: 2,
        internalizedCount: 1,
        lastSeenAt: null,
        recentInternalizations: ['O(1) lookup insight'],
      },
    ];
    const prompt = buildTutorSystemPrompt({ ...baseInput, userLearningContext: context });
    expect(prompt).toContain('## Learning history');
    expect(prompt).toContain('hash-map');
  });
});

describe('buildTutorSystemPrompt — session context', () => {
  it('embeds article title and checklist progress', () => {
    const prompt = buildTutorSystemPrompt({
      ...baseInput,
      articleTitle: 'Hash Maps Deep Dive',
      checklistProgress: 75,
    });
    expect(prompt).toContain('Hash Maps Deep Dive');
    expect(prompt).toContain('75%');
  });

  it('includes code context note when snippets are present', () => {
    const prompt = buildTutorSystemPrompt({ ...baseInput, codeBlocks: ['const x = 1;', 'return x;'] });
    expect(prompt).toContain('2 snippet(s)');
  });

  it('includes elapsed time in minutes', () => {
    const prompt = buildTutorSystemPrompt({ ...baseInput, sessionElapsedMs: 300_000 });
    expect(prompt).toContain('5 minutes');
  });
});
