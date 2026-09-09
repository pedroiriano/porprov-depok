"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  publicApiUrl,
  readPgNumber,
  readPgText,
  readResourceId,
  resolvePublicAssetUrl,
  safeExternalUrl,
  unwrapCollection,
} from "@/lib/public-api";
import { publicVenuePath } from "@/lib/public-models";
import { PublicPageHero } from "@/components/PublicPageHero";

// Dynamically import the VenueMap to avoid SSR issues with Leaflet
const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <div className="flex flex-col items-center gap-3">
        <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
        <p className="text-sm text-slate-500 font-medium">Memuat Peta...</p>
      </div>
    </div>
  ),
});

interface RawVenue {
  id?: unknown;
  slug?: string;
  name?: string;
  image_url?: Parameters<typeof readPgText>[0];
  address?: Parameters<typeof readPgText>[0];
  latitude?: Parameters<typeof readPgNumber>[0];
  longitude?: Parameters<typeof readPgNumber>[0];
  map_route_url?: Parameters<typeof readPgText>[0];
  capacity?: Parameters<typeof readPgNumber>[0];
  facilities?: Parameters<typeof readPgText>[0];
  readiness_status?: Parameters<typeof readPgText>[0];
  cabor_ids?: unknown[] | null;
}

interface VenueViewModel {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  mapRouteUrl: string;
  capacity: number;
  facilities: string;
  readinessStatus: string;
  caborCount: number;
}

const REFRESH_INTERVAL_MS = 30_000;

function normalizeVenue(venue: RawVenue, index: number): VenueViewModel {
  const name = typeof venue.name === "string" && venue.name.trim() ? venue.name.trim() : "Venue PORPROV";
  
  // Provide fallback coordinate if not available
  const lat = readPgNumber(venue.latitude) || null;
  const lng = readPgNumber(venue.longitude) || null;

  return {
    id: readResourceId(venue.id, `${name}-${index}`),
    slug: venue.slug?.trim() || "",
    name,
    imageUrl: resolvePublicAssetUrl(venue.image_url),
    address: readPgText(venue.address),
    latitude: lat,
    longitude: lng,
    mapRouteUrl: safeExternalUrl(venue.map_route_url),
    capacity: readPgNumber(venue.capacity),
    facilities: readPgText(venue.facilities),
    readinessStatus: readPgText(venue.readiness_status) || "Persiapan",
    caborCount: Array.isArray(venue.cabor_ids) ? venue.cabor_ids.length : 0,
  };
}

export function VenueInteractivePage() {
  const [venues, setVenues] = useState<VenueViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readinessFilter, setReadinessFilter] = useState("");
  const [activeVenue, setActiveVenue] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationNotice, setLocationNotice] = useState("");

  const fetchVenues = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(publicApiUrl("/venues"), {
        signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Gagal mengambil data venue dari server.");
      const json = await res.json();
      const rawItems = unwrapCollection<RawVenue>(json);
      const parsed = rawItems.map(normalizeVenue);
      setVenues(parsed);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err : new Error("Terjadi kesalahan sistem."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialFetchId = window.setTimeout(() => {
      void fetchVenues(controller.signal);
    }, 0);
    
    // Fallback interval polling
    const intervalId = setInterval(() => {
      fetchVenues();
    }, REFRESH_INTERVAL_MS);

    // Realtime SSE Event Stream
    const source = new EventSource(publicApiUrl("/stream/events"));
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { eventType?: string };
        if (payload.eventType && payload.eventType.startsWith("VENUE_")) {
          void fetchVenues();
        }
      } catch {
        // Abaikan payload tidak valid
      }
    };

    return () => {
      controller.abort();
      window.clearTimeout(initialFetchId);
      clearInterval(intervalId);
      source.close();
    };
  }, [fetchVenues]);

  const filteredVenues = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("id");
    return venues.filter((venue) => {
      const queryMatches = !query || `${venue.name} ${venue.address} ${venue.facilities}`.toLocaleLowerCase("id").includes(query);
      return queryMatches && (!readinessFilter || venue.readinessStatus === readinessFilter);
    });
  }, [venues, readinessFilter, searchQuery]);

  const readinessOptions = useMemo(() => Array.from(new Set(venues.map((venue) => venue.readinessStatus))).sort((a, b) => a.localeCompare(b, "id")), [venues]);

  const mappableVenues = useMemo(() => venues.flatMap((venue) => {
    if (venue.latitude === null || venue.longitude === null) return [];
    return [{
      id: venue.id,
      name: venue.name,
      latitude: venue.latitude,
      longitude: venue.longitude,
      address: venue.address,
    }];
  }), [venues]);

  const handleVenueClick = (venue: VenueViewModel) => {
    if (venue.latitude !== null && venue.longitude !== null) {
      setActiveVenue({ latitude: venue.latitude, longitude: venue.longitude });
      setLocationNotice(`Peta diarahkan ke ${venue.name}.`);
    } else {
      setLocationNotice(`${venue.name} belum memiliki koordinat lokasi yang valid.`);
    }
  };

  return (
    <main className="relative bg-slate-50 dark:bg-slate-950">
      <PublicPageHero eyebrow="Arena Pertandingan" title="Venue dan Peta" description="Temukan venue resmi PORPROV XV, periksa kesiapan arena, lalu jelajahi lokasinya melalui peta interaktif." icon="ri-map-pin-2-line" breadcrumbs={[{ label: "Venue" }]} />
      <div className="container relative max-w-[1400px] py-14 md:py-20">

        <div className="grid grid-cols-1 gap-6 lg:h-[700px] lg:grid-cols-12">
          
          {/* Left Panel: Search & Scrollable List */}
          <div className="flex h-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[520px] lg:col-span-4 lg:h-full dark:border-slate-800 dark:bg-slate-900">
            
            {/* Search Input */}
            <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <label className="relative" htmlFor="venue-search">
                <span className="sr-only">Cari venue atau lokasi</span>
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  id="venue-search"
                  type="search"
                  placeholder="Cari venue atau lokasi…"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
              <label htmlFor="venue-readiness" className="sr-only">Filter kesiapan venue</label>
              <select id="venue-readiness" value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="">Semua status kesiapan</option>
                {readinessOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center p-8 text-slate-400">
                  <i className="ri-loader-4-line animate-spin text-2xl"></i>
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl">
                  {error.message}
                </div>
              ) : filteredVenues.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Venue tidak ditemukan. Ubah pencarian atau status kesiapan.
                </div>
              ) : (
                filteredVenues.map((venue) => (
                  <article
                    key={venue.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-primary-500 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-500"
                  >
                    <button
                      type="button"
                      onClick={() => handleVenueClick(venue)}
                      className="group block min-h-11 w-full p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary-500"
                      aria-label={`Tampilkan ${venue.name} pada peta`}
                    >
                      <h3 className="line-clamp-2 text-sm font-black uppercase tracking-wide text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300" title={venue.name}>{venue.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {venue.caborCount} Cabor
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Kapasitas {venue.capacity || "-"}
                        </span>
                      </div>
                    </button>
                    <div className="border-t border-slate-100 px-3 dark:border-slate-800">
                      <Link
                        href={publicVenuePath(venue)}
                        className="flex min-h-11 items-center justify-between text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
                      >
                        Detail venue <i className="ri-arrow-right-s-line text-base" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Map */}
          <div className="relative z-0 h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:h-[520px] lg:col-span-8 lg:h-full dark:border-slate-700 dark:bg-slate-800">
            <VenueMap venues={mappableVenues} activeVenue={activeVenue} />
          </div>

        </div>
        <p className="sr-only" aria-live="polite">{locationNotice}</p>
      </div>
    </main>
  );
}
