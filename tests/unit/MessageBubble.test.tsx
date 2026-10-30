import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { Timestamp } from 'firebase/firestore';
import type { Message } from '../../src/types';

function makeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as Timestamp;
}

const baseMessage: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  text: 'Hello, World!',
  type: 'text',
  createdAt: makeTimestamp(new Date(2024, 0, 1, 10, 30)),
  updatedAt: makeTimestamp(new Date(2024, 0, 1, 10, 30)),
  status: 'sent',
};

describe('MessageBubble', () => {
  it('renders the message text', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} senderName="Alice" />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('renders sender name for received messages', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} senderName="Alice" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('does not render sender name for own messages', () => {
    render(<MessageBubble message={baseMessage} isOwn={true} senderName="Alice" />);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} senderName="Alice" />);
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });

  it('renders message text safely (no HTML injection)', () => {
    const xssMessage: Message = {
      ...baseMessage,
      text: '<script>alert("xss")</script>',
    };
    render(<MessageBubble message={xssMessage} isOwn={false} senderName="Alice" />);
    // The text should appear as-is (escaped), not as HTML
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    // No actual script tag should be in the DOM
    expect(document.querySelector('script')).toBeNull();
  });

  it('shows retry button for failed own messages', () => {
    const failedMessage: Message = { ...baseMessage, status: 'failed' };
    const onRetry = vi.fn();
    render(
      <MessageBubble
        message={failedMessage}
        isOwn={true}
        senderName="You"
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const failedMessage: Message = { ...baseMessage, status: 'failed' };
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <MessageBubble
        message={failedMessage}
        isOwn={true}
        senderName="You"
        onRetry={onRetry}
      />
    );
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledWith(failedMessage);
  });

  it('does not show retry button for received failed messages', () => {
    const failedMessage: Message = { ...baseMessage, status: 'failed' };
    render(<MessageBubble message={failedMessage} isOwn={false} senderName="Alice" />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
