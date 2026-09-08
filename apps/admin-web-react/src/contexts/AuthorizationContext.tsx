import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage } from '../lib/api';
import { AuthorizationContext, type AuthorizationContextValue, type AuthorizationSession } from './authorization';

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [session, setSession] = useState<AuthorizationSession>({ active: false, username: '', permissions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!token) {
      setSession({ active: false, username: '', permissions: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get<AuthorizationSession>('/authorization/session', authConfig(token));
      setSession({ active: Boolean(response.data.active), username: response.data.username || '', permissions: response.data.permissions || [] });
      setError('');
    } catch (cause) {
      setSession({ active: false, username: '', permissions: [] });
      setError(getApiErrorMessage(cause, 'Hak akses akun belum dapat diperiksa.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);
  const value = useMemo<AuthorizationContextValue>(() => ({
    ...session, loading, error,
    hasPermission: (permission) => {
      const domain = permission.split('.', 1)[0];
      return session.active && (session.permissions.includes(permission) || session.permissions.includes(`${domain}.manage`));
    },
    refresh,
  }), [error, loading, refresh, session]);
  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}
