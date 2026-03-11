'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { RichText } from '@/app/ai/_components/RichText';
import TutorNudge from '@/app/ai/_components/TutorNudge';
import { useCurrentSessionItemTitle, useIsInSession, useSession } from '@/contexts/SessionContext';
import { buildTutorWelcomeMessage, buildPracticeWelcomeMessage } from '@/lib/tutor-prompt';
import { cn } from '@/lib/utils';
import {
  clearTutorAssistantRetryState,
  markTutorAssistantError,
  restoreInputAfterTutorFailure,
  type TutorRole,
  type TutorUiMessage,
} from '@/app/ai/_components/tutor-chat-utils';

export interface PracticeContext {
  questionName: string;
  questionPrompt: string;
  difficulty: string;
  category: string | null;
  pattern: string | null;
  starterCode: string;
  currentCode: string;
  testResults: Array<{ id: number; passed: boolean; actual?: string; error?: string }> | null;
}

interface TutorChatProps {
  articleSlug: string;
  articleTitle: string;
  enabled: boolean;
  practiceContext?: PracticeContext;
}

export const NUDGE_DELAY_MS = 8 * 60 * 1000;
export const PRACTICE_NUDGE_DELAY_MS = 2 * 60 * 1000;

interface NudgeEligibilityInput {
  isInSession: boolean;
  isOpen: boolean;
  messagesLength: number;
  currentChecklistItem?: string;
  nudgeFiredFor?: string | null;
}

export function shouldScheduleTutorNudge(input: NudgeEligibilityInput): boolean {
  if (!input.isInSession || input.isOpen) return false;
  if (input.messagesLength > 1) return false;
  return (input.nudgeFiredFor ?? null) !== (input.currentChecklistItem ?? null);
}

export function getNudgeDelayRemainingMs(stepStartedAt: number, now = Date.now()): number {
  return Math.max(0, NUDGE_DELAY_MS - (now - stepStartedAt));
}

interface TutorSessionDerivationInput {
  execution?: {
    sessionId: string;
    completedItems: string[];
    startedAt: Date | string;
    currentIndex: number;
  } | null;
  scope?: {
    items?: Array<{ title: string }>;
  } | null;
}

interface TutorSessionContextPayload {
  sessionId: string | null;
  checklistProgress: number;
  sessionElapsedMs: number;
  currentChecklistItem: string | undefined;
}

const ARTICLE_REF_REGEX = /\[ref:([^\]]+)\]/g;

function extractArticleRefs(content: string): string[] {
  const refs: string[] = [];
  ARTICLE_REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ARTICLE_REF_REGEX.exec(content)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function stripArticleRefs(content: string): string {
  return content.replace(/\[ref:[^\]]+\]/g, '').trimEnd();
}

function scrollToAndHighlightSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.dataset.tutorHighlight = 'active';
  setTimeout(() => {
    delete el.dataset.tutorHighlight;
  }, 2000);
}

function createMessage(
  role: TutorRole,
  content: string,
  overrides: Partial<TutorUiMessage> = {}
): TutorUiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    ...overrides,
  };
}

export function deriveTutorSessionContext(
  sessionState: TutorSessionDerivationInput,
  isInSession: boolean,
  now = Date.now()
): TutorSessionContextPayload {
  const sessionId = sessionState.execution?.sessionId ?? null;
  const totalItems = Math.max(sessionState.scope?.items?.length ?? 1, 1);
  const completedItems = sessionState.execution?.completedItems.length ?? 0;
  const checklistProgress = isInSession && sessionState.execution
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  let sessionElapsedMs = 0;
  if (isInSession && sessionState.execution) {
    const startedAtMs = new Date(sessionState.execution.startedAt).getTime();
    if (Number.isFinite(startedAtMs)) {
      sessionElapsedMs = Math.max(0, now - startedAtMs);
    }
  }

  const currentChecklistItem = isInSession && sessionState.scope && sessionState.execution
    ? sessionState.scope.items?.[sessionState.execution.currentIndex]?.title ?? undefined
    : undefined;

  return {
    sessionId,
    checklistProgress,
    sessionElapsedMs,
    currentChecklistItem,
  };
}

export default function TutorChat({ articleSlug, articleTitle, enabled, practiceContext }: TutorChatProps) {
  const isInSession = useIsInSession();
  const currentChecklistItem = useCurrentSessionItemTitle();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const buildWelcome = () =>
    practiceContext
      ? buildPracticeWelcomeMessage(practiceContext.questionName)
      : buildTutorWelcomeMessage(articleTitle);
  const [messages, setMessages] = useState<TutorUiMessage[]>(() => [
    createMessage('assistant', buildWelcome()),
  ]);

  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { state: sessionState } = useSession();
  const nudgeFiredForRef = useRef<string | null>(null);
  const stepStartedAtRef = useRef<number>(Date.now());

  const lastMessageContentLength = messages.at(-1)?.content.length ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMessageContentLength, isOpen]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([createMessage('assistant', buildWelcome())]);
    setConversationId(null);
    setIsLoading(false);
    setInput('');
    setNudgeVisible(false);
    nudgeFiredForRef.current = null;
    stepStartedAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleSlug, articleTitle]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    stepStartedAtRef.current = Date.now();
    setNudgeVisible(false);
  }, [currentChecklistItem]);

  useEffect(() => {
    const shouldSchedule = shouldScheduleTutorNudge({
      isInSession,
      isOpen,
      messagesLength: messages.length,
      currentChecklistItem,
      nudgeFiredFor: nudgeFiredForRef.current,
    });
    if (!shouldSchedule) {
      setNudgeVisible(false);
      return;
    }

    const remainingMs = getNudgeDelayRemainingMs(stepStartedAtRef.current);
    const timer = window.setTimeout(() => {
      setNudgeVisible(true);
      nudgeFiredForRef.current = currentChecklistItem ?? null;
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [isInSession, isOpen, messages.length, currentChecklistItem]);

  // Practice nudge: show after 2 min of failing tests without opening tutor
  useEffect(() => {
    if (!practiceContext?.testResults) return;
    if (isOpen || messages.length > 1) return;
    const hasFailing = practiceContext.testResults.some(r => !r.passed);
    if (!hasFailing) {
      setNudgeVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setNudgeVisible(true);
    }, PRACTICE_NUDGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [practiceContext?.testResults, isOpen, messages.length]);

  const canSubmit = input.trim().length > 0 && !isLoading;

  if (!enabled) {
    return null;
  }

  const submitUserMessage = async (
    trimmed: string,
    options?: { appendUserMessage?: boolean; assistantMessageId?: string }
  ) => {
    if (!trimmed || isLoading) return;
    const appendUserMessage = options?.appendUserMessage ?? true;

    setIsLoading(true);

    const userMessage = createMessage('user', trimmed);
    const assistantMessage = createMessage('assistant', '', {
      id: options?.assistantMessageId ?? crypto.randomUUID(),
    });
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setMessages((prev) => {
      if (appendUserMessage) {
        return [...prev, userMessage, assistantMessage];
      }
      const cleared = clearTutorAssistantRetryState({
        messages: prev,
        assistantMessageId: assistantMessage.id,
      });
      const hasAssistant = cleared.some((message) => message.id === assistantMessage.id);
      return hasAssistant ? cleared : [...cleared, assistantMessage];
    });

    try {
      const {
        sessionId,
        checklistProgress,
        sessionElapsedMs,
        currentChecklistItem,
      } = deriveTutorSessionContext(sessionState, isInSession);

      const practicePayload = practiceContext
        ? {
            questionName: practiceContext.questionName,
            questionPrompt: practiceContext.questionPrompt,
            difficulty: practiceContext.difficulty,
            category: practiceContext.category,
            pattern: practiceContext.pattern,
            currentCode: practiceContext.currentCode,
            testResults: practiceContext.testResults
              ? practiceContext.testResults.map(({ id, passed, error }) => ({ id, passed, error }))
              : null,
          }
        : undefined;

      const response = await fetch('/api/tutor', {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleSlug,
          message: trimmed,
          conversationId: conversationId ?? undefined,
          checklistProgress,
          sessionElapsedMs,
          sessionId,
          currentChecklistItem,
          ...(practicePayload ? { practiceContext: practicePayload } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get tutor response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventChunk of events) {
          const lines = eventChunk
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            const payload = line.slice(6);

            if (payload === '[DONE]') {
              continue;
            }

            let parsed: { content?: string; conversationId?: number; error?: string } | null = null;
            try {
              parsed = JSON.parse(payload);
            } catch {
              parsed = null;
            }

            if (!parsed) continue;

            if (typeof parsed.conversationId === 'number') {
              setConversationId(parsed.conversationId);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages((prev) => {
                const next = [...prev];
                const index = next.findIndex((message) => message.id === assistantMessage.id);
                if (index === -1) return prev;
                next[index] = { ...next[index], content: assistantContent };
                return next;
              });
            }
          }
        }
      }

      if (!assistantContent.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          const index = next.findIndex((message) => message.id === assistantMessage.id);
          if (index === -1) return prev;
          next[index] = {
            ...next[index],
            content: 'I could not generate a response. Ask your question again with more detail.',
          };
          return next;
        });
      } else {
        const refs = extractArticleRefs(assistantContent);
        if (refs[0]) {
          scrollToAndHighlightSection(refs[0]);
        }
      }
    } catch (streamError) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('[TutorChat] Failed to stream tutor response:', streamError);
      setMessages((prev) =>
        markTutorAssistantError({
          messages: prev,
          assistantMessageId: assistantMessage.id,
          retryPrompt: trimmed,
          content: 'Tutor is temporarily unavailable. Please try again.',
        })
      );
      setInput((currentInput) =>
        restoreInputAfterTutorFailure({
          currentInput,
          failedPrompt: trimmed,
        })
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([createMessage('assistant', buildWelcome())]);
    setConversationId(null);
    setIsLoading(false);
    setInput('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await submitUserMessage(trimmed);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      setInput('');
      void submitUserMessage(trimmed);
    }
  };

  const handleRetry = (message: TutorUiMessage) => {
    if (!message.retryPrompt || isLoading) return;
    setInput((currentInput) => (currentInput.trim() === message.retryPrompt ? '' : currentInput));
    void submitUserMessage(message.retryPrompt, {
      appendUserMessage: false,
      assistantMessageId: message.id,
    });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-[80px] left-0 right-0 z-50 flex h-[520px] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-[0_8px_40px_rgba(0,0,0,0.6)] md:bottom-20 md:left-auto md:right-6 md:h-[70vh] md:max-h-[700px] md:w-[380px] md:rounded-2xl lg:w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-zinc-900/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 flex-shrink-0 text-[#c8f542]" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" />
              </svg>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">AI Tutor</p>
                <p className="text-sm font-semibold text-zinc-100">{articleTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                className="p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                aria-label="New conversation"
                title="New conversation"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

            </div>
          </div>

          {isInSession && <div className="h-[2px] w-full bg-[#c8f542]/60" />}

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-xs text-zinc-600">Start with a question about this topic</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'user' ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      {isLoading && message.content.length === 0 ? (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8f542] [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8f542] [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8f542] [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="mt-1 flex-shrink-0 text-xs text-[#c8f542]">✦</span>
                            <RichText content={stripArticleRefs(message.content)} className="text-sm text-zinc-300" />
                          </div>
                          {message.status === 'error' && message.retryPrompt ? (
                            <button
                              type="button"
                              onClick={() => handleRetry(message)}
                              disabled={isLoading}
                              className="ml-5 inline-flex items-center rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Retry
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={bottomAnchorRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-zinc-800 p-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={2}
              placeholder="Ask a focused question about this article"
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-[10px] text-zinc-600">Socratic only</p>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-[#c8f542] px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-[#d4f75a] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isLoading ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {nudgeVisible && !isOpen && (
        <div className="fixed bottom-20 right-6 z-50">
          <TutorNudge
            onOpen={() => {
              setIsOpen(true);
              setNudgeVisible(false);
              setInput(
                practiceContext?.testResults?.some(r => !r.passed)
                  ? 'My tests are failing — can you help me debug?'
                  : currentChecklistItem ? `I'm stuck on: ${currentChecklistItem}` : 'I need a hint'
              );
            }}
            checklistItemTitle={practiceContext ? practiceContext.questionName : currentChecklistItem}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition-all hover:bg-zinc-800 hover:shadow-[0_0_12px_rgba(200,245,66,0.15)]"
      >
        <span className="relative flex items-center">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" />
          </svg>
          {isOpen && (
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-[#c8f542]" />
          )}
        </span>
        {isOpen ? 'Close' : 'Tutor'}
      </button>
    </>
  );
}
