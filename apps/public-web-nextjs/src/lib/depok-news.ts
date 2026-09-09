import "server-only";

const DEFAULT_REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 5_000;

export interface DepokNewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  tags: string[];
  sourceUrl: string;
}

export type DepokNewsStatus = "ready" | "unconfigured" | "unavailable";

export interface DepokNewsOverview {
  latest: DepokNewsArticle[];
  popular: DepokNewsArticle[];
  status: DepokNewsStatus;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readText(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (isRecord(value)) {
      const rendered = value.rendered ?? value.String ?? value.string;
      if (typeof rendered === "string" && rendered.trim()) return rendered.trim();
    }
  }
  return "";
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function newsPlainText(value: string): string {
  // SECURITY: Konten lintas-origin diperlakukan sebagai teks, bukan HTML tepercaya.
  return decodeBasicEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function safeHttpsUrl(value: string): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function readTags(record: UnknownRecord): string[] {
  const candidate = record.tags ?? record.tag ?? record.kategori ?? record.categories;
  if (typeof candidate === "string") {
    return candidate.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
  }
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((item) => typeof item === "string" ? item.trim() : isRecord(item) ? readText(item, ["name", "title", "label", "nama"]) : "")
    .filter(Boolean)
    .slice(0, 12);
}

function unwrapNewsPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of ["data", "items", "news", "berita", "posts", "results", "result"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = unwrapNewsPayload(value);
      if (nested.length > 0) return nested;
    }
  }
  const looksLikeArticle = ["title", "judul", "post_title", "name"].some((key) => typeof payload[key] === "string");
  return looksLikeArticle ? [payload] : [];
}

function normalizeNewsArticle(value: unknown, index: number): DepokNewsArticle | null {
  if (!isRecord(value)) return null;
  const title = newsPlainText(readText(value, ["title", "judul", "post_title", "name"]));
  if (!title) return null;
  const sourceUrl = safeHttpsUrl(readText(value, ["url", "link", "source_url", "permalink"]));
  const requestedSlug = readText(value, ["slug", "post_slug"]);
  const sourceSlug = sourceUrl ? new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1) ?? "" : "";
  const slug = slugify(requestedSlug || sourceSlug || title);
  if (!slug) return null;
  const rawSummary = readText(value, ["excerpt", "ringkasan", "summary", "description", "deskripsi", "lead"]);
  const rawContent = readText(value, ["content", "isi", "body", "article", "content_rendered"]);
  const summary = newsPlainText(rawSummary || rawContent).slice(0, 280);
  const content = newsPlainText(rawContent || rawSummary);
  const publishedAt = readText(value, ["published_at", "publishedAt", "date", "tanggal", "created_at", "createdAt"]);
  const parsedPublishedAt = publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString() : "";

  return {
    id: readText(value, ["id", "ID", "post_id"]) || `${slug}-${index}`,
    slug,
    title,
    summary: summary || "Baca informasi selengkapnya dari Portal Berita Depok.",
    content: content || summary,
    imageUrl: safeHttpsUrl(readText(value, ["image_url", "image", "thumbnail", "thumbnail_url", "thumb_url", "featured_image", "gambar"])),
    author: newsPlainText(readText(value, ["author", "penulis", "author_name", "writer"])) || "Portal Berita Depok",
    publishedAt: parsedPublishedAt,
    tags: readTags(value),
    sourceUrl,
  };
}

function getNewsConfiguration() {
  const baseUrl = process.env.BERITA_DEPOK_BASE_URL?.trim() || "";
  const apiKey = process.env.BERITA_DEPOK_API_KEY?.trim() || "";
  if (!baseUrl || !apiKey) return null;
  try {
    const parsed = new URL(baseUrl);
    const localhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if ((parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && localhost)) || parsed.username || parsed.password) return null;
    return { baseUrl: parsed.toString().replace(/\/$/, ""), apiKey };
  } catch {
    return null;
  }
}

function allowedNewsAssetHosts(): Set<string> {
  const hosts = new Set(
    (process.env.BERITA_DEPOK_IMAGE_HOSTS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => /^[a-z0-9.-]+$/.test(item)),
  );
  const configuration = getNewsConfiguration();
  if (configuration) hosts.add(new URL(configuration.baseUrl).hostname.toLowerCase());
  return hosts;
}

export function isAllowedNewsAssetUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:"
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && allowedNewsAssetHosts().has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function newsImageProxyPath(value: string): string {
  return isAllowedNewsAssetUrl(value) ? `/api/berita/image?url=${encodeURIComponent(value)}` : "";
}

async function requestNews(path: string): Promise<{ ok: boolean; items: DepokNewsArticle[] }> {
  const configuration = getNewsConfiguration();
  if (!configuration) return { ok: false, items: [] };
  try {
    const endpoint = new URL(path, `${configuration.baseUrl}/`);
    if (endpoint.origin !== new URL(configuration.baseUrl).origin) return { ok: false, items: [] };
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "x-api-key": configuration.apiKey },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
    });
    if (!response.ok) return { ok: false, items: [] };
    const payload: unknown = await response.json();
    return {
      ok: true,
      items: unwrapNewsPayload(payload)
        .map(normalizeNewsArticle)
        .filter((item): item is DepokNewsArticle => item !== null),
    };
  } catch {
    // INFO: Beranda dan halaman berita tetap dapat dirender saat sumber eksternal gagal.
    return { ok: false, items: [] };
  }
}

function boundedCount(value: number, maximum: number): number {
  return Math.max(1, Math.min(Math.trunc(value), maximum));
}

export async function loadDepokNewsOverview(latestCount = 8, popularCount = 5): Promise<DepokNewsOverview> {
  if (!getNewsConfiguration()) return { latest: [], popular: [], status: "unconfigured" };
  const [latest, popular] = await Promise.all([
    requestNews(`/api/v1/latest/${boundedCount(latestCount, 48)}`),
    requestNews(`/api/v1/popular/${boundedCount(popularCount, 24)}`),
  ]);
  return {
    // INFO: API populer dapat mengembalikan lebih banyak item daripada parameter
    // jumlah, jadi batas tampilan tetap ditegakkan pada consumer tepercaya.
    latest: latest.items.slice(0, boundedCount(latestCount, 48)),
    popular: popular.items.slice(0, boundedCount(popularCount, 24)),
    status: latest.ok || popular.ok ? "ready" : "unavailable",
  };
}

export async function loadDepokNewsBySlug(slug: string): Promise<{ article: DepokNewsArticle | null; status: DepokNewsStatus }> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return { article: null, status: "ready" };
  const configuration = getNewsConfiguration();
  if (!configuration) return { article: null, status: "unconfigured" };

  const detailTemplate = process.env.BERITA_DEPOK_DETAIL_PATH_TEMPLATE?.trim();
  if (detailTemplate?.startsWith("/") && detailTemplate.includes("{slug}")) {
    const detail = await requestNews(detailTemplate.replace("{slug}", encodeURIComponent(slug)));
    const exact = detail.items.find((item) => item.slug === slug) ?? detail.items[0] ?? null;
    if (detail.ok && exact) return { article: exact, status: "ready" };
  }

  // INFO: Koleksi Postman belum mendefinisikan URL bySlug. Fallback terbatas
  // mencari slug pada feed yang sudah terdokumentasi, tanpa mengarang endpoint.
  const overview = await loadDepokNewsOverview(48, 24);
  return {
    article: [...overview.latest, ...overview.popular].find((item) => item.slug === slug) ?? null,
    status: overview.status,
  };
}
