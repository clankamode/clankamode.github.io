'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RichText } from '@/app/ai/_components/RichText';
import TutorNudge from '@/app/ai/_components/TutorNudge';
import { useCurrentSessionItemTitle, useIsInSession, useSession } from '@/contexts/SessionContext';
import { buildTutorWelcomeMessage } from '@/lib/tutor-prompt';
import { cn } from '@/lib/utils';

interface TutorChatProps {
  articleSlug: string;
  articleTitle: string;
  enabled: boolean;
}

type TutorRole = 'user' | 'assistant';

interface TutorUiMessage {
  id: string;
  role: TutorRole;
  content: string;
}

export const NUDGE_DELAY_MS = 8 * 60 * 1000;

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

function createMessage(role: TutorRole, content: string): TutorUiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
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

export default function TutorChat({ articleSlug, articleTitle, enabled }: TutorChatProps) {
  const isInSession = useIsInSession();
  const currentChecklistItem = useCurrentSessionItemTitle();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [messages, setMessages] = useState<TutorUiMessage[]>(() => [
    createMessage('assistant', buildTutorWelcomeMessage(articleTitle)),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, lastMessageContentLength, isOpen]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([createMessage('assistant', buildTutorWelcomeMessage(articleTitle))]);
    setConversationId(null);
    setIsLoading(false);
    setInput('');
    setNudgeVisible(false);
    nudgeFiredForRef.current = null;
    stepStartedAtRef.current = Date.now();
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

  const canSubmit = input.trim().length > 0 && !isLoading;

  if (!enabled) {
    return null;
  }

  const submitUserMessage = async (trimmed: string) => {
    if (!trimmed || isLoading) return;

    setIsLoading(true);

    const userMessage = createMessage('user', trimmed);
    const assistantMessage = createMessage('assistant', '');
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const {
        sessionId,
        checklistProgress,
        sessionElapsedMs,
        currentChecklistItem,
      } = deriveTutorSessionContext(sessionState, isInSession);

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
      }
    } catch (streamError) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('[TutorChat] Failed to stream tutor response:', streamError);
      setMessages((prev) => {
        const next = [...prev];
        const index = next.findIndex((message) => message.id === assistantMessage.id);
        if (index === -1) return prev;
        next[index] = {
          ...next[index],
          content: 'Tutor is temporarily unavailable. Please try again.',
        };
        return next;
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-end gap-3 md:bottom-4 md:left-auto md:right-4">
      {isOpen && (
        <Card className="flex w-full max-h-[60vh] flex-col rounded-b-none border-border-interactive/50 bg-background/95 p-0 shadow-xl md:h-[min(70vh,680px)] md:max-h-none md:w-[min(420px,calc(100vw-2rem))] md:rounded-xl">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">AI Tutor</p>
              <p className="text-sm font-semibold text-text-primary">{articleTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-interactive hover:text-text-primary"
              aria-label="Close AI tutor"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
          {isInSession && sessionState.execution && (
            <p className="border-b border-border-subtle px-4 py-1.5 font-mono text-[10px] text-text-muted">
              Session active · Step {sessionState.execution.currentIndex + 1} of {sessionState.scope?.items?.length ?? 0}
            </p>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-zinc-500">Ask me anything about this article →</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[90%] rounded-xl px-3 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-brand-green/15 text-text-primary border border-brand-green/25'
                        : 'bg-card text-text-secondary border border-border-subtle'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      isLoading && message.content.length === 0 ? (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <RichText content={message.content} className="space-y-3 text-sm leading-6" />
                      )
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomAnchorRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-border-subtle px-4 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={2}
              placeholder="Ask a focused question about this article"
              className="w-full resize-none rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-interactive"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-text-muted">Socratic hints only, no full solutions.</p>
              <Button type="submit" size="sm" disabled={!canSubmit}>
                {isLoading ? 'Thinking...' : 'Send'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {nudgeVisible && !isOpen && (
        <TutorNudge
          onOpen={() => {
            setIsOpen(true);
            setNudgeVisible(false);
            setInput(currentChecklistItem ? `I'm stuck on: ${currentChecklistItem}` : 'I need a hint');
          }}
          checklistItemTitle={currentChecklistItem}
        />
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="mb-4 mr-4 border-border-interactive/50 bg-background/90 backdrop-blur-sm md:mb-0 md:mr-0"
      >
        {isOpen ? 'Hide Tutor' : 'Ask AI Tutor'}
      </Button>
    </div>
  );
}
