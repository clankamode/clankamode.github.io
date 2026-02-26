'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RichText } from '@/app/ai/_components/RichText';
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

function createMessage(role: TutorRole, content: string): TutorUiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export default function TutorChat({ articleSlug, articleTitle, enabled }: TutorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TutorUiMessage[]>(() => [
    createMessage('assistant', buildTutorWelcomeMessage(articleTitle)),
  ]);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([createMessage('assistant', buildTutorWelcomeMessage(articleTitle))]);
    setConversationId(null);
    setIsLoading(false);
    setInput('');
  }, [articleSlug, articleTitle]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <Card className="flex h-[min(70vh,680px)] w-[min(420px,calc(100vw-2rem))] flex-col border-border-interactive/50 bg-background/95 p-0 shadow-xl">
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

          <div ref={messageListRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
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
                    <RichText content={message.content} className="space-y-3 text-sm leading-6" />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border-subtle px-4 py-3">
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

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border-interactive/50 bg-background/90 backdrop-blur-sm"
      >
        {isOpen ? 'Hide Tutor' : 'Ask AI Tutor'}
      </Button>
    </div>
  );
}
