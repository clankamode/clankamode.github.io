'use client';

import { useState, useRef, RefObject, ChangeEvent, KeyboardEvent, DragEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
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
            className="border-t border-border p-4 relative bg-background"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {dragActive && (
                <div
                    className="absolute inset-0 bg-brand-green/10 border-2 border-dashed border-brand-green rounded-lg z-10 flex items-center justify-center backdrop-blur-sm"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="bg-background rounded-lg p-6 shadow-lg pointer-events-none border border-border">
                        <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-xl font-semibold text-foreground">Drop files here</p>
                            <p className="text-base text-muted-foreground">Images and PDFs supported</p>
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
                                        className="h-20 w-20 object-cover rounded-lg border border-border"
                                    />
                                    <button
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-sm"
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
                                            className="w-48 h-32 rounded-lg border border-border bg-background"
                                            title={attachment.name}
                                        />
                                    )}
                                    <div className="relative flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <div className="flex flex-col">
                                            <span className="text-base text-foreground truncate max-w-[150px]">{attachment.name}</span>
                                            <span className="text-sm text-muted-foreground">Ready to send</span>
                                        </div>
                                        <button
                                            onClick={() => onRemoveAttachment(attachment.id)}
                                            className="ml-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-sm"
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
            <form onSubmit={onSubmit} className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedModel === 'gemini-3-pro-image-preview' ? 'image/*' : 'image/*,.pdf'}
                    multiple={selectedModel !== 'gemini-3-pro-image-preview'}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading || (selectedModel === 'gemini-3-pro-image-preview' && attachments.length > 0)}
                    className="px-3 py-3 h-auto aspect-square rounded-lg border border-border bg-muted/50 hover:bg-muted"
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
                </Button>
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
                        className="w-full px-4 py-3 pr-12 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/50 bg-background text-foreground resize-none max-h-32 min-h-[3rem]"
                        disabled={isLoading}
                        rows={1}
                    />
                    {isPromptMenuOpen && (
                        <div className="absolute bottom-14 left-0 w-72 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                            <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30">Insert a system prompt</div>
                            <div className="max-h-56 overflow-y-auto">
                                {filteredPrompts.map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        type="button"
                                        onClick={() => onSystemPromptSelect(prompt.id)}
                                        className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                                                /
                                            </span>
                                            <div>
                                                <div className="font-medium text-foreground">{prompt.title}</div>
                                                <div className="text-sm text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]">{prompt.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <Button
                    type="submit"
                    variant="novice"
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className="px-6 py-3 h-auto"
                >
                    Send
                </Button>
            </form>
            {selectedSystemPrompt && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground border border-border">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[10px] font-semibold text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}
