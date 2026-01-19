import { useState } from 'react';
import { ChatConversation, ChatMessage, Message, MessageAttachment } from '@/types/chat';

interface UseConversationsOptions {
  setInput: (value: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<MessageAttachment[]>>;
}

export const useConversations = ({
  setInput,
  setAttachments,
}: UseConversationsOptions) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/chat/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();

      setCurrentConversationId(conversationId);
      return {
        messages:
          data.messages?.map((msg: ChatMessage) => ({
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments,
            generatedImages: msg.generatedImages,
          })) || [],
        model: data.model,
      };
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
    return null;
  };

  const createConversation = async (
    firstMessage: string,
    model: string
  ): Promise<string | null> => {
    try {
      const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          model,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();

      setConversations((prev) => [data, ...prev]);
      setCurrentConversationId(data.id);

      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (conversationId: string, message: Message) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          attachments: message.attachments,
          generatedImages: message.generatedImages,
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return false;
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      const removedCurrent = currentConversationId === conversationId;
      if (removedCurrent) {
        setCurrentConversationId(null);
      }
      return removedCurrent;
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
    return false;
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) throw new Error('Failed to rename conversation');

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
      );

      return true;
    } catch (error) {
      console.error('Error renaming conversation:', error);
      return false;
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setInput('');
    setAttachments([]);
  };

  return {
    conversations,
    currentConversationId,
    isLoadingConversations,
    loadConversations,
    loadConversation,
    createConversation,
    saveMessage,
    deleteConversation,
    renameConversation,
    setCurrentConversationId,
    setConversations,
    startNewChat,
  };
};
