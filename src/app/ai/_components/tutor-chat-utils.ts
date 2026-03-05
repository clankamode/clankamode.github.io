export type TutorRole = 'user' | 'assistant';
export type TutorMessageStatus = 'error';

export interface TutorUiMessage {
  id: string;
  role: TutorRole;
  content: string;
  status?: TutorMessageStatus;
  retryPrompt?: string;
}

export function markTutorAssistantError(params: {
  messages: TutorUiMessage[];
  assistantMessageId: string;
  retryPrompt: string;
  content: string;
}): TutorUiMessage[] {
  const { messages, assistantMessageId, retryPrompt, content } = params;
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content,
          status: 'error',
          retryPrompt,
        }
      : message
  );
}

export function clearTutorAssistantRetryState(params: {
  messages: TutorUiMessage[];
  assistantMessageId: string;
}): TutorUiMessage[] {
  const { messages, assistantMessageId } = params;
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content: '',
          status: undefined,
          retryPrompt: undefined,
        }
      : message
  );
}

export function restoreInputAfterTutorFailure(params: {
  currentInput: string;
  failedPrompt: string;
}): string {
  const { currentInput, failedPrompt } = params;
  return currentInput.trim().length === 0 ? failedPrompt : currentInput;
}
