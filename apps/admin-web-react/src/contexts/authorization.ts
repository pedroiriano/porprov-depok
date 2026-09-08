import { createContext, useContext } from 'react';

export type AuthorizationSession = {
  active: boolean;
  username: string;
  permissions: string[];
};

export type AuthorizationContextValue = AuthorizationSession & {
  loading: boolean;
  error: string;
  hasPermission: (permission: string) => boolean;
  refresh: () => Promise<void>;
};

export const AuthorizationContext = createContext<AuthorizationContextValue | null>(null);

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (!context) throw new Error('useAuthorization wajib digunakan di dalam AuthorizationProvider');
  return context;
}
