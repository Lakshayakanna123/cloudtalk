import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Message } from '../types';

const CONVERSATIONS_COL = 'conversations';
const MESSAGES_SUBCOL = 'messages';
export const MAX_MESSAGE_LENGTH = 2000;
export const PAGE_SIZE = 30;

// ─── Subscribe to the latest messages in a conversation ──────────────────────

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS_COL, conversationId, MESSAGES_SUBCOL),
    orderBy('createdAt', 'asc'),
    limit(PAGE_SIZE)
  );

  return onSnapshot(
    q,
    (snap) => {
      const messages: Message[] = snap.docs.map((d) => ({
        id: d.id,
        conversationId,
        ...(d.data() as Omit<Message, 'id' | 'conversationId'>),
      }));
      callback(messages);
    },
    (err) => onError(err as Error)
  );
}

// ─── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message text cannot be empty.');
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const ref = await addDoc(
    collection(db, CONVERSATIONS_COL, conversationId, MESSAGES_SUBCOL),
    {
      senderId,
      text: trimmed,
      type: 'text',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return ref.id;
}
