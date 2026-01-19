'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageAttachment } from '@/types/chat';
import { MODELS, SYSTEM_PROMPTS, TUTORIAL_PROMPT_TEMPLATE } from './constants';
import { suggestedQueries } from './suggestedQueries';
import { TutorialFormState } from './types';
import { useChat } from './hooks/useChat';
import { useConversations } from './hooks/useConversations';
import { ChatSidebar } from './ChatSidebar';
import { MessageList } from './MessageList';
import { TutorialModal } from './TutorialModal';
import { TimestampModal } from './TimestampModal';
import { uploadFile } from './utils/uploadFile';

export default function ChatInterface() {
  const { data: session } = useSession();
  
  // Message state
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPromptMenuOpen, setIsPromptMenuOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState('');

  const {
    conversations,
    currentConversationId,
    isLoadingConversations,
    loadConversations,
    loadConversation,
    createConversation,
    saveMessage,
    deleteConversation,
    renameConversation,
    startNewChat,
    setConversations,
  } = useConversations({
    setInput,
    setAttachments,
  });

  const {
    messages,
    setMessages,
    isLoading,
    selectedModel,
    setSelectedModel,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    submitMessage,
  } = useChat({
    currentConversationId,
    createConversation,
    saveMessage,
    setConversations,
    setInput,
    setAttachments,
    setIsPromptMenuOpen,
    setPromptQuery,
  });

  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [tutorialForm, setTutorialForm] = useState<TutorialFormState>({
    problemStatement: '',
    constraintsAndExamples: '',
    candidateSolutions: [''],
    knownOptimalSolution: '',
  });

  const [isTimestampModalOpen, setIsTimestampModalOpen] = useState(false);
  const [timestampTranscript, setTimestampTranscript] = useState('');
  
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

  const buildTutorialPrompt = ({
    problemStatement,
    constraintsAndExamples,
    candidateSolutions,
    knownOptimalSolution,
  }: TutorialFormState) => {
    const formattedCandidates = candidateSolutions
      .map((solution, index) => `• Solution ${index + 1}: ${solution || '[empty]'}`)
      .join('\n');

    return TUTORIAL_PROMPT_TEMPLATE
      .replace('[PROBLEM_STATEMENT]', problemStatement || '[PASTE HERE]')
      .replace('[CONSTRAINTS_AND_EXAMPLES]', constraintsAndExamples || '[PASTE HERE]')
      .replace('[CANDIDATE_SOLUTIONS]', formattedCandidates || '• Solution 1: [code or description]')
      .replace('[KNOWN_OPTIMAL_SOLUTION]', knownOptimalSolution || 'unknown');
  };

  const handleSystemPromptSelect = (promptId: string) => {
    const prompt = SYSTEM_PROMPTS.find((p) => p.id === promptId) || null;
    setIsPromptMenuOpen(false);
    setPromptQuery('');
    setInput((prev) => prev.replace(/\/[^\s]*$/, ''));

    // Open modal for timestamp-generator instead of just selecting the prompt
    if (promptId === 'timestamp-generator') {
      setIsTimestampModalOpen(true);
      return;
    }

    setSelectedSystemPrompt(prompt);

    // Focus back on the textarea for quick typing after selection
    textareaRef.current?.focus();
  };

  const clearSystemPrompt = () => {
    setSelectedSystemPrompt(null);
  };

  const handleTutorialFieldChange = (field: keyof TutorialFormState, value: string) => {
    setTutorialForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCandidateSolutionChange = (index: number, value: string) => {
    setTutorialForm((prev) => {
      const nextSolutions = [...prev.candidateSolutions];
      nextSolutions[index] = value;
      return { ...prev, candidateSolutions: nextSolutions };
    });
  };

  const addCandidateSolution = () => {
    setTutorialForm((prev) => ({
      ...prev,
      candidateSolutions: [...prev.candidateSolutions, ''],
    }));
  };

  const removeCandidateSolution = (index: number) => {
    setTutorialForm((prev) => {
      if (prev.candidateSolutions.length === 1) {
        return prev;
      }
      return {
        ...prev,
        candidateSolutions: prev.candidateSolutions.filter((_, i) => i !== index),
      };
    });
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

  // Load conversations on mount and when session changes (e.g., proxy user changes)
  useEffect(() => {
    if (session) {
      startNewChat();
      setMessages([]);
      // Load conversations for the current (possibly proxied) user
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, session?.isProxying]);

  const handleStartNewChat = () => {
    startNewChat();
    setMessages([]);
  };

  const handleLoadConversation = async (conversationId: string) => {
    const data = await loadConversation(conversationId);
    if (!data) return;
    setMessages(data.messages);
    setSelectedModel(data.model);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const removedCurrent = await deleteConversation(conversationId);
    if (removedCurrent) {
      setMessages([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(uploadFile);
      const uploadedFiles = await Promise.all(uploadPromises);
      if (
        uploadedFiles.some((file) => file.type === 'pdf') &&
        selectedModel !== 'gpt-4.1-2025-04-14'
      ) {
        setSelectedModel('gpt-4.1-2025-04-14');
      }
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
      const uploadPromises = allowedFiles.map(uploadFile);
      const uploadedFiles = await Promise.all(uploadPromises);
      if (
        uploadedFiles.some((file) => file.type === 'pdf') &&
        selectedModel !== 'gpt-4.1-2025-04-14'
      ) {
        setSelectedModel('gpt-4.1-2025-04-14');
      }
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
    await submitMessage(input, attachments);
  };

  const handleTutorialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = buildTutorialPrompt(tutorialForm);
    setIsTutorialModalOpen(false);
    setTutorialForm({
      problemStatement: '',
      constraintsAndExamples: '',
      candidateSolutions: [''],
      knownOptimalSolution: '',
    });
    await submitMessage(prompt, []);
  };

  const handleTimestampSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timestampTranscript.trim()) return;

    // Find the timestamps query template and replace the placeholder with the actual transcript
    const timestampQuery = suggestedQueries.find((q) => q.title === 'Generate Chapters & Timestamps');
    const prompt = timestampQuery
      ? timestampQuery.query.replace('Insert Transcript Here', timestampTranscript)
      : `Please generate chapters and timestamps for this transcript:\n\n${timestampTranscript}`;

    setIsTimestampModalOpen(false);
    setTimestampTranscript('');
    await submitMessage(prompt, []);
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

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <ChatSidebar
        isOpen={isSidebarOpen}
        onNewChat={handleStartNewChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoadingConversations}
        conversations={conversations}
        currentConversationId={currentConversationId}
        editingConversationId={editingConversationId}
        editingTitle={editingTitle}
        onEditTitleChange={setEditingTitle}
        onEditStart={(id, title) => {
          setEditingConversationId(id);
          setEditingTitle(title);
        }}
        onEditCancel={() => setEditingConversationId(null)}
        onRename={renameConversation}
        onDelete={handleDeleteConversation}
        onSelect={handleLoadConversation}
        editInputRef={editInputRef}
      />

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
            {selectedModel === 'gemini-3-pro-image-preview' && (
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {attachments.length > 0 && attachments[0].type === 'image' 
                  ? '(Image editing mode)' 
                  : '(Image generation mode)'}
              </span>
            )}
          </div>
        </div>

        <MessageList
          messages={messages}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSuggestedQueryClick={handleSuggestedQueryClick}
          onOpenTimestampModal={() => setIsTimestampModalOpen(true)}
          onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
          messagesEndRef={messagesEndRef}
        />

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
              accept={selectedModel === 'gemini-3-pro-image-preview' ? 'image/*' : 'image/*,.pdf'}
              multiple={selectedModel !== 'gemini-3-pro-image-preview'}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading || (selectedModel === 'gemini-3-pro-image-preview' && attachments.length > 0)}
              className="px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              title={selectedModel === 'gemini-3-pro-image-preview' ? 'Upload image to edit' : 'Upload files'}
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
                placeholder={
                  selectedModel === 'gemini-3-pro-image-preview'
                    ? attachments.length > 0 && attachments[0].type === 'image'
                      ? 'Describe how to edit the image... (e.g., "make it black and white", "add a sunset")'
                      : 'Describe the image you want to generate...'
                    : 'Type your message... (Shift+Enter for new line)'
                }
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

      <TutorialModal
        isOpen={isTutorialModalOpen}
        form={tutorialForm}
        onClose={() => setIsTutorialModalOpen(false)}
        onSubmit={handleTutorialSubmit}
        onFieldChange={handleTutorialFieldChange}
        onCandidateChange={handleCandidateSolutionChange}
        onAddCandidate={addCandidateSolution}
        onRemoveCandidate={removeCandidateSolution}
      />

      <TimestampModal
        isOpen={isTimestampModalOpen}
        transcript={timestampTranscript}
        onClose={() => setIsTimestampModalOpen(false)}
        onSubmit={handleTimestampSubmit}
        onTranscriptChange={setTimestampTranscript}
      />
    </div>
  );
}
