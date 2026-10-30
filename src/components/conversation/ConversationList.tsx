import React, { useState, useMemo } from 'react';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { ConversationItem } from './ConversationItem';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { Input } from '../ui/Input';
import type { ConversationListItem } from '../../types';

interface ConversationListProps {
  conversations: ConversationListItem[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  currentUserName: string;
  currentUserPhoto: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenProfile: () => void;
}

export function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  currentUserName,
  currentUserPhoto,
  onSelectConversation,
  onNewConversation,
  onOpenProfile,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.otherParticipant.displayName.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">CloudTalk</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewConversation}
            className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="New conversation"
            title="New conversation"
          >
            <Plus className="w-5 h-5 text-text-muted" />
          </button>
          <button
            onClick={onOpenProfile}
            className="p-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Open profile settings"
          >
            <Avatar name={currentUserName} photoURL={currentUserPhoto} size="sm" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-muted/50 border border-transparent rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-surface transition-all"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5" role="list" aria-label="Conversations">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner label="Loading conversations…" />
          </div>
        )}

        {error && !loading && (
          <div className="mx-2 mt-4 p-3 rounded-xl bg-error/10 text-error text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-text-muted">
              {searchQuery
                ? `No conversations match "${searchQuery}"`
                : 'Start a new conversation with the + button above'}
            </p>
          </div>
        )}

        {!loading && filtered.map((conv) => (
          <div key={conv.conversationId} role="listitem">
            <ConversationItem
              item={conv}
              isSelected={conv.conversationId === selectedId}
              onClick={() => onSelectConversation(conv.conversationId)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
