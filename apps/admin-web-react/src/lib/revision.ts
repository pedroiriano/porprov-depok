export function applyRevisionFields<T extends object>(current: T, payload: Record<string, unknown>): T {
  const restored = { ...current } as Record<string, unknown>;
  for (const key of Object.keys(current)) {
    if (key === 'id' || !Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const historical = payload[key];
    const active = restored[key];
    if (historical === null && typeof active === 'string') restored[key] = '';
    else if (Array.isArray(active) && Array.isArray(historical)) restored[key] = historical;
    else if (typeof historical === typeof active) restored[key] = historical;
  }
  return restored as T;
}
