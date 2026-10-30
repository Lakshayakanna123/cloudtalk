import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import {
  getMessaging,
  isSupported,
} from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import type { Functions } from 'firebase/functions';

// ─── Config validation ────────────────────────────────────────────────────────
// Skip validation in Vitest test environments (import.meta.env.MODE = 'test')

const IS_TEST = import.meta.env.MODE === 'test';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

if (!IS_TEST) {
  const missing = REQUIRED_VARS.filter((k) => !import.meta.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[CloudTalk] Missing Firebase configuration: ${missing.join(', ')}.\n` +
        'Copy .env.example to .env.local and fill in your Firebase project values.'
    );
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

// ─── Singleton initialisation ─────────────────────────────────────────────────

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Messaging is not available in all environments (e.g., Firefox private mode,
// Node.js test contexts). We export a promise so callers can await support.
export const messagingPromise: Promise<Messaging | null> = isSupported()
  .then((supported) => (supported ? getMessaging(app) : null))
  .catch((): null => null);

// ─── Emulator connections (development only) ──────────────────────────────────

if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.info('[CloudTalk] Using Firebase Emulator Suite');
}

export { app };
