'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ChatConversation } from '@/types/chat';

interface SidebarProps {
    isOpen: boolean;
    conversations: ChatConversation[];
    currentConversationId: string | null;
    isLoading: boolean;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onRenameConversation: (id: string, newTitle: string) => void;
    onDeleteConversation: (id: string) => void;
}

export function Sidebar({
    isOpen,
    conversations,
    currentConversationId,
    isLoading,
    onNewChat,
    onSelectConversation,
    onRenameConversation,
    onDeleteConversation,
}: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const filteredConversations = conversations.filter((conv) =>
        conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (editInputRef.current && editingConversationId) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingConversationId]);

    const handleRenameSubmit = (id: string) => {
        if (editingTitle.trim()) {
            onRenameConversation(id, editingTitle);
        }
        setEditingConversationId(null);
    };

    return (
        <div
            className={cn(
                "transition-all duration-300 border-r border-border bg-muted/20 overflow-hidden flex flex-col",
                isOpen ? "w-64" : "w-0"
            )}
        >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-border">
                <Button
                    onClick={onNewChat}
                    variant="novice"
                    className="w-full justify-center"
                >
                    + New Chat
                </Button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/50 placeholder:text-muted-foreground"
                />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={cn(
                                    "group relative rounded-lg transition-colors border border-transparent",
                                    currentConversationId === conv.id
                                        ? "bg-muted border-border"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                {editingConversationId === conv.id ? (
                                    <div className="p-2">
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onBlur={() => handleRenameSubmit(conv.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleRenameSubmit(conv.id);
                                                } else if (e.key === 'Escape') {
                                                    setEditingConversationId(null);
                                                }
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-brand-green/50 rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-green"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => onSelectConversation(conv.id)}
                                            className="flex-1 text-left p-3 text-sm text-foreground truncate font-medium"
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
                                                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                                                title="Rename"
                                            >
                                                <svg
                                                    className="w-4 h-4"
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
                                                    onDeleteConversation(conv.id);
                                                }}
                                                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                                                title="Delete"
                                            >
                                                <svg
                                                    className="w-4 h-4"
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
    );
}
