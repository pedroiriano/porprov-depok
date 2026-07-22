const DEFAULT_PUBLIC_API_URL = "http://localhost:8000/api/v1";

type NullablePgText =
  | string
  | null
  | undefined
  | {
      String?: string;
      string?: string;
      Valid?: boolean;
      valid?: boolean;
    };

type NullablePgNumber =
  | number
  | string
  | null
  | undefined
  | {
      Int32?: number;
      Int64?: number;
      Float64?: number;
      Int?: number | string;
      Exp?: number;
      Valid?: boolean;
      int32?: number;
      int64?: number;
      float64?: number;
      int?: number | string;
      exp?: number;
      valid?: boolean;
    };

type NullablePgTimestamp =
  | string
  | null
  | undefined
  | {
      Time?: string;
      time?: string;
      Valid?: boolean;
      valid?: boolean;
    };

export function getPublicApiBaseUrl(): string {
  const browserUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL;
  const serverUrl = process.env.API_INTERNAL_URL || browserUrl;

  // INFO: Browser memakai origin host API Gateway, sedangkan Server Components
  // di dalam Docker memakai DNS Compose. Keduanya tetap melalui API Gateway.
  return (typeof window === "undefined" ? serverUrl : browserUrl).replace(/\/$/, "");
}

export function publicApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
}

export function unwrapCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }

  return [];
}

export function readPgText(value: NullablePgText): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const valid = value.Valid ?? value.valid ?? true;
  if (!valid) {
    return "";
  }

  return (value.String ?? value.string ?? "").trim();
}

export function readPgNumber(value: NullablePgNumber): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (!value || typeof value !== "object") {
    return 0;
  }

  const valid = value.Valid ?? value.valid ?? true;
  if (!valid) {
    return 0;
  }

  const candidate =
    value.Int32 ??
    value.Int64 ??
    value.Float64 ??
    value.int32 ??
    value.int64 ??
    value.float64;

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }

  const numericInt = value.Int ?? value.int;
  if (numericInt !== undefined) {
    const parsedInt = Number(numericInt);
    const exponent = value.Exp ?? value.exp ?? 0;
    const parsed = parsedInt * Math.pow(10, exponent);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function readResourceId(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record.String ?? record.string ?? record.UUID ?? record.uuid;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

	const bytes = record.Bytes ?? record.bytes;
	if (Array.isArray(bytes) && bytes.length === 16 && bytes.every((item) => Number.isInteger(item))) {
		const hex = bytes.map((item) => Number(item).toString(16).padStart(2, "0")).join("");
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}
  }

  return fallback;
}

export function readPgTimestamp(value: NullablePgTimestamp): string {
  if (typeof value === "string") {
    return Number.isNaN(Date.parse(value)) ? "" : value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const valid = value.Valid ?? value.valid ?? true;
  if (!valid) {
    return "";
  }

  const timestamp = value.Time ?? value.time ?? "";
  return timestamp && !Number.isNaN(Date.parse(timestamp)) ? timestamp : "";
}

// INFO: Selalu mengembalikan URL API yang dapat diakses browser.
// Digunakan oleh resolvePublicAssetUrl agar <img src> tidak mengarah ke hostname Docker internal.
export function getBrowserApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL).replace(/\/$/, "");
}

export function resolvePublicAssetUrl(value: NullablePgText): string {
  const path = readPgText(value);
  if (!path) {
    return "";
  }

  if (path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  // CHANGE: Metadata lama dapat menyimpan host diagnostik localhost:18xxx.
  // Browser publik harus tetap mengambil file melalui route /uploads milik API Gateway.
  if (/^https?:\/\//i.test(path)) {
    try {
      const absolute = new URL(path);
      const legacyLocalHost = absolute.hostname === "localhost" || absolute.hostname === "127.0.0.1";
      if (legacyLocalHost && absolute.pathname.startsWith("/uploads/")) {
        // INFO: Gunakan URL browser-accessible, bukan internal Docker
        const apiBase = getBrowserApiBaseUrl();
        return /^https?:\/\//i.test(apiBase)
          ? new URL(`${absolute.pathname}${absolute.search}`, apiBase).toString()
          : `${absolute.pathname}${absolute.search}`;
      }
    } catch {
      return "";
    }
    return path;
  }

  if (!path.startsWith("/")) {
    return path;
  }

  // INFO: Asset URL (img src, dll.) harus selalu menggunakan origin yang dapat dijangkau browser,
  // bukan API_INTERNAL_URL Docker yang hanya bisa diakses dari dalam jaringan Docker.
  const apiBase = getBrowserApiBaseUrl();
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      return new URL(path, apiBase).toString();
    } catch {
      return path;
    }
  }

  return path;
}

export function safeExternalUrl(value: NullablePgText): string {
  const url = readPgText(value);
  return /^https?:\/\//i.test(url) ? url : "";
}
