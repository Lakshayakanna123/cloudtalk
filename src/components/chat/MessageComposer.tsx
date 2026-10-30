import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { clsx } from 'clsx';
import { MAX_MESSAGE_LENGTH } from '../../services/messages.service';

interface MessageComposerProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [text, sending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;
  const charCount = text.length;
  const nearLimit = charCount > MAX_MESSAGE_LENGTH * 0.8;

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <div className="flex items-end gap-3 bg-muted/40 rounded-2xl border border-border px-3 py-2 focus-within:border-primary-400 focus-within:bg-surface transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_MESSAGE_LENGTH) setText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled || sending}
          className="flex-1 bg-transparent resize-none text-sm text-text-primary placeholder-text-muted outline-none leading-relaxed max-h-40 py-0.5 disabled:opacity-50"
          aria-label="Message text"
          aria-multiline="true"
        />

        <div className="flex items-center gap-2 pb-0.5">
          {nearLimit && (
            <span
              className={clsx(
                'text-[10px] font-mono',
                charCount >= MAX_MESSAGE_LENGTH ? 'text-error' : 'text-text-muted'
              )}
              aria-live="polite"
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              'p-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              canSend
                ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-sm'
                : 'bg-muted text-text-muted cursor-not-allowed'
            )}
            aria-label="Send message"
            title="Send (Enter)"
          >
            <Send className={clsx('w-4 h-4', sending && 'animate-pulse')} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-text-muted mt-1.5 pl-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
