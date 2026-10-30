/**
 * CloudTalk Cloud Functions — index.ts
 *
 * Functions:
 * 1. onMessageCreated — updates conversation metadata and unread counts
 *    when a new message is written to the messages subcollection.
 *    This runs in a trusted server context, bypassing client Security Rules,
 *    which is why it is safe for it to write lastMessageText and update
 *    the other participant's unreadCount.
 *
 * 2. sendPushNotification — sends an FCM notification to the recipient.
 *    Notification delivery is done from the server, not the client,
 *    so we never expose FCM server keys to the browser.
 *
 * Security notes:
 *   - NEVER place the Firebase Admin SDK or service-account.json in client code.
 *   - NEVER commit service-account.json to the repository.
 *   - The Admin SDK is only used in Cloud Functions (trusted server environment).
 *   - These functions use idempotent writes where possible.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const fcm = admin.messaging();

// ─── onMessageCreated ─────────────────────────────────────────────────────────

export const onMessageCreated = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .firestore.document('conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const { convId } = context.params;
    const message = snap.data() as {
      senderId: string;
      text: string;
      createdAt: admin.firestore.Timestamp;
    };

    const preview = message.text.length > 100
      ? message.text.slice(0, 97) + '…'
      : message.text;

    const convRef = db.collection('conversations').doc(convId);

    // Fetch conversation to get participantIds
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      console.error(`Conversation ${convId} not found.`);
      return;
    }

    const convData = convSnap.data() as {
      participantIds: string[];
    };

    const { participantIds } = convData;
    const batch = db.batch();

    // Update top-level conversation document
    batch.update(convRef, {
      lastMessageText: preview,
      lastMessageAt: message.createdAt,
      lastMessageSenderId: message.senderId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update per-user conversation entries
    for (const uid of participantIds) {
      const userConvRef = db
        .collection('users')
        .doc(uid)
        .collection('conversations')
        .doc(convId);

      const updates: Record<string, unknown> = {
        lastMessageText: preview,
        lastMessageAt: message.createdAt,
      };

      // Only increment unread count for the recipient (not the sender)
      if (uid !== message.senderId) {
        updates.unreadCount = admin.firestore.FieldValue.increment(1);
      }

      batch.update(userConvRef, updates);
    }

    await batch.commit();

    // ── Trigger push notification for the recipient ────────────────────────────
    const recipientUid = participantIds.find((uid) => uid !== message.senderId);
    if (recipientUid) {
      await sendNotificationToUser(recipientUid, message.senderId, convId, preview);
    }
  });

// ─── sendNotificationToUser ───────────────────────────────────────────────────

async function sendNotificationToUser(
  recipientUid: string,
  senderUid: string,
  conversationId: string,
  messagePreview: string
): Promise<void> {
  // Fetch sender's profile for display name
  const senderSnap = await db.collection('users').doc(senderUid).get();
  const senderName = (senderSnap.data() as { displayName?: string })?.displayName ?? 'Someone';

  // Get all FCM tokens for the recipient
  const tokensSnap = await db
    .collection('users')
    .doc(recipientUid)
    .collection('fcmTokens')
    .get();

  if (tokensSnap.empty) return;

  const tokens = tokensSnap.docs.map((d) => (d.data() as { token: string }).token);

  // Check recipient's notification preferences (default: enabled with preview)
  const recipientSnap = await db.collection('users').doc(recipientUid).get();
  const prefs = (recipientSnap.data() as { notificationPreferences?: { enabled: boolean; showMessagePreview: boolean } })
    ?.notificationPreferences;

  if (prefs?.enabled === false) return;

  const showPreview = prefs?.showMessagePreview !== false;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: `${senderName} sent you a message`,
      body: showPreview ? messagePreview : 'You have a new message',
    },
    data: {
      conversationId,
      senderId: senderUid,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    webpush: {
      notification: {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      },
      fcmOptions: {
        link: `/chat`,
      },
    },
  };

  const response = await fcm.sendEachForMulticast(message);

  // Remove stale/invalid tokens
  const invalidTokens: string[] = [];
  response.responses.forEach((res, idx) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    const deleteBatch = db.batch();
    for (const token of invalidTokens) {
      const ref = db
        .collection('users')
        .doc(recipientUid)
        .collection('fcmTokens')
        .doc(token);
      deleteBatch.delete(ref);
    }
    await deleteBatch.commit();
    console.info(`Removed ${invalidTokens.length} stale FCM tokens for user ${recipientUid}.`);
  }
}
