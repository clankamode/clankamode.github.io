'use client';

import { useState, useRef, useEffect } from 'react';
import { upload } from '@vercel/blob/client';
import { Message, ChatConversation, ChatMessage, MessageAttachment } from '@/types/chat';
import { suggestedQueries } from './suggestedQueries';
import RichText from './RichText';

const MODELS = [
  { id: 'gpt-4.1-2025-04-14', name: 'ChatGPT 4.1' },
  { id: 'gpt-4-turbo-2024-04-09', name: 'ChatGPT 4 Turbo' },
  { id: 'gpt-4', name: 'ChatGPT 4' },
  { id: 'gpt-3.5-turbo', name: 'ChatGPT 3.5' },
] as const;

const SYSTEM_PROMPTS = [
  {
    id: 'resume-review',
    title: 'Resume Review',
    description: 'Provide targeted feedback to improve a resume',
    content: `You are an uncompromising resume reviewer. Deliver strict, concise, and actionable feedback.

Formatting & structure
1) Confirm clear sections: Education, Experience, Projects, Leadership, Skills.
2) Enforce one-page length for typical candidates.
3) Flag bad formatting: messy order, long paragraphs, unclear headings.

Content basics
4) Confirm graduation date is present. If missing, call it out explicitly.
5) Require internships, projects, leadership, and open-source/coding competitions/hackathons. Missing items must be flagged.
6) Remove fluff or irrelevant info.

Experience bullets (apply to EVERY bullet under Experience)
7) Each bullet MUST follow “Accomplished [X] as measured by [Y] by doing [Z].”
8) Each bullet MUST include metrics and impact.
9) Bullets MUST be results-oriented, not responsibilities. Flag weak/empty bullets.

Tailoring & quality
10) Each line MUST start with a strong action verb.
11) MUST be tailored to the target company/role (keywords, tech stack, relevant impact). Call out generic lines.

Gut check
12) State clearly: Would you refer/interview this person based on what’s written? If not, specify whether it’s missing info (e.g., no projects) or lack of impact.

Output requirements
- Be blunt and explicit; do NOT soften critiques.
- Evaluate bullet-by-bullet under Experience so no bullet escapes scrutiny.
- Use a numbered checklist with pass/fail notes and concrete rewrites where possible.
- Keep the review tight and direct.`,
  },
  {
    id: 'timestamp-generator',
    title: 'Timestamp Generator',
    description: 'Generate YouTube-style timestamps from content',
    content:
      'You create organized timestamp lists. Given notes or a transcript, produce chronological timestamps with short, descriptive labels. Use mm:ss formatting unless hours are present.',
  },
] as const;

export default function ChatInterface() {
  // Conversation state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<(typeof SYSTEM_PROMPTS)[number] | null>(null);
  const [isPromptMenuOpen, setIsPromptMenuOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState('');
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024; // Keep desktop open, collapse mobile on load
  });
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestedQueryClick = (query: string) => {
    setInput(query);
    scrollToBottom();
    // Use setTimeout to ensure the textarea is rendered before focusing
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    const match = value.match(/\/([^\s]*)$/);
    if (match) {
      setPromptQuery(match[1]);
      setIsPromptMenuOpen(true);
    } else {
      setIsPromptMenuOpen(false);
      setPromptQuery('');
    }
  };

  const handleSystemPromptSelect = (promptId: string) => {
    const prompt = SYSTEM_PROMPTS.find((p) => p.id === promptId) || null;
    setSelectedSystemPrompt(prompt);
    setIsPromptMenuOpen(false);
    setPromptQuery('');
    setInput((prev) => prev.replace(/\/[^\s]*$/, ''));

    // Focus back on the textarea for quick typing after selection
    textareaRef.current?.focus();
  };

  const clearSystemPrompt = () => {
    setSelectedSystemPrompt(null);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (editInputRef.current && editingConversationId) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingConversationId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

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
      
      console.log('Loaded conversation data:', data);
      console.log('Messages:', data.messages);
      
      setCurrentConversationId(conversationId);
      setMessages(data.messages?.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
      })) || []);
      setSelectedModel(data.model);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    try {
      const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          model: selectedModel,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      
      // Add to conversations list
      setConversations(prev => [data, ...prev]);
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
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If this was the current conversation, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (!response.ok) throw new Error('Failed to rename conversation');
      
      // Update in list
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
      );
      
      setEditingConversationId(null);
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
    setAttachments([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Determine file type
        const attachmentType = file.type.startsWith('image/') ? 'image' : 'pdf';

        if (attachmentType === 'pdf') {
          // Upload PDF to both Vercel Blob (for preview) and OpenAI Files API (for chat) in parallel
          
          const formData = new FormData();
          formData.append('file', file);

          // Upload to both services in parallel
          const [blob, openaiResponse] = await Promise.all([
            // 1. Upload to Vercel Blob for preview
            upload(file.name, file, {
              access: 'public',
              handleUploadUrl: '/api/chat/upload',
            }),
            // 2. Upload to OpenAI Files API for chat
            fetch('/api/chat/upload-pdf', {
              method: 'POST',
              body: formData,
            }),
          ]);

          if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            throw new Error(errorData.error || 'Failed to upload PDF');
          }

          const data = await openaiResponse.json();

          // Switch to GPT-4.1 if not already selected
          if (selectedModel !== 'gpt-4.1-2025-04-14') {
            setSelectedModel('gpt-4.1-2025-04-14');
          }

          return {
            id: crypto.randomUUID(),
            type: 'pdf' as const,
            url: blob.url, // For preview
            file_id: data.file_id, // For OpenAI chat
            name: file.name,
            size: file.size,
          };
        } else {
          // Upload images to Vercel Blob
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/chat/upload',
          });

          return {
            id: crypto.randomUUID(),
            type: 'image' as const,
            url: blob.url,
            name: file.name,
            size: file.size,
          };
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter') {
      dragCounter.current += 1;
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    // Filter for allowed file types
    const allowedFiles = Array.from(droppedFiles).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (allowedFiles.length === 0) {
      alert('Please drop only image or PDF files');
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = allowedFiles.map(async (file) => {
        // Determine file type
        const attachmentType = file.type.startsWith('image/') ? 'image' : 'pdf';

        if (attachmentType === 'pdf') {
          // Upload PDF to both Vercel Blob (for preview) and OpenAI Files API (for chat) in parallel
          
          const formData = new FormData();
          formData.append('file', file);

          // Upload to both services in parallel
          const [blob, openaiResponse] = await Promise.all([
            // 1. Upload to Vercel Blob for preview
            upload(file.name, file, {
              access: 'public',
              handleUploadUrl: '/api/chat/upload',
            }),
            // 2. Upload to OpenAI Files API for chat
            fetch('/api/chat/upload-pdf', {
              method: 'POST',
              body: formData,
            }),
          ]);

          if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            throw new Error(errorData.error || 'Failed to upload PDF');
          }

          const data = await openaiResponse.json();

          // Switch to GPT-4.1 if not already selected
          if (selectedModel !== 'gpt-4.1-2025-04-14') {
            setSelectedModel('gpt-4.1-2025-04-14');
          }

          return {
            id: crypto.randomUUID(),
            type: 'pdf' as const,
            url: blob.url, // For preview
            file_id: data.file_id, // For OpenAI chat
            name: file.name,
            size: file.size,
          };
        } else {
          // Upload images to Vercel Blob
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/chat/upload',
          });

          return {
            id: crypto.randomUUID(),
            type: 'image' as const,
            url: blob.url,
            name: file.name,
            size: file.size,
          };
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    setIsPromptMenuOpen(false);
    setPromptQuery('');

    const userMessage: Message = {
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    let conversationId = currentConversationId;

    // Create conversation if this is the first message
    if (!conversationId) {
      conversationId = await createConversation(input);
      if (!conversationId) {
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    await saveMessage(conversationId, userMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: selectedSystemPrompt
            ? [{ role: 'system', content: selectedSystemPrompt.content }, ...messages, userMessage]
            : [...messages, userMessage],
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages(prev => {
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

      // Save assistant message
      if (conversationId && assistantMessage) {
        await saveMessage(conversationId, { role: 'assistant', content: assistantMessage });
        
        // Update conversation's updated_at in the list
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isPromptMenuOpen && e.key === 'Escape') {
      setIsPromptMenuOpen(false);
      setPromptQuery('');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2 bg-[#2cbb5d] text-white rounded-lg hover:bg-[#25a352] transition-colors font-medium text-sm"
          >
            + New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative rounded-lg ${
                    currentConversationId === conv.id
                      ? 'bg-gray-200 dark:bg-gray-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {editingConversationId === conv.id ? (
                    <div className="p-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            renameConversation(conv.id, editingTitle);
                          } else {
                            setEditingConversationId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim()) {
                              renameConversation(conv.id, editingTitle);
                            }
                          } else if (e.key === 'Escape') {
                            setEditingConversationId(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d]"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => loadConversation(conv.id)}
                        className="flex-1 text-left p-3 text-sm text-gray-900 dark:text-gray-100 truncate"
                      >
                        {conv.title || 'Untitled conversation'}
                      </button>
                      <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConversationId(conv.id);
                            setEditingTitle(conv.title || '');
                          }}
                          className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
                          title="Rename"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 md:p-4 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 md:px-4 py-2 text-lg md:text-2xl font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2cbb5d] cursor-pointer"
              disabled={isLoading || (currentConversationId !== null && messages.length > 0) || attachments.some(att => att.type === 'pdf')}
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            {attachments.some(att => att.type === 'pdf') && (
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                (PDF requires GPT-4.1)
              </span>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                  How can I help you today?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Ask me anything or start a conversation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestedQueries.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQueryClick(example.query)}
                      className="p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        {example.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-[#2cbb5d] text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id}>
                            {attachment.type === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full rounded-lg max-h-64 object-contain"
                              />
                            ) : (
                              <div className="space-y-2">
                                {attachment.url && (
                                  <iframe
                                    src={attachment.url}
                                    className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
                                    title={attachment.name}
                                  />
                                )}
                                <div
                                  className={`flex items-center gap-2 p-2 rounded ${
                                    message.role === 'user'
                                      ? 'bg-[#25a352]'
                                      : 'bg-gray-300 dark:bg-gray-700'
                                  }`}
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="text-sm truncate">{attachment.name}</span>
                                  {attachment.url && (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs underline ml-auto"
                                    >
                                      Open in new tab
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <RichText content={message.content} />
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <div 
          className="border-t border-gray-200 dark:border-gray-700 p-4 relative"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {dragActive && (
            <div 
              className="absolute inset-0 bg-[#2cbb5d]/10 border-2 border-dashed border-[#2cbb5d] rounded-lg z-10 flex items-center justify-center"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg pointer-events-none">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Drop files here</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Images and PDFs supported</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group"
                >
                  {attachment.type === 'image' ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="h-20 w-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex flex-col gap-2">
                      {attachment.url && (
                        <iframe
                          src={attachment.url}
                          className="w-48 h-32 rounded-lg border border-gray-300 dark:border-gray-600"
                          title={attachment.name}
                        />
                      )}
                      <div className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{attachment.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Ready to send</span>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="ml-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              title="Upload files"
            >
              {isUploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2cbb5d] dark:bg-gray-800 dark:text-white resize-none max-h-32 min-h-[3rem]"
                disabled={isLoading}
                rows={1}
              />
              {isPromptMenuOpen && (
                <div className="absolute bottom-14 left-0 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Insert a system prompt</div>
                  <div className="max-h-56 overflow-y-auto">
                    {SYSTEM_PROMPTS.filter(
                      (prompt) =>
                        prompt.title.toLowerCase().includes(promptQuery.toLowerCase()) ||
                        prompt.description.toLowerCase().includes(promptQuery.toLowerCase())
                    ).map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => handleSystemPromptSelect(prompt.id)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            /
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{prompt.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{prompt.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="px-6 py-3 bg-[#2cbb5d] text-white rounded-lg hover:bg-[#25a352] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
          {selectedSystemPrompt && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                /
              </span>
              <span className="font-medium">{selectedSystemPrompt.title}</span>
              <button
                type="button"
                onClick={clearSystemPrompt}
                className="text-gray-500 transition hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Clear system prompt"
              >
                ×
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
