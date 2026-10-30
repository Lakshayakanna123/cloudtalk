import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { useMessages } from '../../hooks/useMessages';
import { sendMessage } from '../../services/messages.service';
import { markConversationRead } from '../../services/conversations.service';
import type { ConversationListItem, Message } from '../../types';
import { formatRelativeTime } from '../../utils';
import { clsx } from 'clsx';

// Lightweight Timestamp-compatible shape for optimistic messages
function makeOptimisticTimestamp(): Timestamp {
  const now = Date.now();
  return {
    seconds: Math.floor(now / 1000),
    nanoseconds: 0,
    toDate: () => new Date(now),
    toMillis: () => now,
    isEqual: () => false,
    valueOf: () => `${Math.floor(now / 1000)}.000000000`,
  } as unknown as Timestamp;
}

interface ChatWindowProps {
  conversation: ConversationListItem;
  currentUid: string;
  onBack?: () => void;
}

export function ChatWindow({ conversation, currentUid, onBack }: ChatWindowProps) {
  const { conversationId, otherParticipant } = conversation;
  const { messages, loading, error } = useMessages(conversationId);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  // Merge real messages with optimistic local messages
  const allMessages: Message[] = React.useMemo(() => {
    const ids = new Set(messages.map((m) => m.id));
    const pending = localMessages.filter((m) => !ids.has(m.id));
    return [...messages, ...pending].sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() ?? 0;
      const bMs = b.createdAt?.toMillis?.() ?? 0;
      return aMs - bMs;
    });
  }, [messages, localMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (currentUid && conversationId) {
      markConversationRead(currentUid, conversationId).catch(() => {});
    }
  }, [currentUid, conversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      const tempId = `local-${Date.now()}`;
      const ts = makeOptimisticTimestamp();
      const optimisticMsg: Message = {
        id: tempId,
        conversationId,
        senderId: currentUid,
        text,
        type: 'text',
        createdAt: ts,
        updatedAt: ts,
        status: 'sending',
      };

      setLocalMessages((prev) => [...prev, optimisticMsg]);

      try {
        await sendMessage(conversationId, currentUid, text);
        // Remove optimistic message once real one arrives via listener
        setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      } catch (err) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [conversationId, currentUid]
  );

  const handleRetry = useCallback(
    async (failedMsg: Message) => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'sending' } : m))
      );
      try {
        await sendMessage(conversationId, currentUid, failedMsg.text);
        setLocalMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
      } catch {
        setLocalMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, status: 'failed' } : m))
        );
      }
    },
    [conversationId, currentUid]
  );

  const isOnline = otherParticipant.presenceStatus === 'online';

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
        )}

        <Avatar
          name={otherParticipant.displayName}
          photoURL={otherParticipant.photoURL}
          size="md"
          online={isOnline}
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">
            {otherParticipant.displayName}
          </h2>
          <p className="text-xs text-text-muted">
            {isOnline ? 'Online' : `Last seen ${formatRelativeTime(otherParticipant.lastSeenAt)}`}
          </p>
        </div>
      </header>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner label="Loading messages…" />
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-sm p-3 rounded-xl bg-error/10 text-error text-sm text-center">
            {error}
          </div>
        )}

        {!loading && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Start the conversation</p>
            <p className="text-xs text-text-muted">
              Say hello to {otherParticipant.displayName}!
            </p>
          </div>
        )}

        {allMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUid}
            senderName={otherParticipant.displayName}
            onRetry={handleRetry}
          />
        ))}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Composer */}
      <MessageComposer onSend={handleSend} disabled={!!error} />
    </div>
  );
}
