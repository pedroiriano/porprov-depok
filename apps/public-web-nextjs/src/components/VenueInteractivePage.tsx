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
  const [activeVenue, setActiveVenue] = useState<{latitude: number, longitude: number} | null>(null);

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
    return venues.filter((v) => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [venues, searchQuery]);

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
    } else {
      alert("Venue ini belum memiliki data koordinat lokasi yang valid.");
    }
  };

  return (
    <section className="relative bg-slate-50 dark:bg-slate-950 pb-20 pt-32 md:pb-24 md:pt-40">
      <div className="container relative max-w-[1400px]">
        
        {/* Header Section */}
        <div className="mb-10 text-slate-900 dark:text-white">
          <h1 className="text-4xl font-black tracking-tight uppercase mb-2">Venue & Peta</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Temukan lokasi dari venue resmi PORPROV XV. Jelajahi peta interaktif untuk melihat sebaran lokasi pertandingan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:h-[700px] lg:grid-cols-12">
          
          {/* Left Panel: Search & Scrollable List */}
          <div className="flex h-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[520px] lg:col-span-4 lg:h-full dark:border-slate-800 dark:bg-slate-900">
            
            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  placeholder="Cari venue atau lokasi..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
                  Venue tidak ditemukan.
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
                        href={`/venue/${venue.id}`}
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
      </div>
    </section>
  );
}
