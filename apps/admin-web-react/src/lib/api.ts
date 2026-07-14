import axios, { AxiosError } from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

export const authConfig = (accessToken?: string) => ({
  headers: accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined,
});

interface ApiEnvelope<T> {
  data: T;
}

export function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (
    payload !== null
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && 'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export function resolveMediaUrl(value?: string | null): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const gatewayOrigin = new URL(API_BASE_URL).origin;
  return new URL(value.startsWith('/') ? value : `/${value}`, gatewayOrigin).toString();
}

export function normalizeStoredMediaUrl(value?: string | null): string {
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // INFO: Relative media URLs are already portable between environments.
  }

  return value;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const axiosError = error as AxiosError<
    | string
    | { message?: string; error?: string; errors?: Record<string, string[] | string> }
  >;
  const payload = axiosError.response?.data;

  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (payload && typeof payload === 'object') {
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
    if (payload.errors) {
      const firstError = Object.values(payload.errors).flat()[0];
      if (firstError) return firstError;
    }
  }

  if (axiosError.code === 'ECONNABORTED') {
    return 'Permintaan melewati batas waktu. Periksa apakah service sedang berjalan.';
  }
  if (!axiosError.response) {
    return 'Tidak dapat terhubung ke API. Periksa API Gateway dan service terkait.';
  }

  return `${fallback} (HTTP ${axiosError.response.status})`;
}
