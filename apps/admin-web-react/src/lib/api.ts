import axios, { AxiosError } from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('porprov:session-expired'));
    }
    return Promise.reject(error);
  },
);

export const authConfig = (accessToken?: string) => ({
  headers: accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined,
});

interface ApiEnvelope<T> {
  data: T;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
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
    | { message?: string; error?: string | { message?: string }; errors?: Record<string, string[] | string>; meta?: { request_id?: string } }
  >;
  const payload = axiosError.response?.data;

  const safeMessage = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const message = value.trim();
    if (!message || message.length > 240 || /[\r\n]/.test(message)) return '';
    if (/(sql|database|postgres|redis|nats|jwt|token|stack|panic|exception|migration|service|gateway|invalid|required|unavailable|could not|forbidden|unauthorized|insufficient|missing)/i.test(message)) return '';
    return message;
  };

  const status = axiosError.response?.status;
  if (status === 401) return 'Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.';
  if (status === 403) return 'Akun Anda tidak memiliki izin untuk melakukan tindakan ini.';
  if (status === 409) return 'Data telah berubah di perangkat atau sesi lain. Muat ulang data, bandingkan perubahan, lalu coba kembali.';
  if (status === 429) return 'Permintaan terlalu sering. Tunggu sebentar, lalu coba kembali.';

  if (typeof payload === 'string' && safeMessage(payload)) return safeMessage(payload);
  if (payload && typeof payload === 'object') {
    if (safeMessage(payload.message)) return safeMessage(payload.message);
    if (safeMessage(payload.error)) return safeMessage(payload.error);
    if (typeof payload.error === 'object' && safeMessage(payload.error?.message)) return safeMessage(payload.error.message);
    if (payload.errors) {
      const firstError = Object.values(payload.errors).flat()[0];
      if (safeMessage(firstError)) return safeMessage(firstError);
    }
  }

  if (axiosError.code === 'ECONNABORTED') {
    return 'Permintaan melewati batas waktu. Coba kembali beberapa saat lagi.';
  }
  if (!axiosError.response) {
    return 'Layanan belum dapat dihubungi. Periksa koneksi lalu coba kembali.';
  }

  const requestID = payload && typeof payload === 'object' && 'meta' in payload ? payload.meta?.request_id : '';
  return requestID && requestID !== 'unknown' ? `${fallback} Nomor pelacakan: ${requestID}.` : fallback;
}
