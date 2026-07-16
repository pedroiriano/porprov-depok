"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  publicApiUrl,
  readPgNumber,
  readPgText,
  readResourceId,
  resolvePublicAssetUrl,
  safeExternalUrl,
  unwrapCollection,
} from "@/lib/public-api";

interface RawVenue {
  id?: unknown;
  name?: string;
  image_url?: Parameters<typeof readPgText>[0];
  address?: Parameters<typeof readPgText>[0];
  map_route_url?: Parameters<typeof readPgText>[0];
  capacity?: Parameters<typeof readPgNumber>[0];
  facilities?: Parameters<typeof readPgText>[0];
  readiness_status?: Parameters<typeof readPgText>[0];
  cabor_ids?: unknown[] | null;
}

interface VenueViewModel {
  id: string;
  name: string;
  imageUrl: string;
  address: string;
  mapRouteUrl: string;
  capacity: number;
  facilities: string;
  readinessStatus: string;
  caborCount: number;
}

interface VenueShowcaseProps {
  displayMode?: "home" | "page";
}

const REFRESH_INTERVAL_MS = 30_000;

function normalizeVenue(venue: RawVenue, index: number): VenueViewModel {
  const name = typeof venue.name === "string" && venue.name.trim() ? venue.name.trim() : "Venue PORPROV";
  return {
    id: readResourceId(venue.id, `${name}-${index}`),
    name,
    imageUrl: resolvePublicAssetUrl(venue.image_url),
    address: readPgText(venue.address),
    mapRouteUrl: safeExternalUrl(venue.map_route_url),
    capacity: readPgNumber(venue.capacity),
    facilities: readPgText(venue.facilities),
    readinessStatus: readPgText(venue.readiness_status) || "Persiapan",
    caborCount: Array.isArray(venue.cabor_ids) ? venue.cabor_ids.length : 0,
  };
}

export function VenueShowcase({ displayMode = "home" }: VenueShowcaseProps) {
  const itemsPerPage = displayMode === "page" ? 8 : 4;
  const [venues, setVenues] = useState<VenueViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVenues = useCallback(async (silent = false) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOnline(false);
      setError("Perangkat sedang offline. Data akan diperbarui saat koneksi kembali.");
      setLoading(false);
      return;
    }

    setOnline(true);
    setError("");
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(publicApiUrl("/venues"), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`API Gateway merespons ${response.status}`);
      }

      const payload: unknown = await response.json();
      const records = unwrapCollection<RawVenue>(payload).map(normalizeVenue);
      setVenues(records);
      setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(records.length / itemsPerPage))));
      setLastUpdated(new Date());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Kesalahan tidak dikenal";
      setError(`Data venue belum dapat diperbarui. ${message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    // PERFORMANCE: Menunda perubahan state awal ke task berikutnya agar effect hanya mengatur sinkronisasi eksternal.
    const initialTimer = window.setTimeout(() => void fetchVenues(false), 0);

    const interval = window.setInterval(() => void fetchVenues(true), REFRESH_INTERVAL_MS);
    const refreshOnFocus = () => void fetchVenues(true);
    const handleOffline = () => {
      setOnline(false);
      setError("Perangkat sedang offline. Data terakhir tetap ditampilkan.");
    };

    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("online", refreshOnFocus);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("online", refreshOnFocus);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchVenues]);

  const totalPages = Math.max(1, Math.ceil(venues.length / itemsPerPage));
  const visibleVenues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return venues.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, venues]);

  const paginate = (pageNumber: number) => {
    setCurrentPage(Math.min(Math.max(pageNumber, 1), totalPages));
    document.getElementById("venue-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isPage = displayMode === "page";

  return (
    <section id="venue-section" className={`relative scroll-mt-24 ${isPage ? "pb-20 pt-32 md:pb-24 md:pt-40" : "py-16 md:py-24"}`} aria-labelledby="venue-heading">
      <div className="container relative">
        <div className="flex flex-col items-center justify-center text-center gap-6 mb-8 md:mb-12">
          <div className="max-w-3xl mx-auto">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-primary-500">Data Langsung dari Panitia</p>
            {isPage ? (
              <h1 id="venue-heading" className="text-3xl font-black tracking-tight md:text-5xl">Venue & Lokasi Pertandingan</h1>
            ) : (
              <h2 id="venue-heading" className="text-3xl font-black tracking-tight md:text-4xl">Arena para juara bertanding.</h2>
            )}
            <p className="mt-4 mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Informasi alamat, kapasitas, fasilitas, cabang olahraga, dan kesiapan venue diperbarui melalui API Gateway PORPROV.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3" role="status" aria-live="polite">
            <span className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${online && !error ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
              <span className={`size-2.5 rounded-full ${online && !error ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
              {online && !error ? "Terhubung live" : online ? "Koneksi terganggu" : "Offline"}
            </span>
            <button type="button" onClick={() => void fetchVenues(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold transition hover:border-primary-500 hover:text-primary-500 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-900" aria-label="Perbarui data venue sekarang">
              <i className={`ri-refresh-line me-2 text-lg ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Perbarui data"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" role="alert">
            <i className="ri-wifi-off-line mt-0.5 text-xl" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-bold">Pembaruan venue tertunda</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-4" aria-label="Memuat data venue">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="h-56 animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-500/10 text-3xl text-primary-500"><i className="ri-map-pin-line" aria-hidden="true" /></span>
            <h3 className="mt-5 text-xl font-black">Data venue belum tersedia</h3>
            <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">Panitia sedang menyiapkan informasi arena pertandingan. Gunakan tombol perbarui untuk mencoba kembali.</p>
            <button type="button" onClick={() => void fetchVenues(false)} className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary-500 px-5 py-3 font-bold text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500">Coba lagi</button>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
              {visibleVenues.map((venue) => (
                <article id={venue.id} key={venue.id} className="group flex min-h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700">
                  <div className="relative h-56 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400" aria-hidden="true"><i className="ri-map-pin-fill text-6xl" /></div>
                    {venue.imageUrl && (
                      // PERFORMANCE: URL Media Library bersifat runtime; native image menghindari daftar hostname build-time yang rapuh.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={venue.imageUrl} alt={`Venue ${venue.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" aria-hidden="true" />
                    <span className="absolute end-4 top-4 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md">{venue.readinessStatus}</span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl font-black leading-snug">{venue.name}</h3>
                    <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      <i className="ri-map-pin-line mt-0.5 shrink-0 text-base text-primary-500" aria-hidden="true" />
                      {venue.address || "Alamat sedang dilengkapi panitia"}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 dark:border-slate-800">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Kapasitas</dt>
                        <dd className="mt-1 font-black">{venue.capacity > 0 ? new Intl.NumberFormat("id-ID").format(venue.capacity) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Cabor</dt>
                        <dd className="mt-1 font-black">{venue.caborCount > 0 ? `${venue.caborCount} cabang` : "Menunggu"}</dd>
                      </div>
                    </dl>

                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{venue.facilities || "Informasi fasilitas sedang diverifikasi."}</p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <Link href={`/venue/${encodeURIComponent(venue.id)}`} className="inline-flex min-h-11 items-center text-sm font-black text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                        Detail venue <i className="ri-arrow-right-line ms-1 transition group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                      {venue.mapRouteUrl && (
                        <a href={venue.mapRouteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:border-primary-500 hover:bg-primary-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700" aria-label={`Buka rute menuju ${venue.name}`}>
                          <i className="ri-direction-line" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Menampilkan {visibleVenues.length} dari {venues.length} venue · pembaruan otomatis setiap 30 detik</p>
              <div className="flex items-center gap-2" aria-label="Navigasi halaman venue">
                <button type="button" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="inline-flex size-11 items-center justify-center rounded-full border border-slate-300 transition hover:border-primary-500 hover:bg-primary-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700" aria-label="Halaman venue sebelumnya"><i className="ri-arrow-left-s-line text-xl" aria-hidden="true" /></button>
                <span className="min-w-28 text-center text-sm font-bold">Halaman {currentPage} / {totalPages}</span>
                <button type="button" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="inline-flex size-11 items-center justify-center rounded-full border border-slate-300 transition hover:border-primary-500 hover:bg-primary-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700" aria-label="Halaman venue berikutnya"><i className="ri-arrow-right-s-line text-xl" aria-hidden="true" /></button>
              </div>
            </div>

            {!isPage && (
              <div className="mt-10 text-center">
                <Link href="/venue" className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary-500 px-5 py-3 font-black text-primary-500 transition hover:bg-primary-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500">Lihat semua venue <i className="ri-arrow-right-line ms-2" aria-hidden="true" /></Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
