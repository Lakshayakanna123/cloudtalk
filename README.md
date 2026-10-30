# CloudTalk — Real-time Cloud Messaging

[![Firebase](https://img.shields.io/badge/Firebase-11.x-orange?logo=firebase)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-blue?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-teal?logo=tailwindcss)](https://tailwindcss.com)

A production-minded, real-time cloud messaging application built with React, TypeScript, Firebase Firestore, and Firebase Cloud Messaging.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Prerequisites](#6-prerequisites)
7. [Installation](#7-installation)
8. [Firebase Setup](#8-firebase-setup)
   - [8.1 Create Firebase Project](#81-create-firebase-project)
   - [8.2 Authentication](#82-authentication)
   - [8.3 Firestore Database](#83-firestore-database)
   - [8.4 Firebase Cloud Messaging](#84-firebase-cloud-messaging)
   - [8.5 VAPID Key](#85-vapid-key)
   - [8.6 Service Worker](#86-service-worker)
   - [8.7 Cloud Functions](#87-cloud-functions)
9. [Firestore Security Rules](#9-firestore-security-rules)
10. [Firestore Indexes](#10-firestore-indexes)
11. [Local Development](#11-local-development)
12. [Firebase Emulator Suite](#12-firebase-emulator-suite)
13. [Testing](#13-testing)
14. [Production Build](#14-production-build)
15. [Firebase Hosting Deployment](#15-firebase-hosting-deployment)
16. [Environment Variables](#16-environment-variables)
17. [Firestore Data Model](#17-firestore-data-model)
18. [Security Considerations](#18-security-considerations)
19. [Performance Notes](#19-performance-notes)
20. [Known Limitations](#20-known-limitations)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. Project Overview

CloudTalk is a secure, real-time cloud messaging application. Authenticated users can register, log in, find other users, start one-to-one conversations, exchange messages in real time, and optionally receive push notifications.

This project was built as the fourth project in the Glowlogics Cloud Projects curriculum: *Cloud Chat Application using React, Firebase Firestore, and Firebase Cloud Messaging.*

---

## 2. Features

| Feature | Status |
|---|---|
| Email/password registration and login | ✅ Implemented |
| Google Sign-In | ✅ Implemented |
| Password reset via email | ✅ Implemented |
| Protected routes with auth state persistence | ✅ Implemented |
| User profile (display name, about) | ✅ Implemented |
| User search by display name prefix | ✅ Implemented |
| One-to-one real-time messaging | ✅ Implemented |
| Optimistic message sending with retry | ✅ Implemented |
| Message history persistence | ✅ Implemented |
| Conversation list with unread badges | ✅ Implemented |
| Read receipts / unread count reset | ✅ Implemented |
| Conversation preview updates (Cloud Function) | ✅ Implemented |
| Push notifications (FCM) | ✅ Implemented (requires config) |
| Notification token management | ✅ Implemented |
| Responsive desktop + mobile layout | ✅ Implemented |
| Light theme with dark-mode CSS tokens | ✅ CSS vars prepared |
| Firestore Security Rules | ✅ Implemented |
| Cloud Functions for trusted writes | ✅ Implemented |
| Error/empty/loading states | ✅ Implemented |
| Accessible (ARIA, keyboard navigation) | ✅ Implemented |
| Group chat | 🔜 Future feature |
| File attachments | 🔜 Future feature |
| Full-text message search | 🔜 Requires external service |

---

## 3. Technology Stack

### Frontend
- **React 19** with **TypeScript 7**
- **Vite 8** (dev server + build)
- **React Router 7** (client-side routing)
- **Tailwind CSS 4** (styling)
- **Lucide React** (icons)
- **Zustand** (client UI state)
- **date-fns** (date formatting)
- **react-hot-toast** (notifications)

### Firebase / Backend
- **Firebase Authentication** (email/password + Google)
- **Cloud Firestore** (real-time database)
- **Firebase Cloud Messaging** (push notifications)
- **Firebase Cloud Functions** (trusted server operations)
- **Firebase Hosting** (deployment)

### Testing
- **Vitest** (unit test runner)
- **React Testing Library** (component tests)
- **jsdom** (browser environment simulation)

---

## 4. Architecture

```
Browser (React SPA)
    │
    ├── Firebase Auth ──────── Authentication state
    ├── Cloud Firestore ─────── Real-time message listeners
    └── FCM (Web Push) ──────── Push notification registration
              │
              └── Service Worker (/firebase-messaging-sw.js)
                        │
                        └── Background message handling

Cloud Functions (Node.js 20, trusted server)
    │
    ├── onMessageCreated ──── Updates conversation previews
    │                        Increments unread counts
    └── sendNotificationToUser ─ Sends FCM push notifications
                                 Removes stale tokens
```

### Key Design Decisions

1. **Deterministic conversation IDs**: `[uid1, uid2].sort().join('_')` prevents duplicate direct conversations.
2. **Optimistic messages**: Messages appear immediately in the UI with a "sending" state before Firestore confirms.
3. **Cloud Functions for trusted writes**: Conversation `lastMessageText` and `unreadCount` are updated by Cloud Functions (Admin SDK), not by clients. This prevents clients from spoofing these values.
4. **Per-user conversation subcollection**: `users/{uid}/conversations/{convId}` allows efficient, security-rule-enforced per-user queries without exposing other users' data.
5. **Prefix search only**: Firestore does not support full-text search natively. User search uses a range query (`>=` / `<= term\uf8ff`). For production full-text search, integrate Algolia or Typesense.

---

## 5. Project Structure

```
cloudtalk/
├── public/
│   ├── favicon.svg
│   └── firebase-messaging-sw.js     ← FCM service worker
├── src/
│   ├── app/
│   │   ├── App.tsx                  ← Root component
│   │   ├── router.tsx               ← React Router config
│   │   ├── store.ts                 ← Zustand UI state
│   │   └── providers/
│   │       ├── AuthContext.tsx
│   │       └── AuthProvider.tsx
│   ├── components/
│   │   ├── ui/                      ← Reusable atoms
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   └── RouteGuards.tsx      ← Protected/guest route guards
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx       ← Main message view
│   │   │   ├── MessageBubble.tsx    ← Individual message
│   │   │   └── MessageComposer.tsx  ← Text input + send
│   │   ├── conversation/
│   │   │   ├── ConversationList.tsx ← Sidebar list
│   │   │   ├── ConversationItem.tsx ← Single conversation row
│   │   │   └── NewConversationModal.tsx ← User search modal
│   │   └── profile/                 ← (reserved for future)
│   ├── hooks/
│   │   ├── useAuth.ts               ← Firebase auth state
│   │   ├── useMessages.ts           ← Real-time message subscription
│   │   └── useConversations.ts      ← Real-time conversation list
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── firebase.ts              ← SDK init + config validation
│   │   ├── auth.service.ts          ← Auth operations
│   │   ├── users.service.ts         ← Profile CRUD + search
│   │   ├── conversations.service.ts ← Conversation management
│   │   ├── messages.service.ts      ← Message CRUD + subscription
│   │   └── notifications.service.ts ← FCM token management
│   ├── types/
│   │   └── index.ts                 ← All TypeScript types
│   ├── utils/
│   │   └── index.ts                 ← Formatting, validation
│   ├── styles/
│   │   └── index.css                ← Tailwind + design tokens
│   └── main.tsx
├── functions/
│   ├── src/
│   │   └── index.ts                 ← onMessageCreated + FCM sender
│   ├── package.json
│   └── tsconfig.json
├── tests/
│   ├── setup.ts                     ← Vitest global setup
│   ├── unit/
│   │   ├── utils.test.ts
│   │   ├── LoginPage.test.tsx
│   │   ├── RegisterPage.test.tsx
│   │   └── MessageBubble.test.tsx
│   └── rules/
│       └── security-rules.test.ts   ← Rules test documentation
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## 6. Prerequisites

- **Node.js** ≥ 18 (Node 20 recommended for Cloud Functions)
- **npm** ≥ 9
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git**
- A **Firebase project** (free Spark plan is sufficient for development; Blaze plan required for Cloud Functions)

---

## 7. Installation

```bash
# Clone the repository
git clone https://github.com/Lakshayakanna123/cloudtalk.git
cd cloudtalk

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Copy environment file
cp .env.example .env.local
```

Then fill in your Firebase project values in `.env.local` (see [Section 16](#16-environment-variables)).

---

## 8. Firebase Setup

### 8.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** → enter project name (e.g., `cloudtalk-prod`).
3. Enable or disable Google Analytics (optional).
4. Click **Create project**.
5. In Project Settings → **Your apps** → click the web icon (`</>`).
6. Register the app (name it `CloudTalk Web`).
7. Copy the `firebaseConfig` values into `.env.local`.

### 8.2 Authentication

1. Firebase Console → **Authentication** → **Get started**.
2. Enable **Email/Password** provider.
3. (Optional) Enable **Google** provider — requires an authorized domain.

### 8.3 Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**.
2. Choose **Start in production mode** (Security Rules will be deployed separately).
3. Select a region close to your users.
4. Deploy Security Rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 8.4 Firebase Cloud Messaging

1. Firebase Console → **Project Settings** → **Cloud Messaging** tab.
2. FCM is automatically enabled for web projects.
3. Note your **Sender ID** — it should already be in your `firebaseConfig`.

### 8.5 VAPID Key

FCM Web Push requires a VAPID key pair for browser push subscriptions.

1. Firebase Console → **Project Settings** → **Cloud Messaging**.
2. Scroll to **Web configuration** → **Web Push certificates**.
3. Click **Generate key pair**.
4. Copy the key into `.env.local` as `VITE_FIREBASE_VAPID_KEY=<your-key>`.

### 8.6 Service Worker

The file `public/firebase-messaging-sw.js` handles background push messages.

**Important**: The service worker uses `importScripts` with the Firebase compat SDK. You must populate it with your Firebase config values. The current file uses `self.__FIREBASE_CONFIG_*__` placeholders.

**Recommended approach for production**: Generate `firebase-messaging-sw.js` at build time by injecting environment variables. A Vite plugin or a build script can do this.

**Quick manual approach for development**: Edit `public/firebase-messaging-sw.js` and replace the `self.__FIREBASE_CONFIG_*__ || ''` values with your actual Firebase config literals (safe to include — these are public client-side values).

### 8.7 Cloud Functions

Cloud Functions require a **Blaze (pay-as-you-go)** Firebase project.

```bash
# Login to Firebase
firebase login

# Initialize Functions (if not already configured)
firebase init functions

# Build Functions
cd functions && npm run build && cd ..

# Deploy Functions
firebase deploy --only functions
```

The deployed functions are:
- `onMessageCreated` — triggered when a new message is written; updates conversation previews and unread counts.

---

## 9. Firestore Security Rules

Rules are in `firestore.rules`. Key properties enforced:

| Rule | Description |
|---|---|
| Authentication required | All reads/writes require `request.auth != null` |
| Participant-only access | Conversations and messages are only readable by participants |
| Sender validation | `senderId` must equal `request.auth.uid` |
| Field validation | Messages must have non-empty text ≤ 2000 chars, type `"text"` |
| Profile protection | Users can only update permitted fields on their own profile |
| Metadata protection | Conversation `lastMessageText`, `participantIds` can only be written by Cloud Functions |
| Token ownership | FCM tokens can only be read/written by the owning user |

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 10. Firestore Indexes

Indexes are defined in `firestore.indexes.json`.

| Collection | Fields | Purpose |
|---|---|---|
| `users/{uid}/conversations` (collection group) | `isArchived ASC`, `lastMessageAt DESC` | Conversation list query |
| `users/{uid}/conversations` | `isArchived ASC`, `lastMessageAt DESC` | Conversation list query (collection-scoped) |
| `conversations/{convId}/messages` | `createdAt ASC` | Message ordering |
| `users` | `displayName ASC` | User search |

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 11. Local Development

```bash
# Start the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

To use the Firebase Emulator Suite (no real Firebase needed):

```bash
# Copy .env.example and set VITE_USE_EMULATORS=true
VITE_USE_EMULATORS=true

# Start emulators
firebase emulators:start

# In another terminal, start the dev server
npm run dev
```

---

## 12. Firebase Emulator Suite

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start all emulators (auth, firestore, functions, hosting, UI)
firebase emulators:start

# Emulator UI is at http://localhost:4000
```

Emulator ports (as configured in `firebase.json`):

| Service | Port |
|---|---|
| Emulator UI | 4000 |
| Authentication | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Hosting | 5000 |

---

## 13. Testing

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint
```

### Test Coverage

| Test file | Coverage |
|---|---|
| `tests/unit/utils.test.ts` | Formatting, validation utilities |
| `tests/unit/LoginPage.test.tsx` | Form validation, auth calls, error states |
| `tests/unit/RegisterPage.test.tsx` | Registration validation, password confirmation |
| `tests/unit/MessageBubble.test.tsx` | Message rendering, XSS safety, retry |
| `tests/rules/security-rules.test.ts` | Documented Security Rules scenarios |

Security Rules tests using the Firebase Emulator require `@firebase/rules-unit-testing`:
```bash
npm install -D @firebase/rules-unit-testing
firebase emulators:start --only firestore
```

---

## 14. Production Build

```bash
# Type check + build
npm run build

# Preview the build locally
npm run preview
```

Output is in the `dist/` directory.

---

## 15. Firebase Hosting Deployment

```bash
# Full deployment (hosting + rules + indexes + functions)
firebase deploy

# Deploy only the frontend
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore configuration
firebase deploy --only firestore
```

Make sure your `.env.local` values are baked into the build:
```bash
npm run build
firebase deploy --only hosting
```

**Note**: Vite replaces `import.meta.env.VITE_*` at build time. The values in your `.env.local` will be embedded in the JavaScript bundle. This is expected for Firebase client config — these values are not secret.

---

## 16. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
VITE_FIREBASE_VAPID_KEY=BNT...

# Set to "true" to use Firebase Emulator Suite
VITE_USE_EMULATORS=false
```

> ⚠️ **Security Warning**: All `VITE_` variables are embedded in the browser bundle. They are suitable for Firebase client SDK config but **must never** contain Firebase Admin SDK credentials or service-account JSON keys.

---

## 17. Firestore Data Model

```
users/{uid}
  uid            : string
  displayName    : string
  email          : string
  photoURL       : string | null
  about          : string
  presenceStatus : "online" | "offline"
  createdAt      : Timestamp (server)
  lastSeenAt     : Timestamp (server)

users/{uid}/conversations/{conversationId}
  conversationId    : string
  otherParticipantId: string
  lastMessageText   : string
  lastMessageAt     : Timestamp | null
  unreadCount       : number
  isPinned          : boolean
  isArchived        : boolean
  lastReadAt        : Timestamp | null

users/{uid}/fcmTokens/{token}
  token     : string
  platform  : "web"
  createdAt : Timestamp
  updatedAt : Timestamp

conversations/{conversationId}
  type                : "direct"
  participantIds      : string[]
  participantMetadata : { [uid]: { displayName, photoURL } }
  lastMessageText     : string      ← Written by Cloud Function only
  lastMessageAt       : Timestamp | null
  lastMessageSenderId : string | null
  createdAt           : Timestamp
  updatedAt           : Timestamp

conversations/{conversationId}/messages/{messageId}
  senderId  : string
  text      : string (max 2000 chars)
  type      : "text"
  createdAt : Timestamp (server)
  updatedAt : Timestamp (server)
```

### Unread Count Strategy

- When a message is created, the Cloud Function increments `unreadCount` for the **recipient only** (not the sender).
- When a user opens a conversation, the client calls `markConversationRead()` which sets `unreadCount = 0` and updates `lastReadAt`.
- This approach is idempotent — calling it multiple times does not cause incorrect counts.

---

## 18. Security Considerations

1. **Admin SDK only in Cloud Functions** — Firebase Admin credentials are never in frontend code.
2. **No service-account keys committed** — `.gitignore` blocks `serviceAccountKey.json` and similar files.
3. **Firestore Security Rules** — enforces authentication, participant access, sender validation, and field whitelisting.
4. **No HTML injection** — message text is rendered as plain text via React's default JSX escaping (no `dangerouslySetInnerHTML`).
5. **Trusted writes for conversation metadata** — Cloud Functions update `lastMessageText` and `unreadCount`; client rules block direct modification.
6. **FCM token ownership** — Security Rules enforce that only the owner can write their FCM tokens.
7. **Notification delivery via server** — Push notifications are sent from Cloud Functions, not from the browser.
8. **Password management** — Passwords are managed entirely by Firebase Authentication; they are never stored in Firestore.
9. **Environment variable safety** — Firebase client config values (`VITE_*`) are intentionally public. Admin credentials must never appear in `VITE_` variables.

---

## 19. Performance Notes

- **Paginated messages**: The message listener queries the latest 30 messages. Infinite scroll for history is a future improvement.
- **Limited Firestore reads**: User search uses `limit(20)`. Conversation list uses the per-user subcollection, not a full scan.
- **Unsubscribe on unmount**: All Firestore listeners are cleaned up via `useEffect` return functions.
- **Code splitting**: React Router routes are lazy-loaded. Firebase SDK is chunked separately.
- **Firestore offline support**: Firebase SDK has built-in IndexedDB caching for offline reads. Pending writes are queued automatically.

### Estimated Firebase Free-Tier Usage

| Operation | Spark Tier Limit | Notes |
|---|---|---|
| Firestore reads | 50,000/day | Each conversation list load reads per-user conv docs |
| Firestore writes | 20,000/day | Each message = 1 write + Cloud Function updates |
| Cloud Functions invocations | 2,000,000/month | Triggers on every message |
| Firebase Hosting bandwidth | 10 GB/month | Static assets + SPA |

> ⚠️ Cloud Functions are **not available** on the Spark free plan. The Blaze (pay-as-you-go) plan is required. Costs are typically very low for development usage.

---

## 20. Known Limitations

1. **User search is prefix-only** — Firestore range queries match display name prefixes. Full-text search (mid-word, typo-tolerant) requires an external service like Algolia or Typesense.
2. **No reliable online presence** — The current implementation uses `lastSeenAt` timestamps. True real-time online/offline status requires Firebase Realtime Database connection state + Cloud Functions sync.
3. **Message pagination** — Only the latest 30 messages are loaded. Older message loading (infinite scroll) is not yet implemented.
4. **Group chat** — Not yet implemented. Data model and Security Rules support only direct conversations.
5. **File attachments** — Not yet implemented. Requires Firebase Storage setup.
6. **Service worker config injection** — The FCM service worker contains placeholder variables. A build step to inject real config values is not yet automated.
7. **Cloud Functions require Blaze plan** — The free Spark plan does not allow Cloud Functions. Without them, conversation previews and unread counts will not update automatically.
8. **Profile photo upload** — Display photo can only be set via Google Sign-In. A direct photo upload feature requires Firebase Storage.

---

## 21. Troubleshooting

### "Missing Firebase configuration" error
Ensure `.env.local` exists in the project root and all `VITE_FIREBASE_*` values are populated.

### Authentication errors (auth/... codes)
Check that the authentication provider is enabled in Firebase Console → Authentication → Sign-in method.

### Firestore permission-denied errors
- Ensure Security Rules have been deployed: `firebase deploy --only firestore:rules`
- Ensure the user is signed in before attempting reads/writes
- Check the Firebase Console → Firestore → Rules → Rules Playground for debugging

### Messages not appearing in real time
- Check browser console for Firestore listener errors
- Ensure composite indexes are deployed: `firebase deploy --only firestore:indexes`
- Indexes can take several minutes to build after deployment

### Push notifications not working
1. Ensure VAPID key is set in `.env.local`
2. Ensure service worker is served at `/firebase-messaging-sw.js`
3. Ensure Cloud Functions are deployed (required for backend notification delivery)
4. Ensure browser notification permission is granted
5. Push notifications do not work on HTTP (localhost is an exception); use HTTPS in production

### Cloud Functions not running
- Check that you are on the Blaze billing plan
- Run `firebase deploy --only functions` and check for TypeScript compilation errors
- Check Firebase Console → Functions → Logs for runtime errors

### Build fails with TypeScript errors
```bash
npm run typecheck
```
Fix any type errors reported before running `npm run build`.
