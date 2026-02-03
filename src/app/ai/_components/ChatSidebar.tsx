import type React from 'react';
import Link from 'next/link';
import { ChatConversation } from '@/types/chat';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

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
  session: Session | null;
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
  session,
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
      className={`${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
        } transition-all duration-300 bg-white/[0.02] overflow-hidden flex flex-col`}
    >
      {session && (
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-surface-interactive border border-white/10 flex items-center justify-center text-foreground font-bold text-sm flex-shrink-0">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {session.user?.name || 'User'}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {session.user?.role || 'USER'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.isProxying && (
              <span className="flex-1 text-xs text-brand-green/80 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                Proxy
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="group w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50"
        >
          <div className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center group-hover:border-brand-green/50 group-hover:text-brand-green transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-transparent border-b border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground/50">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground/50">
            {searchQuery ? 'No results' : 'No history'}
          </div>
        ) : (
          <div className="px-2 py-1 space-y-0.5">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg transition-all duration-200 ${currentConversationId === conv.id
                  ? 'text-white bg-white/5'
                  : 'text-muted-foreground hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
              >
                {currentConversationId === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-brand-green rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                )}

                {editingConversationId === conv.id ? (
                  <div className="p-1 pl-4">
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
                      className="w-full bg-transparent text-sm text-white focus:outline-none border-b border-brand-green/50 pb-0.5"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center pl-3 pr-2">
                    <button
                      onClick={() => onSelect(conv.id)}
                      className={`flex-1 text-left py-2 px-2 text-sm truncate transition-all rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 ${currentConversationId === conv.id ? 'font-medium opacity-100' : 'font-normal opacity-70 group-hover:opacity-100'
                        }`}
                      title={conv.title || 'Untitled'}
                    >
                      {conv.title || 'Untitled'}
                    </button>

                    <div className={`flex items-center gap-1 opacity-0 transition-opacity ${currentConversationId === conv.id ? 'group-hover:opacity-100' : 'group-hover:opacity-100'
                      }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStart(conv.id, conv.title || '');
                        }}
                        className="p-1 text-muted-foreground hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 rounded"
                        title="Rename"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="p-1 hover:bg-surface-dense rounded text-muted-foreground hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      <div className="mt-auto p-3 border-t border-white/5">
        <div className="px-2 py-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Apps</div>
        <div className="space-y-0.5">
          <Link href="/videos" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm">Videos</span>
          </Link>
          <Link href="/thumbnails" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm">Thumbnails</span>
          </Link>
          <Link href="/gallery" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-sm">Gallery</span>
          </Link>
          <Link href="/clips" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-sm">Clips</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
