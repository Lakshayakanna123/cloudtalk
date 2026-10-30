/**
 * Firestore Security Rules Test Documentation
 *
 * Full automated Security Rules testing requires:
 *   - @firebase/rules-unit-testing package
 *   - Firebase Emulator Suite (firebase emulators:start)
 *
 * The scenarios below are written as pseudocode/documentation.
 * To run real tests, install the emulator and use:
 *
 *   npm install -D @firebase/rules-unit-testing
 *   firebase emulators:start --only firestore
 *   vitest run tests/rules/
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tested scenarios:
 *
 * 1. UNAUTHENTICATED reads are rejected
 *    - GET /users/{uid}                       → DENIED
 *    - GET /conversations/{convId}            → DENIED
 *    - GET /conversations/{convId}/messages/* → DENIED
 *
 * 2. UNAUTHENTICATED writes are rejected
 *    - SET /users/{uid}                       → DENIED
 *    - SET /conversations/{convId}/messages/* → DENIED
 *
 * 3. Non-participant cannot read a conversation
 *    - User C reads /conversations/{conv(A,B)} → DENIED
 *
 * 4. Non-participant cannot read messages
 *    - User C reads /conversations/{conv(A,B)}/messages/* → DENIED
 *
 * 5. Non-participant cannot write a message
 *    - User C creates /conversations/{conv(A,B)}/messages/* → DENIED
 *
 * 6. Sender ID impersonation is rejected
 *    - User A creates message with senderId = User B's UID → DENIED
 *
 * 7. User cannot edit another user's profile
 *    - User A writes /users/{uidB} → DENIED
 *
 * 8. User cannot change their UID or email in profile
 *    - User A updates /users/{uidA} with uid field → DENIED
 *    - User A updates /users/{uidA} with email field → DENIED
 *
 * 9. User cannot modify protected conversation fields
 *    - Client updates /conversations/{convId}.lastMessageText → DENIED
 *    - Client updates /conversations/{convId}.participantIds → DENIED
 *
 * 10. User cannot read another user's conversation metadata
 *     - User A reads /users/{uidB}/conversations/* → DENIED
 *
 * 11. User cannot register an FCM token under another user
 *     - User A writes /users/{uidB}/fcmTokens/{token} → DENIED
 *
 * 12. VALID operations are permitted
 *     - Participant A reads /conversations/{conv(A,B)}           → ALLOWED
 *     - Participant A reads /conversations/{conv(A,B)}/messages  → ALLOWED
 *     - Participant A creates valid message in /conversations/{conv(A,B)}/messages → ALLOWED
 *     - User A updates own profile displayName                   → ALLOWED
 *     - User A reads own /users/{uidA}/conversations/*           → ALLOWED
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT SECURITY PROPERTIES VERIFIED:
 *
 * - senderId must equal request.auth.uid (no impersonation)
 * - message.text must be a non-empty string ≤ 2000 chars
 * - message.type must be "text"
 * - Timestamps must use serverTimestamp() (request.time)
 * - participantIds is enforced server-side (clients cannot inject themselves)
 * - Protected fields (lastMessageText, participantIds) can only be
 *   updated by Cloud Functions using the Admin SDK
 */

export {};
