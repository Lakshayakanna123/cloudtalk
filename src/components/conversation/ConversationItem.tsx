import React from 'react';
import { clsx } from 'clsx';
import { Avatar } from '../ui/Avatar';
import { formatConversationTime, truncate } from '../../utils';
import type { ConversationListItem } from '../../types';

interface ConversationItemProps {
  item: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ item, isSelected, onClick }: ConversationItemProps) {
  const { otherParticipant, lastMessageText, lastMessageAt, unreadCount, isPinned } = item;
  const isOnline = otherParticipant.presenceStatus === 'online';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-950/40'
          : 'hover:bg-muted/60 active:bg-muted'
      )}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`Conversation with ${otherParticipant.displayName}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Avatar
        name={otherParticipant.displayName}
        photoURL={otherParticipant.photoURL}
        size="md"
        online={isOnline}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              'text-sm truncate',
              unreadCount > 0
                ? 'font-semibold text-text-primary'
                : 'font-medium text-text-primary'
            )}
          >
            {otherParticipant.displayName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isPinned && (
              <span className="text-text-muted" aria-label="Pinned">📌</span>
            )}
            <span className="text-xs text-text-muted">
              {formatConversationTime(lastMessageAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={clsx(
              'text-xs truncate',
              unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-muted'
            )}
          >
            {lastMessageText ? truncate(lastMessageText, 50) : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span
              className="shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
