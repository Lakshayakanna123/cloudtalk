import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase to avoid real network calls in unit tests
vi.mock('../src/services/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  db: {},
  functions: {},
  messagingPromise: Promise.resolve(null),
  app: {},
}));

// Suppress console warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
