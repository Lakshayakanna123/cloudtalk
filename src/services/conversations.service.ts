import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, UserConversation, ConversationListItem } from '../types';
import { getPublicProfile } from './users.service';

const CONVERSATIONS_COL = 'conversations';
const USERS_COL = 'users';

// ─── Deterministic conversation ID for two users ─────────────────────────────
// Sort the UIDs so the ID is the same regardless of who initiates the chat.

function buildConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

// ─── Get or create a direct conversation ─────────────────────────────────────

export async function getOrCreateConversation(
  currentUid: string,
  otherUid: string
): Promise<string> {
  const convId = buildConversationId(currentUid, otherUid);
  const convRef = doc(db, CONVERSATIONS_COL, convId);

  const snap = await getDoc(convRef);
  if (snap.exists()) return convId;

  // Fetch both profiles for participantMetadata
  const [currentProfile, otherProfile] = await Promise.all([
    getPublicProfile(currentUid),
    getPublicProfile(otherUid),
  ]);

  const participantMetadata: Record<string, { displayName: string; photoURL: string | null }> = {
    [currentUid]: {
      displayName: currentProfile?.displayName ?? 'Unknown',
      photoURL: currentProfile?.photoURL ?? null,
    },
    [otherUid]: {
      displayName: otherProfile?.displayName ?? 'Unknown',
      photoURL: otherProfile?.photoURL ?? null,
    },
  };

  // Use a transaction to prevent race conditions
  await runTransaction(db, async (tx) => {
    const existingSnap = await tx.get(convRef);
    if (existingSnap.exists()) return; // Already created by the other participant

    const now = serverTimestamp();
    tx.set(convRef, {
      type: 'direct',
      participantIds: [currentUid, otherUid],
      participantMetadata,
      lastMessageText: '',
      lastMessageAt: null,
      lastMessageSenderId: null,
      createdAt: now,
      updatedAt: now,
    });

    // Per-user entries
    const currentUserConvRef = doc(db, USERS_COL, currentUid, 'conversations', convId);
    const otherUserConvRef = doc(db, USERS_COL, otherUid, 'conversations', convId);

    const baseEntry = {
      conversationId: convId,
      lastMessageText: '',
      lastMessageAt: null,
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      lastReadAt: null,
    };

    tx.set(currentUserConvRef, { ...baseEntry, otherParticipantId: otherUid });
    tx.set(otherUserConvRef, { ...baseEntry, otherParticipantId: currentUid });
  });

  return convId;
}

// ─── Listen to the authenticated user's conversation list ────────────────────

export function subscribeToConversationList(
  uid: string,
  callback: (items: ConversationListItem[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, USERS_COL, uid, 'conversations'),
    where('isArchived', '==', false),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(
    q,
    async (snap) => {
      const userConvs = snap.docs.map((d) => d.data() as UserConversation);

      const items = await Promise.all(
        userConvs.map(async (uc): Promise<ConversationListItem | null> => {
          const profile = await getPublicProfile(uc.otherParticipantId);
          if (!profile) return null;
          return {
            conversationId: uc.conversationId,
            otherParticipant: profile,
            lastMessageText: uc.lastMessageText,
            lastMessageAt: uc.lastMessageAt,
            unreadCount: uc.unreadCount,
            isPinned: uc.isPinned,
            isArchived: uc.isArchived,
          };
        })
      );

      callback(items.filter(Boolean) as ConversationListItem[]);
    },
    (err) => onError(err as Error)
  );
}

// ─── Mark conversation as read ────────────────────────────────────────────────

export async function markConversationRead(
  uid: string,
  conversationId: string
): Promise<void> {
  const ref = doc(db, USERS_COL, uid, 'conversations', conversationId);
  await updateDoc(ref, {
    unreadCount: 0,
    lastReadAt: serverTimestamp(),
  });
}

// ─── Get a single conversation ────────────────────────────────────────────────

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, CONVERSATIONS_COL, conversationId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Conversation, 'id'>) };
}
