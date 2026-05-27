import { createContext, useContext } from 'react';
import type { PlatformUser } from '../types/platform';

interface AuthContextValue {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthContext.Provider');
  return ctx;
}
