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
import { TutorialModal } from './TutorialModal';
import { TimestampModal } from './TimestampModal';
import { InputArea } from './InputArea';
import { ModelSelector } from './ModelSelector';
import { uploadFile } from './utils/uploadFile';
import { TurnRenderer } from './TurnRenderer';
import { EmptyStateCreate } from './EmptyStateCreate';

export default function ChatInterface() {
  const { data: session } = useSession();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

    if (promptId === 'timestamp-generator') {
      setIsTimestampModalOpen(true);
      return;
    }

    setSelectedSystemPrompt(prompt);
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

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };


  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = validFiles.map(uploadFile);
      const uploadedFiles = await Promise.all(uploadPromises);

      if (uploadedFiles.some((file) => file.type === 'pdf') && selectedModel !== 'gpt-4.1-2025-04-14') {
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

  return (
    <div className="flex h-screen overflow-hidden mt-[-3.5rem]">
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
        session={session}
      />

      <div className="flex-1 flex flex-col min-h-0 bg-background relative">
        <div className="absolute top-0 left-0 right-0 z-10 p-3 md:p-4 flex flex-wrap gap-3 justify-between items-center bg-gradient-to-b from-background to-transparent">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <ModelSelector
              models={MODELS}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              disabled={isLoading || (currentConversationId !== null && messages.length > 0) || attachments.some(att => att.type === 'pdf')}
            />
            {attachments.some(att => att.type === 'pdf') && (
              <span className="text-sm text-muted-foreground ml-2">
                (PDF requires GPT-4.1)
              </span>
            )}
            {selectedModel === 'gemini-3-pro-image-preview' && (
              <span className="text-sm text-muted-foreground ml-2">
                {attachments.length > 0 && attachments[0].type === 'image'
                  ? '(Image editing mode)'
                  : '(Image generation mode)'}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-20">
          {messages.length === 0 ? (
            <EmptyStateCreate
              mode={selectedModel === 'gemini-3-pro-image-preview' ? 'image' : 'chat'}
              composer={
                <InputArea
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  isUploading={isUploading}
                  attachments={attachments}
                  selectedModel={selectedModel}
                  selectedSystemPrompt={selectedSystemPrompt}
                  systemPrompts={SYSTEM_PROMPTS}
                  isPromptMenuOpen={isPromptMenuOpen}
                  promptQuery={promptQuery}
                  textareaRef={textareaRef}
                  onSubmit={handleSubmit}
                  onFilesSelected={handleFilesSelected}
                  onRemoveAttachment={removeAttachment}
                  onSystemPromptSelect={handleSystemPromptSelect}
                  onClearSystemPrompt={clearSystemPrompt}
                />
              }
              chips={[
                { label: 'Write code', onClick: () => handleSuggestedQueryClick('Help me write a React component') },
                { label: 'Explain concept', onClick: () => handleSuggestedQueryClick('Explain how async/await works in JavaScript') },
                { label: 'Debug issue', onClick: () => handleSuggestedQueryClick('Help me debug this error') },
              ]}
              templates={[
                { title: 'Generate Timestamps', description: 'Create chapters from a transcript', onClick: () => setIsTimestampModalOpen(true) },
                { title: 'Code Tutorial', description: 'Structured learning for a problem', onClick: () => setIsTutorialModalOpen(true) },
              ]}
            />
          ) : (
            <TurnRenderer
              messages={messages}
              isLoading={isLoading}
              selectedModel={selectedModel}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>

        {/* Composer - only show when there are messages (not in empty state) */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <div className="mx-auto w-full max-w-[920px] px-6">
              {/* Pending node + composer in one flex row */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center mt-[18px]">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-white/40 bg-transparent" />
                </div>
                <div className="flex-1">
                  <InputArea
                    input={input}
                    setInput={setInput}
                    isLoading={isLoading}
                    isUploading={isUploading}
                    attachments={attachments}
                    selectedModel={selectedModel}
                    selectedSystemPrompt={selectedSystemPrompt}
                    systemPrompts={SYSTEM_PROMPTS}
                    isPromptMenuOpen={isPromptMenuOpen}
                    promptQuery={promptQuery}
                    textareaRef={textareaRef}
                    onSubmit={handleSubmit}
                    onFilesSelected={handleFilesSelected}
                    onRemoveAttachment={removeAttachment}
                    onSystemPromptSelect={handleSystemPromptSelect}
                    onClearSystemPrompt={clearSystemPrompt}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
