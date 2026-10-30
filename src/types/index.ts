import { Timestamp } from 'firebase/firestore';

// ─── User / Profile ──────────────────────────────────────────────────────────

export type PresenceStatus = 'online' | 'offline';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  about: string;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  presenceStatus: PresenceStatus;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  about: string;
  lastSeenAt: Timestamp;
  presenceStatus: PresenceStatus;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export type MessageType = 'text';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: MessageType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Client-only field – not persisted in Firestore
  status?: MessageStatus;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type ConversationType = 'direct';

export interface ParticipantMetadata {
  [uid: string]: {
    displayName: string;
    photoURL: string | null;
  };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participantIds: string[];
  participantMetadata: ParticipantMetadata;
  lastMessageText: string;
  lastMessageAt: Timestamp | null;
  lastMessageSenderId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Per-user conversation entry (users/{uid}/conversations/{convId}) ─────────

export interface UserConversation {
  conversationId: string;
  otherParticipantId: string;
  lastMessageText: string;
  lastMessageAt: Timestamp | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  lastReadAt: Timestamp | null;
}

// ─── Notification preferences ─────────────────────────────────────────────────

export interface NotificationPreferences {
  enabled: boolean;
  showMessagePreview: boolean;
}

// ─── FCM token entry (stored under users/{uid}/fcmTokens/{token}) ─────────────

export interface FCMTokenEntry {
  token: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  platform: 'web';
}

// ─── Auth form types ──────────────────────────────────────────────────────────

export interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ResetPasswordFormValues {
  email: string;
}

// ─── Derived UI types ─────────────────────────────────────────────────────────

/** A conversation enriched with the other participant's public profile */
export interface ConversationListItem {
  conversationId: string;
  otherParticipant: PublicUserProfile;
  lastMessageText: string;
  lastMessageAt: Timestamp | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
}
