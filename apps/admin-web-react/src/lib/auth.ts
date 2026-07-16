import type { User } from 'oidc-client-ts';

interface RealmAccessClaim {
  roles?: unknown;
}

interface TokenClaims {
  realm_access?: RealmAccessClaim;
}

function normalizeRoles(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];

  const roles = (value as RealmAccessClaim).roles;
  if (!Array.isArray(roles)) return [];

  return roles.filter((role): role is string => typeof role === 'string' && role.length > 0);
}

function decodeAccessToken(accessToken?: string): TokenClaims | null {
  if (!accessToken) return null;

  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded)) as TokenClaims;
  } catch {
    // SECURITY: Token validation tetap menjadi tanggung jawab API Gateway.
    // Decode di browser hanya dipakai untuk presentation-level navigation.
    return null;
  }
}

export function getRealmRoles(user?: User | null): string[] {
  const profileRoles = normalizeRoles(user?.profile?.realm_access);
  const tokenRoles = normalizeRoles(decodeAccessToken(user?.access_token)?.realm_access);

  return [...new Set([...profileRoles, ...tokenRoles])];
}

export function canAccessRole(roles: string[], allowedRoles: string[]): boolean {
  return roles.includes('super_admin') || allowedRoles.some((role) => roles.includes(role));
}
