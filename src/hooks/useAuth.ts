import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { updateLastSeen } from '../services/users.service';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, initialized: true });

      // Update lastSeenAt on auth state change (best-effort)
      if (user) {
        updateLastSeen(user.uid).catch(() => {
          // Non-critical — do not surface to user
        });
      }
    });

    return unsubscribe;
  }, []);

  return state;
}
