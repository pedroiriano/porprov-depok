import axios from 'axios';
import { apiClient, authConfig } from './api';

export interface ServerFormDraft<T = unknown> {
  id: string;
  route_key: string;
  entity_key: string;
  form_version: string;
  payload: T;
  version: number;
  updated_at: string;
  expires_at: string;
}

const sensitiveFieldPattern = /(password|passphrase|secret|token|credential|authorization|cookie|private[_-]?key|file[_-]?(data|bytes|content|raw))/i;

export class ServerDraftConflictError<T> extends Error {
  current: ServerFormDraft<T>;

  constructor(current: ServerFormDraft<T>) {
    super('Draft telah berubah di perangkat lain.');
    this.name = 'ServerDraftConflictError';
    this.current = current;
  }
}

export function sanitizeDraftPayload<T>(value: T): T {
  const visit = (current: unknown): unknown => {
    if (current instanceof File || current instanceof Blob) return undefined;
    if (Array.isArray(current)) return current.map(visit).filter((item) => item !== undefined);
    if (current && typeof current === 'object') {
      return Object.fromEntries(Object.entries(current as Record<string, unknown>)
        .filter(([key]) => !sensitiveFieldPattern.test(key))
        .map(([key, item]) => [key, visit(item)])
        .filter(([, item]) => item !== undefined));
    }
    return current;
  };
  return visit(value) as T;
}

export async function readServerDraft<T>(token: string, route: string, entity: string, formVersion: string, signal?: AbortSignal): Promise<ServerFormDraft<T> | null> {
  const params = new URLSearchParams({ route, entity, form_version: formVersion });
  const response = await apiClient.get<ServerFormDraft<T> | ''>(`/drafts?${params}`, { ...authConfig(token), signal, validateStatus: (status) => status === 200 || status === 204 });
  return response.status === 204 ? null : response.data as ServerFormDraft<T>;
}

export async function saveServerDraft<T>(token: string, route: string, entity: string, formVersion: string, payload: T, expectedVersion: number): Promise<ServerFormDraft<T>> {
  try {
    const response = await apiClient.put<ServerFormDraft<T>>('/drafts', {
      route_key: route,
      entity_key: entity,
      form_version: formVersion,
      payload: sanitizeDraftPayload(payload),
      expected_version: expectedVersion,
    }, authConfig(token));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409 && error.response.data?.current) {
      throw new ServerDraftConflictError<T>(error.response.data.current as ServerFormDraft<T>);
    }
    throw error;
  }
}

export async function deleteServerDraft(token: string, route: string, entity: string, formVersion: string): Promise<void> {
  const params = new URLSearchParams({ route, entity, form_version: formVersion });
  await apiClient.delete(`/drafts?${params}`, authConfig(token));
}

export function draftFieldDifferences(local: unknown, server: unknown): Array<{ field: string; local: string; server: string }> {
  const localObject = local && typeof local === 'object' && !Array.isArray(local) ? local as Record<string, unknown> : {};
  const serverObject = server && typeof server === 'object' && !Array.isArray(server) ? server as Record<string, unknown> : {};
  return [...new Set([...Object.keys(localObject), ...Object.keys(serverObject)])]
    .filter((field) => JSON.stringify(localObject[field]) !== JSON.stringify(serverObject[field]))
    .map((field) => ({ field, local: displayValue(localObject[field]), server: displayValue(serverObject[field]) }));
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Kosong';
  if (Array.isArray(value)) return value.length === 0 ? 'Kosong' : value.map(displayValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
