import "server-only";

const DEFAULT_REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 5_000;
const PORPROV_TAG_PATH = "/api/v1/find-posts-by-tags/PorprovJabar2026";
const PORPROV_TAG_LABEL = "PORPROV Jabar 2026";
const MAX_TAG_PAGES = 20;

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
  related: DepokNewsArticle[];
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
  const entities: Record<string, string> = {
    "#39": "'",
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  // SECURITY: Satu replacement pass mencegah entity hasil decode diproses ulang.
  return value.replace(/&(nbsp|amp|quot|#39|apos|lt|gt);/gi, (entity) => {
    const key = entity.slice(1, -1).toLowerCase();
    return entities[key] ?? entity;
  });
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

export function trustedNewsAssetUrl(value: string): URL | null {
  if (!isAllowedNewsAssetUrl(value)) return null;
  try {
    const candidate = new URL(value);
    const trustedHost = [...allowedNewsAssetHosts()].find(
      (host) => host === candidate.hostname.toLowerCase(),
    );
    if (!trustedHost) return null;

    // SECURITY: Otoritas URL selalu direkonstruksi dari allowlist konfigurasi;
    // input request hanya mengisi path dan query setelah host dipercaya.
    const trustedUrl = new URL(`https://${trustedHost}/`);
    trustedUrl.pathname = candidate.pathname;
    trustedUrl.search = candidate.search;
    return trustedUrl;
  } catch {
    return null;
  }
}

export function newsImageProxyPath(value: string): string {
  return isAllowedNewsAssetUrl(value) ? `/api/berita/image?url=${encodeURIComponent(value)}` : "";
}

async function requestNews(path: string): Promise<{ ok: boolean; items: DepokNewsArticle[]; hasNext: boolean }> {
  const configuration = getNewsConfiguration();
  if (!configuration) return { ok: false, items: [], hasNext: false };
  try {
    const endpoint = new URL(path, `${configuration.baseUrl}/`);
    if (endpoint.origin !== new URL(configuration.baseUrl).origin) return { ok: false, items: [], hasNext: false };
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "x-api-key": configuration.apiKey },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
    });
    if (!response.ok) return { ok: false, items: [], hasNext: false };
    const payload: unknown = await response.json();
    return {
      ok: true,
      items: unwrapNewsPayload(payload)
        .map(normalizeNewsArticle)
        .filter((item): item is DepokNewsArticle => item !== null),
      hasNext: isRecord(payload) && typeof payload.next_page_url === "string" && payload.next_page_url.length > 0,
    };
  } catch {
    // INFO: Beranda dan halaman berita tetap dapat dirender saat sumber eksternal gagal.
    return { ok: false, items: [], hasNext: false };
  }
}

function boundedCount(value: number, maximum: number): number {
  return Math.max(1, Math.min(Math.trunc(value), maximum));
}

async function requestTaggedNews(limit: number, targetSlug?: string) {
  const articles = new Map<string, DepokNewsArticle>();
  for (let page = 1; page <= MAX_TAG_PAGES; page += 1) {
    // SECURITY: Nomor halaman dibentuk sendiri; next_page_url dari API tidak
    // pernah diikuti agar sumber eksternal tidak dapat mengubah host request.
    const result = await requestNews(`${PORPROV_TAG_PATH}?page=${page}`);
    if (!result.ok) return { items: [...articles.values()], ok: false, complete: false };
    for (const item of result.items) {
      articles.set(item.slug, { ...item, tags: item.tags.length > 0 ? item.tags : [PORPROV_TAG_LABEL] });
    }
    if (targetSlug && articles.has(targetSlug)) {
      return { items: [...articles.values()], ok: true, complete: false };
    }
    if (!result.hasNext) return { items: [...articles.values()], ok: true, complete: true };
    if (!targetSlug && articles.size >= limit) {
      return { items: [...articles.values()], ok: true, complete: false };
    }
  }
  return { items: [...articles.values()], ok: true, complete: false };
}

export async function loadDepokNewsOverview(latestCount = 8, relatedCount = 5): Promise<DepokNewsOverview> {
  if (!getNewsConfiguration()) return { latest: [], related: [], status: "unconfigured" };
  const latestLimit = boundedCount(latestCount, 100);
  const relatedLimit = Math.max(0, Math.min(Math.trunc(relatedCount), 24));
  const tagged = await requestTaggedNews(latestLimit + relatedLimit);
  const related = tagged.items.slice(latestLimit, latestLimit + relatedLimit);
  return {
    latest: tagged.items.slice(0, latestLimit),
    // INFO: Endpoint bertag tidak menyediakan peringkat populer. Sidebar
    // memakai berita terkait berikutnya, lalu fallback ke awal feed.
    related: related.length > 0 ? related : tagged.items.slice(0, relatedLimit),
    status: tagged.ok ? "ready" : "unavailable",
  };
}

export async function loadDepokNewsBySlug(slug: string): Promise<{ article: DepokNewsArticle | null; status: DepokNewsStatus }> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return { article: null, status: "ready" };
  const configuration = getNewsConfiguration();
  if (!configuration) return { article: null, status: "unconfigured" };

  // SECURITY: Slug harus terbukti anggota feed bertag sebelum detail opsional
  // dipanggil. Artikel di luar tag tidak boleh muncul melalui URL langsung.
  const tagged = await requestTaggedNews(100, slug);
  const taggedArticle = tagged.items.find((item) => item.slug === slug);
  if (!taggedArticle) return { article: null, status: tagged.complete ? "ready" : "unavailable" };

  const detailTemplate = process.env.BERITA_DEPOK_DETAIL_PATH_TEMPLATE?.trim();
  if (detailTemplate?.startsWith("/") && detailTemplate.includes("{slug}")) {
    const detail = await requestNews(detailTemplate.replace("{slug}", encodeURIComponent(slug)));
    const exact = detail.items.find((item) => item.slug === slug);
    if (detail.ok && exact) return { article: { ...exact, tags: taggedArticle.tags }, status: "ready" };
  }

  // INFO: API bertag hanya menyediakan judul, caption foto, dan metadata;
  // sumber resmi tetap ditautkan untuk membaca artikel lengkap.
  return { article: taggedArticle, status: "ready" };
}
