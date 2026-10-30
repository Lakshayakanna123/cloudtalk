import { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { subscribeToMessages } from '../services/messages.service';

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export function useMessages(conversationId: string | null): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track active conversation to clean up listeners correctly
  const activeConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    activeConvIdRef.current = conversationId;

    const unsubscribe = subscribeToMessages(
      conversationId,
      (msgs) => {
        // Ignore stale events from a previous conversation
        if (activeConvIdRef.current !== conversationId) return;
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        if (activeConvIdRef.current !== conversationId) return;
        setError(err.message ?? 'Failed to load messages.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      activeConvIdRef.current = null;
    };
  }, [conversationId]);

  return { messages, loading, error };
}
