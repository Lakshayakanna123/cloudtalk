import React, { useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { searchUsers } from '../../services/users.service';
import { getOrCreateConversation } from '../../services/conversations.service';
import type { PublicUserProfile } from '../../types';

interface NewConversationModalProps {
  currentUid: string;
  onSelectConversation: (conversationId: string) => void;
  onClose: () => void;
}

export function NewConversationModal({
  currentUid,
  onSelectConversation,
  onClose,
}: NewConversationModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number>(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await searchUsers(query.trim(), currentUid);
        setResults(users);
      } catch (err: any) {
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, currentUid]);

  const handleStart = async (user: PublicUserProfile) => {
    if (starting) return;
    setStarting(user.uid);
    try {
      const convId = await getOrCreateConversation(currentUid, user.uid);
      onSelectConversation(convId);
      onClose();
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
    } finally {
      setStarting(null);
    }
  };

  // Trap focus and close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="New conversation"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-text-primary">New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-muted/50 border border-transparent rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-surface transition-all"
              aria-label="Search users by name"
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1.5 pl-1">
            Note: search matches display name prefix. For full-text search, an external service is required.
          </p>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner size="sm" label="Searching…" />
            </div>
          )}

          {error && (
            <p className="text-sm text-error text-center py-4 px-4">{error}</p>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <p className="text-sm font-medium text-text-primary mb-1">No users found</p>
              <p className="text-xs text-text-muted">
                No users match "{query}". Try a different search term.
              </p>
            </div>
          )}

          {!loading && results.map((user) => (
            <button
              key={user.uid}
              onClick={() => handleStart(user)}
              disabled={!!starting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 active:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset disabled:opacity-50"
              aria-label={`Start conversation with ${user.displayName}`}
            >
              <Avatar name={user.displayName} photoURL={user.photoURL} size="md" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
                {user.about && (
                  <p className="text-xs text-text-muted truncate">{user.about}</p>
                )}
              </div>
              {starting === user.uid && (
                <Spinner size="sm" label="Starting…" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
