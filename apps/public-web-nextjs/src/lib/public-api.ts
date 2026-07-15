const DEFAULT_PUBLIC_API_URL = "http://localhost:28000/api/v1";

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
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL).replace(/\/$/, "");
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
        const apiBase = getPublicApiBaseUrl();
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

  const apiBase = getPublicApiBaseUrl();
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
