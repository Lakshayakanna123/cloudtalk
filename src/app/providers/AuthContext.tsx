import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  initialized: false,
});

export const useAuthContext = () => useContext(AuthContext);
