import { createContext, useContext } from 'react';
import type { AuthState } from '../types/auth.types';
export const AuthContext = createContext<
  | (AuthState & {
      initializing: boolean;
      login: (email: string, password: string) => Promise<void>;
      register: (email: string, password: string) => Promise<boolean>;
      logout: () => Promise<void>;
      retry: () => void;
    })
  | null
>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider required');
  return context;
}
