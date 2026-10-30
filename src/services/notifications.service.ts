import {
  getToken,
  onMessage,
} from 'firebase/messaging';
import type { Messaging, MessagePayload } from 'firebase/messaging';
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, messagingPromise } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

// ─── Register FCM token for the current user ─────────────────────────────────

export async function registerFCMToken(uid: string): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn('[CloudTalk] VAPID key not configured — push notifications disabled.');
    return null;
  }

  const messaging: Messaging | null = await messagingPromise;
  if (!messaging) {
    console.warn('[CloudTalk] Firebase Messaging not supported in this browser.');
    return null;
  }

  try {
    const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) return null;

    // Persist token under the authenticated user — enforced by Security Rules
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      platform: 'web',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return token;
  } catch (err) {
    console.warn('[CloudTalk] Failed to obtain FCM token:', err);
    return null;
  }
}

// ─── Remove a specific FCM token ─────────────────────────────────────────────

export async function removeFCMToken(uid: string, token: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'fcmTokens', token));
}

// ─── Listen for foreground messages ──────────────────────────────────────────

export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging: Messaging | null = await messagingPromise;
  if (!messaging) return null;
  return onMessage(messaging, callback);
}
