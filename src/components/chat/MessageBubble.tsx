import React from 'react';
import { clsx } from 'clsx';
import { Check, X, RotateCcw } from 'lucide-react';
import { formatMessageTime } from '../../utils';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  onRetry?: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, senderName, onRetry }: MessageBubbleProps) {
  const time = formatMessageTime(message.createdAt);
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <div
      className={clsx(
        'flex items-end gap-2 group',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`Message from ${isOwn ? 'you' : senderName ?? 'other'}: ${message.text}`}
    >
      {/* Bubble */}
      <div
        className={clsx(
          'max-w-[75%] sm:max-w-[60%] relative',
          isOwn ? 'items-end' : 'items-start',
          'flex flex-col gap-1'
        )}
      >
        {!isOwn && senderName && (
          <span className="text-xs font-medium text-primary-600 px-1">{senderName}</span>
        )}
        <div
          className={clsx(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap',
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-surface border border-border text-text-primary rounded-bl-sm shadow-sm',
            isFailed && 'opacity-70',
            isSending && 'opacity-60'
          )}
        >
          {/* Render as text — never dangerouslySetInnerHTML */}
          {message.text}
        </div>

        <div
          className={clsx(
            'flex items-center gap-1 px-1',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-[10px] text-text-muted">{time}</span>
          {isOwn && (
            <span className="text-[10px]" aria-label={isFailed ? 'Failed' : isSending ? 'Sending' : 'Sent'}>
              {isFailed ? (
                <X className="w-3 h-3 text-error" aria-hidden="true" />
              ) : isSending ? (
                <span className="w-3 h-3 inline-block border-t border-primary-400 rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <Check className="w-3 h-3 text-primary-400" aria-hidden="true" />
              )}
            </span>
          )}
          {isFailed && isOwn && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="ml-1 p-1 rounded hover:bg-muted transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-error"
              aria-label="Retry sending message"
              title="Retry"
            >
              <RotateCcw className="w-3 h-3 text-error" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
