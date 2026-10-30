import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile, PublicUserProfile } from '../types';

const USERS_COLLECTION = 'users';

// ─── Create or initialize user profile ───────────────────────────────────────

export async function createUserProfile(user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // Profile already exists

  const profile: Omit<UserProfile, 'createdAt' | 'lastSeenAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    lastSeenAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: user.uid,
    displayName: user.displayName ?? 'Anonymous',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    about: '',
    presenceStatus: 'offline',
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  };

  await setDoc(ref, profile);
}

// ─── Get own full profile ─────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as unknown as UserProfile;
}

// ─── Update own profile ──────────────────────────────────────────────────────

export type ProfileUpdatePayload = Partial<
  Pick<UserProfile, 'displayName' | 'photoURL' | 'about'>
>;

export async function updateUserProfile(
  uid: string,
  payload: ProfileUpdatePayload
): Promise<void> {
  // Only permitted fields are passed — no UID, email, or system fields
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, {
    ...payload,
    lastSeenAt: serverTimestamp(),
  });
}

// ─── Update last seen timestamp ──────────────────────────────────────────────

export async function updateLastSeen(uid: string): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await updateDoc(ref, { lastSeenAt: serverTimestamp(), presenceStatus: 'offline' });
}

// ─── Search users by display name prefix ─────────────────────────────────────
// NOTE: Firestore does not support arbitrary full-text search.
// This implements a prefix range query (displayName >= term AND displayName < term\uf8ff).
// For comprehensive full-text search, integrate Algolia, Typesense, or similar.

export async function searchUsers(
  term: string,
  currentUid: string,
  pageLimit = 20
): Promise<PublicUserProfile[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('displayName', '>=', term),
    where('displayName', '<=', term + '\uf8ff'),
    orderBy('displayName'),
    limit(pageLimit)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data() as UserProfile;
      const pub: PublicUserProfile = {
        uid: data.uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        about: data.about,
        lastSeenAt: data.lastSeenAt,
        presenceStatus: data.presenceStatus,
      };
      return pub;
    })
    .filter((u) => u.uid !== currentUid);
}

// ─── Get public profile for a specific UID ────────────────────────────────────

export async function getPublicProfile(uid: string): Promise<PublicUserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile;
  return {
    uid: data.uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    about: data.about,
    lastSeenAt: data.lastSeenAt,
    presenceStatus: data.presenceStatus,
  };
}

// ─── Get multiple public profiles in one call ─────────────────────────────────

export async function getPublicProfiles(uids: string[]): Promise<PublicUserProfile[]> {
  if (uids.length === 0) return [];
  const profiles = await Promise.all(uids.map(getPublicProfile));
  return profiles.filter(Boolean) as PublicUserProfile[];
}
