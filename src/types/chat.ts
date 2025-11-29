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
  attachments?: MessageAttachment[];
  generatedImages?: GeneratedImage[];
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
export interface MessageAttachment {
  id: string;
  type: 'image' | 'pdf' | 'generated-image';
  url?: string; // Optional for PDFs (which use file_id)
  file_id?: string; // OpenAI Files API ID for PDFs
  name: string;
  size?: number;
  mimeType?: string; // For generated images
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  generatedImages?: GeneratedImage[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  mimeType?: string;
  prompt?: string;
}

