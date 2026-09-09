import type { Metadata } from "next";
import Link from "next/link";
import { NewsCard } from "@/components/NewsCard";
import { PublicPageHero } from "@/components/PublicPageHero";
import { loadDepokNewsOverview } from "@/lib/depok-news";

export const metadata: Metadata = {
  title: "Berita Kota Depok",
  description: "Berita terkini dan populer dari Portal Berita Depok untuk masyarakat dan peserta PORPROV XV Jawa Barat 2026.",
  alternates: { canonical: "/berita" },
};

const ITEMS_PER_PAGE = 8;
const MAX_QUERY_LENGTH = 80;

function singleValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function createNewsUrl(query: string, tag: string, page = 1): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/berita?${suffix}` : "/berita";
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tag?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedQuery = singleValue(params.q);
  const query = Array.from(requestedQuery).length <= MAX_QUERY_LENGTH ? requestedQuery : "";
  const tag = singleValue(params.tag).slice(0, 80);
  const requestedPage = singleValue(params.page);
  const page = /^\d{1,5}$/.test(requestedPage) ? Math.max(1, Number.parseInt(requestedPage, 10)) : 1;
  const news = await loadDepokNewsOverview(48, 8);
  const normalizedQuery = query.toLocaleLowerCase("id");
  const filtered = news.latest.filter((article) => {
    const queryMatches = !normalizedQuery || `${article.title} ${article.summary}`.toLocaleLowerCase("id").includes(normalizedQuery);
    const tagMatches = !tag || article.tags.some((item) => item.toLocaleLowerCase("id") === tag.toLocaleLowerCase("id"));
    return queryMatches && tagMatches;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const activePage = Math.min(page, totalPages);
  const articles = filtered.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);
  const tags = Array.from(new Set(news.latest.flatMap((article) => article.tags))).sort((a, b) => a.localeCompare(b, "id")).slice(0, 18);

  return (
    <main className="bg-slate-50 dark:bg-slate-950">
      <PublicPageHero eyebrow="Kabar Kota Tuan Rumah" title="Berita Kota Depok" description="Ikuti kabar terkini Kota Depok dari sumber resmi untuk melengkapi informasi PORPROV XV Jawa Barat 2026." icon="ri-newspaper-line" breadcrumbs={[{ label: "Berita" }]} />
      <div className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,2fr)_320px]">
        <section aria-labelledby="news-list-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-black uppercase tracking-[0.16em] text-primary-600 dark:text-sky-300">Terbaru</p><h2 id="news-list-title" className="mt-2 text-3xl font-black">Informasi untuk Anda</h2></div>
            <p className="text-sm font-bold text-slate-500" aria-live="polite">{filtered.length} berita ditemukan</p>
          </div>

          {requestedQuery && !query ? (
            <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100" role="alert">Kata pencarian maksimal {MAX_QUERY_LENGTH} karakter.</div>
          ) : articles.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900" role={news.status === "unavailable" ? "alert" : "status"}>
              <i className="ri-newspaper-line text-5xl text-primary-500" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-black">Berita belum tersedia</h3>
              <p className="mx-auto mt-2 max-w-lg text-slate-500">Coba hapus filter atau buka kembali halaman ini setelah sumber Berita Depok tersedia.</p>
              {(query || tag) && <Link href="/berita" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary-600 px-5 font-black text-white">Hapus semua filter</Link>}
            </div>
          ) : (
            <div className="mt-8 grid gap-7 md:grid-cols-2">{articles.map((article) => <NewsCard key={article.id} article={article} />)}</div>
          )}

          {totalPages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman berita">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <Link key={number} href={createNewsUrl(query, tag, number)} aria-current={number === activePage ? "page" : undefined} className={`inline-flex size-11 items-center justify-center rounded-full border font-black ${number === activePage ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 bg-white hover:border-primary-500 dark:border-slate-700 dark:bg-slate-900"}`}>{number}</Link>)}
            </nav>
          )}
        </section>

        <aside className="space-y-7">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="news-search-title">
            <h2 id="news-search-title" className="rounded-lg bg-slate-100 p-3 text-center text-lg font-black dark:bg-slate-800">Cari berita</h2>
            <form action="/berita" className="mt-5">
              {tag && <input type="hidden" name="tag" value={tag} />}
              <label htmlFor="news-query" className="sr-only">Kata pencarian berita</label>
              <div className="relative"><input id="news-query" name="q" type="search" defaultValue={requestedQuery} maxLength={MAX_QUERY_LENGTH} placeholder="Masukkan kata kunci…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-12 ps-4 dark:border-slate-700 dark:bg-slate-950" /><button type="submit" aria-label="Cari berita" className="absolute end-1 top-1 inline-flex size-10 items-center justify-center rounded-lg bg-primary-600 text-white"><i className="ri-search-line" aria-hidden="true" /></button></div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="popular-sidebar-title">
            <h2 id="popular-sidebar-title" className="rounded-lg bg-slate-100 p-3 text-center text-lg font-black dark:bg-slate-800">Berita populer</h2>
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{news.popular.map((article) => <Link key={article.id} href={`/berita/${encodeURIComponent(article.slug)}`} className="block min-h-16 py-4 font-bold leading-snug hover:text-primary-600 dark:hover:text-sky-300">{article.title}</Link>)}</div>
          </section>

          {tags.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="news-tags-title">
              <h2 id="news-tags-title" className="rounded-lg bg-slate-100 p-3 text-center text-lg font-black dark:bg-slate-800">Topik berita</h2>
              <div className="mt-5 flex flex-wrap justify-center gap-2">{tags.map((item) => <Link key={item} href={createNewsUrl(query, item)} className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-bold ${item === tag ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700"}`}>{item}</Link>)}</div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
