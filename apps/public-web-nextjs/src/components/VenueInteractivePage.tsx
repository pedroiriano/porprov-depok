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
    fetchVenues(controller.signal);
    
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

  const handleVenueClick = (venue: VenueViewModel) => {
    if (venue.latitude && venue.longitude) {
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
          
          {/* Left Panel: Search & Scrollable List */}
          <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full">
            
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
                  <div
                    key={venue.id}
                    onClick={() => handleVenueClick(venue)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-sm cursor-pointer transition-all bg-white dark:bg-slate-900 group"
                  >
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide line-clamp-1" title={venue.name}>{venue.name}</h3>
                    
                    {/* Tags / Badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {venue.caborCount} CABOR
                      </span>
                      <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        KAPASITAS {venue.capacity || "-"}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link 
                        href={`/venue/${venue.id}`} 
                        className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()} // Prevent trigger map click
                      >
                        Detail venue <i className="ri-arrow-right-s-line"></i>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Map */}
          <div className="lg:col-span-8 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative z-0">
            <VenueMap venues={venues.filter(v => v.latitude && v.longitude) as any} activeVenue={activeVenue} />
          </div>

        </div>
      </div>
    </section>
  );
}
