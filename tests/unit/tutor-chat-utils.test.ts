import { describe, expect, it } from 'vitest';
import {
  clearTutorAssistantRetryState,
  markTutorAssistantError,
  restoreInputAfterTutorFailure,
  type TutorUiMessage,
} from '@/app/ai/_components/tutor-chat-utils';

const baseMessages: TutorUiMessage[] = [
  { id: 'u-1', role: 'user', content: 'How does this work?' },
  { id: 'a-1', role: 'assistant', content: '' },
];

describe('tutor-chat utils', () => {
  it('marks assistant message as retryable error', () => {
    const next = markTutorAssistantError({
      messages: baseMessages,
      assistantMessageId: 'a-1',
      retryPrompt: 'How does this work?',
      content: 'Tutor is temporarily unavailable. Please try again.',
    });

    expect(next[1]).toMatchObject({
      id: 'a-1',
      status: 'error',
      retryPrompt: 'How does this work?',
      content: 'Tutor is temporarily unavailable. Please try again.',
    });
  });

  it('clears retry metadata and content before retrying', () => {
    const errored = markTutorAssistantError({
      messages: baseMessages,
      assistantMessageId: 'a-1',
      retryPrompt: 'How does this work?',
      content: 'Tutor is temporarily unavailable. Please try again.',
    });

    const cleared = clearTutorAssistantRetryState({
      messages: errored,
      assistantMessageId: 'a-1',
    });

    expect(cleared[1]).toMatchObject({
      id: 'a-1',
      content: '',
      status: undefined,
      retryPrompt: undefined,
    });
  });

  it('restores failed prompt only when current input is empty', () => {
    expect(
      restoreInputAfterTutorFailure({
        currentInput: '',
        failedPrompt: 'Retry this exact prompt',
      })
    ).toBe('Retry this exact prompt');

    expect(
      restoreInputAfterTutorFailure({
        currentInput: 'I typed something else',
        failedPrompt: 'Retry this exact prompt',
      })
    ).toBe('I typed something else');
  });
});
