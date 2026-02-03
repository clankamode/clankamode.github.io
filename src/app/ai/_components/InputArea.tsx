'use client';

import { useState, useRef, RefObject, ChangeEvent, KeyboardEvent, DragEvent, FormEvent } from 'react';
import { MessageAttachment } from '@/types/chat';

interface SystemPrompt {
    id: string;
    title: string;
    description: string;
    content: string;
}

interface InputAreaProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isUploading: boolean;
    attachments: MessageAttachment[];
    selectedModel: string;
    selectedSystemPrompt: SystemPrompt | null;
    systemPrompts: ReadonlyArray<SystemPrompt>;
    isPromptMenuOpen: boolean;
    promptQuery: string;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    onSubmit: (e: FormEvent) => void;
    onFilesSelected: (files: FileList | null) => void;
    onRemoveAttachment: (id: string) => void;
    onSystemPromptSelect: (promptId: string) => void;
    onClearSystemPrompt: () => void;
}

export function InputArea({
    input,
    setInput,
    isLoading,
    isUploading,
    attachments,
    selectedModel,
    selectedSystemPrompt,
    systemPrompts,
    isPromptMenuOpen,
    promptQuery,
    textareaRef,
    onSubmit,
    onFilesSelected,
    onRemoveAttachment,
    onSystemPromptSelect,
    onClearSystemPrompt,
}: InputAreaProps) {
    const [dragActive, setDragActive] = useState(false);
    const dragCounter = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (value: string) => {
        setInput(value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    const handleDrag = (e: DragEvent) => {
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

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        dragCounter.current = 0;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            onFilesSelected(droppedFiles);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(e.target.files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const filteredPrompts = systemPrompts.filter(
        (prompt) =>
            prompt.title.toLowerCase().includes(promptQuery.toLowerCase()) ||
            prompt.description.toLowerCase().includes(promptQuery.toLowerCase())
    );

    return (
        <div
            className="relative transition-all duration-200"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {dragActive && (
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-20 flex items-center justify-center border border-brand-green/30"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                        <svg className="w-12 h-12 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-medium text-foreground">Release to Drop</p>
                    </div>
                </div>
            )}
            {attachments.length > 0 && (
                <div className="px-4 pt-4 pb-0 flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative group animate-in fade-in slide-in-from-bottom-2 duration-200"
                        >
                            {attachment.type === 'image' ? (
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="h-14 w-14 object-cover rounded-md border border-white/10 brightness-75 group-hover:brightness-100 transition-all"
                                    />
                                    <button
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs text-foreground truncate max-w-[100px]">{attachment.name}</span>
                                    <button
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className="ml-1 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <form
                onSubmit={onSubmit}
                className="relative flex items-center gap-2 px-2 min-h-[52px] bg-white/[0.03] border border-white/10 rounded-xl transition-all duration-200 focus-within:bg-white/[0.05] focus-within:border-white/15"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedModel === 'gemini-3-pro-image-preview' ? 'image/*' : 'image/*,.pdf'}
                    multiple={selectedModel !== 'gemini-3-pro-image-preview'}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading || (selectedModel === 'gemini-3-pro-image-preview' && attachments.length > 0)}
                    className="flex-shrink-0 h-9 w-9 flex items-center justify-center self-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Upload"
                >
                    {isUploading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                </button>
                <div className="flex-1 flex items-center">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            selectedModel === 'gemini-3-pro-image-preview'
                                ? attachments.length > 0 && attachments[0].type === 'image'
                                    ? 'Describe how to edit...'
                                    : 'Describe image to generate...'
                                : 'Message...'
                        }
                        className="w-full bg-transparent border-none focus:ring-0 outline-none text-white/90 placeholder:text-white/20 resize-none overflow-hidden text-[15px] leading-6 py-[14px]"
                        disabled={isLoading}
                        rows={1}
                    />
                    {isPromptMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-4 w-96 rounded-lg border border-white/10 bg-[#18181b] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="px-3 py-2 text-[10px] font-medium text-white/40 uppercase tracking-widest bg-white/[0.02] border-b border-white/5">System Prompts</div>
                            <div className="max-h-64 overflow-y-auto p-1">
                                {filteredPrompts.map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        type="button"
                                        onClick={() => onSystemPromptSelect(prompt.id)}
                                        className="w-full px-3 py-2 text-left hover:bg-white/5 rounded-md transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded bg-white/5 text-[10px] font-mono text-white/40 group-hover:text-white/80 transition-all">
                                                /
                                            </span>
                                            <div className="min-w-0">
                                                <div className="font-medium text-[13px] text-white/80 group-hover:text-white truncate">{prompt.title}</div>
                                                <div className="text-[11px] text-white/40 truncate opacity-60">{prompt.description}</div>
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
                    className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center self-center transition-all duration-200 focus:outline-none ${!input.trim() && attachments.length === 0
                        ? 'text-white/10 cursor-not-allowed'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </form>
            {selectedSystemPrompt && (
                <div className="absolute -top-10 left-0 inline-flex items-center gap-2 rounded-full bg-surface-interactive px-3 py-1 text-sm text-foreground border border-white/5 backdrop-blur-md">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 border border-white/5 text-[10px] font-semibold text-muted-foreground">
                        /
                    </span>
                    <span className="font-medium">{selectedSystemPrompt.title}</span>
                    <button
                        type="button"
                        onClick={onClearSystemPrompt}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear system prompt"
                    >
                        ×
                    </button>
                </div>
            )}
            <p className="sr-only">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}
