import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage } from '../lib/api';
import { AuthorizationContext, type AuthorizationContextValue, type AuthorizationSession } from './authorization';
import { SessionRefreshShield } from '../components/common/SessionRefreshShield';

const emptySession: AuthorizationSession = { active: false, username: '', permissions: [] };
type Verification = { identity: string; token: string; checking: boolean; error: string; session: AuthorizationSession };

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const token = auth.user?.access_token || '';
  const subject = auth.user?.profile.sub || '';
  const identity = subject ? `${auth.settings.authority}:${subject}` : '';
  const [state, setState] = useState<Verification>({ identity: '', token: '', checking: true, error: '', session: emptySession });
  const request = useRef<{ id: number; controller?: AbortController }>({ id: 0 });

  const refresh = useCallback(async () => {
    request.current.controller?.abort();
    const controller = new AbortController();
    const id = ++request.current.id;
    request.current.controller = controller;
    if (!token || !identity) {
      setState({ identity: '', token: '', checking: false, error: '', session: emptySession });
      return;
    }
    // RELIABILITY: Retain only the same actor's verified presentation while checking renewed access.
    setState(previous => ({ identity, token: previous.identity === identity ? previous.token : '', checking: true, error: '', session: previous.identity === identity ? previous.session : emptySession }));
    try {
      const response = await apiClient.get<AuthorizationSession>('/authorization/session', { ...authConfig(token), signal: controller.signal });
      if (controller.signal.aborted || request.current.id !== id) return;
      setState({ identity, token, checking: false, error: '', session: { active: response.data.active === true, username: response.data.username || '', permissions: Array.isArray(response.data.permissions) ? response.data.permissions : [] } });
    } catch (cause) {
      if (controller.signal.aborted || request.current.id !== id) return;
      const status = (cause as { response?: { status?: number } })?.response?.status;
      // SECURITY: Confirmed denial clears access; network failures keep the same actor's form blocked for retry.
      setState(previous => ({ identity, token, checking: false, error: getApiErrorMessage(cause, 'Hak akses akun belum dapat diperiksa.'), session: status === 401 || status === 403 || previous.identity !== identity ? emptySession : previous.session }));
    }
  }, [identity, token]);

  useEffect(() => {
    const pendingRequest = request.current;
    void refresh();
    return () => { pendingRequest.controller?.abort(); ++pendingRequest.id; };
  }, [refresh]);

  // SECURITY: Mask other actors immediately, before effects or network responses.
  const session = identity && token && state.identity === identity ? state.session : emptySession;
  const pending = Boolean(identity && token && (state.identity !== identity || state.token !== token || state.checking));
  const silentRenew = auth.isLoading && auth.activeNavigator === 'signinSilent';
  const error = state.identity === identity ? state.error : '';
  const refreshing = session.active && (pending || silentRenew || Boolean(error));
  const loading = !session.active && pending;
  const value = useMemo<AuthorizationContextValue>(() => ({
    ...session, loading, refreshing, error,
    // SECURITY: Cached permissions retain DOM only; the global shield blocks actions until verification. APIs remain authoritative.
    hasPermission: permission => {
      const domain = permission.split('.', 1)[0];
      return session.active && (session.permissions.includes(permission) || session.permissions.includes(`${domain}.manage`));
    },
    refresh,
  }), [error, loading, refreshing, refresh, session]);
  return <AuthorizationContext.Provider value={value}>{children}<SessionRefreshShield blocked={refreshing} error={error} onRetry={refresh} /></AuthorizationContext.Provider>;
}
