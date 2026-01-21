import type React from 'react';
import { ChatConversation } from '@/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  conversations: ChatConversation[];
  currentConversationId: string | null;
  editingConversationId: string | null;
  editingTitle: string;
  onEditTitleChange: (value: string) => void;
  onEditStart: (id: string, title: string) => void;
  onEditCancel: () => void;
  onRename: (conversationId: string, newTitle: string) => Promise<boolean>;
  onDelete: (conversationId: string) => void;
  onSelect: (conversationId: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ChatSidebar = ({
  isOpen,
  onNewChat,
  searchQuery,
  onSearchChange,
  isLoading,
  conversations,
  currentConversationId,
  editingConversationId,
  editingTitle,
  onEditTitleChange,
  onEditStart,
  onEditCancel,
  onRename,
  onDelete,
  onSelect,
  editInputRef,
}: ChatSidebarProps) => {
  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      onEditCancel();
      return;
    }
    const success = await onRename(conversationId, editingTitle);
    if (success) {
      onEditCancel();
    }
  };

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-0'
      } transition-all duration-300 border-r border-border-subtle bg-surface-workbench overflow-hidden flex flex-col`}
    >
      <div className="p-3 border-b border-border-subtle">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-brand-green text-black rounded-lg hover:bg-brand-green/90 transition-colors font-medium text-base"
        >
          + New Chat
        </button>
      </div>

      <div className="p-3 border-b border-border-subtle">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 text-base border border-border-subtle rounded-lg bg-surface-interactive text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-base text-muted-foreground">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-base text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg ${
                  currentConversationId === conv.id
                    ? 'bg-surface-interactive'
                    : 'hover:bg-surface-interactive/70'
                }`}
              >
                {editingConversationId === conv.id ? (
                  <div className="p-2">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => onEditTitleChange(e.target.value)}
                      onBlur={() => {
                        handleRename(conv.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(conv.id);
                        } else if (e.key === 'Escape') {
                          onEditCancel();
                        }
                      }}
                      className="w-full px-2 py-1 text-base border border-border-subtle rounded bg-surface-interactive text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                    />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => onSelect(conv.id)}
                      className="flex-1 text-left p-3 text-base text-foreground truncate"
                    >
                      {conv.title || 'Untitled conversation'}
                    </button>
                    <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStart(conv.id, conv.title || '');
                        }}
                        className="p-1 hover:bg-surface-dense rounded"
                        title="Rename"
                      >
                        <svg
                          className="w-4 h-4 text-muted-foreground"
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
                          onDelete(conv.id);
                        }}
                        className="p-1 hover:bg-surface-dense rounded"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4 text-muted-foreground"
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
};
