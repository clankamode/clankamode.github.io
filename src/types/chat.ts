export interface ChatConversation {
  id: string;
  email: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  token_count?: number | null;
  metadata?: Record<string, unknown>;
  parent_message_id?: string | null;
}

// For API responses
export interface ConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}

export interface ConversationListItem extends ChatConversation {
  message_count: number;
  last_message_preview?: string;
}

// For the ChatInterface component
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

