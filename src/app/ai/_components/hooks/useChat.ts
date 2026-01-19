import { useState } from 'react';
import { ChatConversation, Message, MessageAttachment } from '@/types/chat';
import { MODELS, SYSTEM_PROMPTS } from '../constants';

interface UseChatOptions {
  currentConversationId: string | null;
  createConversation: (firstMessage: string, model: string) => Promise<string | null>;
  saveMessage: (conversationId: string, message: Message) => Promise<void>;
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  setInput: (value: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<MessageAttachment[]>>;
  setIsPromptMenuOpen: (value: boolean) => void;
  setPromptQuery: (value: string) => void;
}

export const useChat = ({
  currentConversationId,
  createConversation,
  saveMessage,
  setConversations,
  setInput,
  setAttachments,
  setIsPromptMenuOpen,
  setPromptQuery,
}: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<
    (typeof SYSTEM_PROMPTS)[number] | null
  >(null);

  const submitMessage = async (content: string, messageAttachments: MessageAttachment[]) => {
    if ((!content.trim() && messageAttachments.length === 0) || isLoading) return;

    setIsPromptMenuOpen(false);
    setPromptQuery('');

    const userMessage: Message = {
      role: 'user',
      content,
      attachments: messageAttachments.length > 0 ? [...messageAttachments] : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = await createConversation(content, selectedModel);
      if (!conversationId) {
        setIsLoading(false);
        return;
      }
    }

    await saveMessage(conversationId, userMessage);

    try {
      const isImageGeneration = selectedModel === 'gemini-3-pro-image-preview';
      const inputImageUrl =
        isImageGeneration &&
        messageAttachments.length > 0 &&
        messageAttachments[0].type === 'image'
          ? messageAttachments[0].url
          : undefined;

      const response = await fetch(
        isImageGeneration ? '/api/chat/generate-image' : '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isImageGeneration
              ? {
                  prompt: content,
                  inputImageUrl,
                }
              : {
                  messages: selectedSystemPrompt
                    ? [{ role: 'system', content: selectedSystemPrompt.content }, ...messages, userMessage]
                    : [...messages, userMessage],
                  model: selectedModel,
                }
          ),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantMessage = '';
      const generatedImages: { id: string; url: string; mimeType?: string }[] = [];
      setMessages((prev) => [...prev, { role: 'assistant', content: '', generatedImages: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);

              if (isImageGeneration) {
                if (parsed.type === 'image') {
                  generatedImages.push({
                    id: crypto.randomUUID(),
                    url: parsed.url,
                    mimeType: parsed.mimeType,
                  });
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                      generatedImages: [...generatedImages],
                    };
                    return newMessages;
                  });
                } else if (parsed.type === 'text') {
                  assistantMessage += parsed.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                      generatedImages: [...generatedImages],
                    };
                    return newMessages;
                  });
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error);
                }
              } else if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (conversationId && (assistantMessage || generatedImages.length > 0)) {
        await saveMessage(conversationId, {
          role: 'assistant',
          content: assistantMessage || 'Generated image',
          generatedImages: generatedImages.length > 0 ? generatedImages : undefined,
        });

        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === conversationId
                ? { ...c, updated_at: new Date().toISOString() }
                : c
            )
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    selectedModel,
    setSelectedModel,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    submitMessage,
  };
};
