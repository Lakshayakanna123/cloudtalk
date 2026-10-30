import { useState, useEffect, useRef } from 'react';
import type { ConversationListItem } from '../types';
import { subscribeToConversationList } from '../services/conversations.service';

interface UseConversationsResult {
  conversations: ConversationListItem[];
  loading: boolean;
  error: string | null;
}

export function useConversations(uid: string | null): UseConversationsResult {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToConversationList(
      uid,
      (items) => {
        if (!mountedRef.current) return;
        setConversations(items);
        setLoading(false);
      },
      (err) => {
        if (!mountedRef.current) return;
        setError(err.message ?? 'Failed to load conversations.');
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [uid]);

  return { conversations, loading, error };
}
