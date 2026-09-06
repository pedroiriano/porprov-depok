import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeCityGuide, type RawCityGuide } from "@/lib/public-models";

export const dynamic = "force-dynamic";

const CATEGORY_IDS = new Set([
  "semua",
  "coffee-shop",
  "wisata-kuliner",
  "catering",
  "info-travel",
  "tempat-menginap",
  "wisata-buatan",
  "wisata-situ",
  "pusat-perbelanjaan",
  "rumah-sakit",
  "lainnya",
]);

const MAX_SEARCH_LENGTH = 80;

function readSingleQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export const metadata: Metadata = {
  title: "City Guide | PORPROV XV Jawa Barat 2026",
  description: "Jelajahi keindahan, kuliner, dan akomodasi terbaik di Kota Depok selama perhelatan PORPROV XV Jawa Barat 2026.",
};

async function getCityGuides(searchQuery: string) {
  const endpoint = new URL(publicApiUrl("/master-data/city-guides"));
  if (searchQuery) endpoint.searchParams.set("q", searchQuery);

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) return { guides: [], hasError: true };
  const rawGuides = unwrapCollection<RawCityGuide>(await response.json());
  return { guides: rawGuides.map(normalizeCityGuide), hasError: false };
}

function createCityGuideUrl(category: string, searchQuery: string, page?: number) {
  const params = new URLSearchParams();
  if (category !== "semua") params.set("category", category);
  if (searchQuery) params.set("q", searchQuery);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/city-guide?${query}` : "/city-guide";
}

const getCategoryIcon = (category: string) => {
  const cat = category.trim().toLowerCase();
  if (cat === "coffee shop") return "ri-cup-line text-amber-500 bg-amber-500/20";
  if (cat === "wisata kuliner") return "ri-restaurant-2-line text-orange-500 bg-orange-500/20";
  if (cat === "catering") return "ri-bowl-line text-amber-500 bg-amber-500/20";
  if (cat === "info travel") return "ri-bus-2-line text-blue-500 bg-blue-500/20";
  if (cat === "tempat menginap") return "ri-hotel-bed-line text-indigo-500 bg-indigo-500/20";
  if (cat === "wisata buatan") return "ri-building-4-line text-sky-500 bg-sky-500/20";
  if (cat === "wisata situ") return "ri-water-flash-line text-cyan-500 bg-cyan-500/20";
  if (cat === "pusat perbelanjaan") return "ri-shopping-bag-3-line text-pink-500 bg-pink-500/20";
  if (cat === "rumah sakit") return "ri-hospital-line text-red-500 bg-red-500/20";
  return "ri-map-pin-2-line text-emerald-500 bg-emerald-500/20";
};

export default async function CityGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; page?: string | string[]; q?: string | string[] }>;
}) {
  const resolvedParams = await searchParams;
  const requestedCategory = readSingleQueryValue(resolvedParams.category)?.trim().toLowerCase() || "semua";
  const activeCategory = CATEGORY_IDS.has(requestedCategory) ? requestedCategory : "semua";
  const requestedSearch = readSingleQueryValue(resolvedParams.q)?.trim() || "";
  const hasInvalidSearch = Array.from(requestedSearch).length > MAX_SEARCH_LENGTH;
  const searchQuery = hasInvalidSearch ? "" : requestedSearch;
  const { guides: allGuides, hasError } = hasInvalidSearch
    ? { guides: [], hasError: false }
    : await getCityGuides(searchQuery);

  const categories = [
    { id: "semua", label: "Semua", icon: "ri-apps-2-line" },
    { id: "coffee-shop", label: "Coffee Shop", icon: "ri-cup-line" },
    { id: "wisata-kuliner", label: "Wisata Kuliner", icon: "ri-restaurant-2-line" },
    { id: "catering", label: "Catering", icon: "ri-bowl-line" },
    { id: "info-travel", label: "Travel & Transportasi", icon: "ri-bus-2-line" },
    { id: "tempat-menginap", label: "Tempat Menginap", icon: "ri-hotel-bed-line" },
    { id: "wisata-buatan", label: "Wisata Buatan", icon: "ri-building-4-line" },
    { id: "wisata-situ", label: "Wisata Situ", icon: "ri-water-flash-line" },
    { id: "pusat-perbelanjaan", label: "Pusat Perbelanjaan", icon: "ri-shopping-bag-3-line" },
    { id: "rumah-sakit", label: "Rumah Sakit", icon: "ri-hospital-line" },
    { id: "lainnya", label: "Lainnya", icon: "ri-map-pin-2-line" },
  ];
  const filteredGuides = activeCategory === "semua" 
    ? allGuides 
    : allGuides.filter(g => g.category.trim().toLowerCase().replace(/\s+/g, '-') === activeCategory);

  const ITEMS_PER_PAGE = 12;
  const requestedPage = readSingleQueryValue(resolvedParams.page);
  const currentPage = requestedPage && /^\d{1,6}$/.test(requestedPage) ? Number.parseInt(requestedPage, 10) : 1;
  const totalPages = Math.ceil(filteredGuides.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const paginatedGuides = filteredGuides.slice(
    (validPage - 1) * ITEMS_PER_PAGE,
    validPage * ITEMS_PER_PAGE
  );

  const createPageUrl = (pageNumber: number) => {
    return createCityGuideUrl(activeCategory, searchQuery, pageNumber);
  };

  // ACCESSIBILITY: batasi tombol halaman agar pagination tetap ringkas pada viewport mobile.
  const visiblePageNumbers = Array.from(
    new Set([
      1,
      totalPages,
      validPage - 1,
      validPage,
      validPage + 1,
    ].filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)),
  ).sort((left, right) => left - right);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 pt-24 md:pt-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 size-[600px] rounded-full bg-sky-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-400">
            <i className="ri-compass-3-line text-base"></i>
            Depok City Guide
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Jelajahi Kota <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400">Tuan Rumah.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Temukan keindahan budaya, kuliner legendaris, tempat wisata memukau, hingga kenyamanan akomodasi terbaik di Kota Depok selama gelaran PORPROV XV 2026.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="container mb-8" aria-labelledby="city-guide-search-title">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 id="city-guide-search-title" className="sr-only">Cari City Guide</h2>
          <form action="/city-guide" method="get" className="flex flex-col gap-3 sm:flex-row">
            {activeCategory !== "semua" && <input type="hidden" name="category" value={activeCategory} />}
            <label className="relative flex-1" htmlFor="city-guide-search">
              <span className="sr-only">Cari City Guide</span>
              <i className="ri-search-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" aria-hidden="true"></i>
              <input
                id="city-guide-search"
                type="search"
                name="q"
                defaultValue={requestedSearch}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Cari hotel, kuliner, rumah sakit…"
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-7 text-sm font-black text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-sky-500/30">
              Cari
            </button>
            {requestedSearch && (
              <Link href={createCityGuideUrl(activeCategory, "")} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-300/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Hapus
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* Tabs / Filters */}
      <div className="sticky top-[72px] z-20 md:top-[88px] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-y border-slate-200 dark:border-slate-800 py-4 mb-12 shadow-lg">
        <div className="container flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Link 
                key={cat.id}
                href={createCityGuideUrl(cat.id, searchQuery)}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)]" 
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <i className={cat.icon}></i>
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="container">
        {hasInvalidSearch ? (
          <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-16 text-center dark:border-amber-900/60 dark:bg-amber-950/30">
            <i className="ri-search-eye-line text-4xl text-amber-500" aria-hidden="true"></i>
            <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Kata Pencarian Terlalu Panjang</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-400">Gunakan maksimal {MAX_SEARCH_LENGTH} karakter agar pencarian dapat diproses.</p>
          </div>
        ) : hasError ? (
          <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-900/60 dark:bg-red-950/30">
            <i className="ri-error-warning-line text-4xl text-red-500" aria-hidden="true"></i>
            <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">City Guide Belum Dapat Dimuat</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-400">Layanan panduan kota sedang tidak tersedia. Silakan muat ulang halaman beberapa saat lagi.</p>
          </div>
        ) : filteredGuides.length > 0 ? (
          <div>
            <p className="mb-6 text-sm font-semibold text-slate-600 dark:text-slate-400" aria-live="polite">
              {filteredGuides.length} lokasi ditemukan{searchQuery ? <> untuk &quot;<span className="text-slate-900 dark:text-white">{searchQuery}</span>&quot;</> : ""}.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedGuides.map((guide) => (
              <article 
                key={guide.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-sky-500/50 hover:shadow-[0_10px_40px_rgba(56,189,248,0.15)]"
              >
                {/* Image Area */}
                <div className="relative h-56 overflow-hidden">
                  {guide.imageUrl ? (
                    <Image
                      src={guide.imageUrl} 
                      alt={guide.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="size-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <i className="ri-image-line text-4xl text-slate-400 dark:text-slate-600"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-white/50 dark:via-transparent to-transparent opacity-90" />
                  
                  {/* Category Pill */}
                  <div className="absolute left-4 top-4">
                    <span className="inline-block rounded-lg bg-white/90 dark:bg-slate-950/60 backdrop-blur-md px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm">
                      {guide.category}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner -mt-12 relative z-10 backdrop-blur-xl bg-white/50 dark:bg-transparent">
                      <div className={`flex size-full items-center justify-center rounded-xl ${getCategoryIcon(guide.category)}`}>
                        <i className={`text-xl ${getCategoryIcon(guide.category).split(' ')[0]}`}></i>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                      {guide.title}
                    </h2>
                    
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                      {guide.description || guide.address || "Tidak ada deskripsi tersedia."}
                    </p>
                    {guide.category === "Info Travel" && (
                      <p className="mt-3 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {guide.fleetCount} armada{guide.fleetTypes.length > 0 ? ` · ${guide.fleetTypes.join(", ")}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-500 max-w-[60%]">
                      <i className="ri-map-pin-line me-1.5 shrink-0"></i>
                      <span className="truncate">{guide.address || "Depok"}</span>
                    </div>

                    {guide.mapUrl && (
                      <a 
                        href={guide.mapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 focus:outline-none dark:bg-slate-800 dark:text-white dark:hover:bg-sky-500"
                      >
                        Buka Peta
                      </a>
                    )}
                  </div>
                </div>
              </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-start gap-2 overflow-x-auto px-1 pb-2 sm:justify-center" aria-label="Navigasi halaman City Guide">
                <Link
                  href={createPageUrl(validPage - 1)}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${
                    validPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                  aria-disabled={validPage <= 1}
                  aria-label="Halaman City Guide sebelumnya"
                >
                  <i className="ri-arrow-left-s-line text-lg"></i>
                </Link>
                
                {visiblePageNumbers.map((pageNum, index) => {
                  const isActive = pageNum === validPage;
                  return (
                    <div key={pageNum} className="flex shrink-0 items-center gap-2">
                    {index > 0 && pageNum - visiblePageNumbers[index - 1] > 1 && (
                      <span className="px-1 text-slate-400" aria-hidden="true">…</span>
                    )}
                    <Link
                      href={createPageUrl(pageNum)}
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-bold transition ${
                        isActive
                          ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      aria-label={`Halaman City Guide ${pageNum}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNum}
                    </Link>
                    </div>
                  );
                })}

                <Link
                  href={createPageUrl(validPage + 1)}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${
                    validPage >= totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                  aria-disabled={validPage >= totalPages}
                  aria-label="Halaman City Guide berikutnya"
                >
                  <i className="ri-arrow-right-s-line text-lg"></i>
                </Link>
              </nav>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-24 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-6 text-slate-400 dark:text-slate-500">
              <i className="ri-search-eye-line text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Panduan Tidak Ditemukan</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? <>Tidak ada lokasi yang cocok dengan &quot;{searchQuery}&quot; pada kategori ini.</>
                : <>Maaf, belum ada data City Guide untuk kategori &quot;{activeCategory}&quot;. Panitia masih melengkapi panduan ini.</>}
            </p>
            <Link
              href={searchQuery ? createCityGuideUrl(activeCategory, "") : "/city-guide"}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800 px-6 font-bold text-white transition hover:bg-slate-800 dark:hover:bg-slate-700"
            >
              {searchQuery ? "Hapus Pencarian" : "Kembali ke Semua"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
