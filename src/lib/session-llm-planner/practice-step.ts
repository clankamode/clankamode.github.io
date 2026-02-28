import { sanitizeIntentText } from '@/lib/intent-display';
import type { SessionItem } from '@/lib/progress';

export interface PracticeQuestionSummary {
  id: string;
  name: string;
  difficulty: string | null;
}

function normalizePracticeDifficulty(value: string | null): 'Easy' | 'Medium' | 'Hard' | null {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }
  return null;
}

export function appendPracticeStepToPlan(
  learnItems: SessionItem[],
  anchorItem: SessionItem,
  question: PracticeQuestionSummary | null
): SessionItem[] {
  if (!question) {
    return [...learnItems];
  }

  const intentText = sanitizeIntentText(
    `Do ${question.name} now because applying ${anchorItem.targetConcept || anchorItem.title} cements recall under pressure.`,
    {
      fallback: 'Practice now because applying this concept under pressure improves transfer.',
      title: question.name,
      maxChars: 140,
      minChars: 24,
    }
  );

  const difficulty = normalizePracticeDifficulty(question.difficulty);
  const practiceItem: SessionItem = {
    type: 'practice',
    title: `Practice: ${question.name}`,
    subtitle: 'Interview problem · 5 min',
    pillarSlug: anchorItem.pillarSlug,
    href: `/code-editor/practice/${encodeURIComponent(question.id)}?source=session&sessionQuestionId=${encodeURIComponent(question.id)}`,
    estMinutes: 5,
    estimatedMinutes: 5,
    questionId: question.id,
    questionName: question.name,
    intent: {
      type: 'practice',
      text: intentText,
    },
    confidence: anchorItem.confidence,
    primaryConceptSlug: anchorItem.primaryConceptSlug || null,
    targetConcept: anchorItem.targetConcept || anchorItem.title,
    practiceQuestionId: question.id,
    practiceDifficulty: difficulty ?? undefined,
    practiceQuestionDescription: undefined,
  };

  return [...learnItems, practiceItem];
}
