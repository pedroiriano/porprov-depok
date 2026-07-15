"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Calendar, Filter, Search, MapPin, Clock, Loader2 } from "lucide-react";
import axios from "axios";
import { publicApiUrl, readPgText, readPgTimestamp, readResourceId, unwrapCollection } from "@/lib/public-api";

interface Match {
  id: string;
  match_time?: string | null;
  match_name: string;
  venue_name?: string | null;
  cabor_id: string;
  peserta_a?: string | null;
  peserta_b?: string | null;
  skor_a?: number | null;
  skor_b?: number | null;
  status?: string | null;
}

interface Cabor {
  id: string;
  name: string;
}

interface RawMatch {
  id?: unknown;
  match_time?: Parameters<typeof readPgTimestamp>[0];
  match_date?: Parameters<typeof readPgTimestamp>[0];
  match_name?: string | null;
  round?: string | null;
  venue_name?: string | null;
  cabor_id?: unknown;
  peserta_a?: string | null;
  peserta_b?: string | null;
  skor_a?: number | null;
  skor_b?: number | null;
  status?: string | null;
}

function normalizeMatch(raw: RawMatch, index: number): Match {
  const matchTime = readPgTimestamp(raw.match_time) || readPgTimestamp(raw.match_date);
  const round = readPgText(raw.round);
  return {
    id: readResourceId(raw.id, `match-${index}`),
    match_time: matchTime || null,
    match_name: raw.match_name?.trim() || round || "Pertandingan PORPROV",
    venue_name: raw.venue_name?.trim() || null,
    cabor_id: readResourceId(raw.cabor_id, "lainnya"),
    peserta_a: raw.peserta_a,
    peserta_b: raw.peserta_b,
    skor_a: raw.skor_a,
    skor_b: raw.skor_b,
    status: raw.status,
  };
}

export default function Jadwal() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [matchesRes, caborsRes] = await Promise.all([
        axios.get<unknown>(publicApiUrl("/schedule/matches")),
        axios.get<unknown>(publicApiUrl("/master-data/cabors")),
      ]);

      const fetchedMatches = unwrapCollection<RawMatch>(matchesRes.data).map(normalizeMatch);
      setMatches(fetchedMatches);
      setCabors(unwrapCollection<Cabor>(caborsRes.data));

      // Extract unique dates for the date carousel
      const dates = new Set<string>();
      fetchedMatches.forEach((match) => {
        if (match.match_time) {
          const dateStr = new Date(match.match_time).toISOString().split("T")[0];
          dates.add(dateStr);
        }
      });
      const sortedDates = Array.from(dates).sort();
      setAvailableDates(sortedDates);

      setSelectedDate((currentDate) => currentDate ?? sortedDates[0] ?? null);
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setError(status === 401
        ? "Akses data jadwal publik ditolak oleh API Gateway. Restart API Gateway setelah pembaruan route publik."
        : "Jadwal belum dapat dimuat. Periksa API Gateway dan Schedule Service, lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(initialTimer);
  }, [fetchData]);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  };

  const getShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Filter matches based on search query and selected date
  const filteredMatches = matches.filter(match => {
    const matchDateStr = match.match_time ? new Date(match.match_time).toISOString().split('T')[0] : null;
    const matchesDate = !selectedDate || matchDateStr === selectedDate;

    const matchesSearch =
      (match.match_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (match.venue_name && match.venue_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDate && matchesSearch;
  });

  // Group matches by Cabor
  const groupedMatches: Record<string, Match[]> = {};
  filteredMatches.forEach(match => {
    if (!groupedMatches[match.cabor_id]) {
      groupedMatches[match.cabor_id] = [];
    }
    groupedMatches[match.cabor_id].push(match);
  });

  const getCaborName = (id: string) => {
    const cabor = cabors.find(c => c.id === id);
    return cabor ? cabor.name : 'Pertandingan Lainnya';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Jadwal Pertandingan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Filter dan pantau jadwal dari berbagai Cabang Olahraga.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text" 
              placeholder="Cari nomor tanding, venue..."
              aria-label="Cari jadwal berdasarkan nomor tanding atau venue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            aria-label="Perbarui data jadwal"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 hover:border-indigo-700 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Filter className="w-4 h-4" aria-hidden="true" />} Perbarui
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">Pembaruan jadwal tertunda</p>
            <p className="mt-1 text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="flex justify-center py-20" role="status" aria-label="Memuat jadwal pertandingan">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" aria-hidden="true" />
        </div>
      ) : (
        <>
          {/* Date Carousel (Horizontal scroll) */}
          <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide">
            <button
              onClick={() => setSelectedDate(null)}
              className={`flex-none flex flex-col items-center justify-center px-6 py-3 rounded-md border transition-all duration-500 ${
                selectedDate === null
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-600"
              }`}
            >
              <span className={`text-xs font-medium mb-1 ${selectedDate === null ? "text-indigo-100" : "text-slate-400"}`}>
                Semua
              </span>
              <span className="font-bold whitespace-nowrap">Tanggal</span>
            </button>

            {availableDates.map((dateStr, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-none flex flex-col items-center justify-center px-6 py-3 rounded-md border transition-all duration-500 ${
                  selectedDate === dateStr
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-600"
                }`}
              >
                <span className={`text-xs font-medium mb-1 ${selectedDate === dateStr ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                  {getDayName(dateStr)}
                </span>
                <span className="font-bold whitespace-nowrap">{getShortDate(dateStr)}</span>
              </button>
            ))}
          </div>

          {/* Schedule List */}
          <div className="flex flex-col gap-8">
            {Object.keys(groupedMatches).length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{matches.length === 0 ? "Jadwal belum dipublikasikan" : "Tidak ada jadwal ditemukan"}</h3>
                <p className="text-slate-500">{matches.length === 0 ? "Data akan tampil setelah jadwal pertandingan disahkan oleh panitia." : "Coba ubah tanggal atau kata kunci pencarian Anda."}</p>
              </div>
            ) : (
              Object.keys(groupedMatches).map(caborId => (
                <div key={caborId} className="flex flex-col gap-3">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <div className="w-8 h-8 rounded-md bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-lg">
                      {getCaborName(caborId).charAt(0)}
                    </div>
                    {getCaborName(caborId)}
                  </h2>

                  <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 rounded-md shadow dark:shadow-gray-800">
                    {groupedMatches[caborId].map((match) => (
                      <div key={match.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Time & Status */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:w-32 shrink-0 border-b sm:border-b-0 border-slate-100 dark:border-slate-800 pb-3 sm:pb-0">
                          <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold">
                            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            {match.match_time ? new Date(match.match_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : 'TBA'}
                          </div>
                          {match.status === 'live' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wider animate-pulse-subtle">Live</span>
                          ) : match.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">Selesai</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">{match.status || 'Upcoming'}</span>
                          )}
                        </div>

                        {/* Match Details */}
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{match.match_name}</div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-md border border-slate-100 dark:border-slate-800/50">
                            <div className="flex flex-col gap-2 flex-1">
                              {/* Peserta A */}
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <span className="font-semibold text-sm">{match.peserta_a || 'Menunggu Lawan'}</span>
                              </div>
                              {/* Peserta B */}
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <span className="font-semibold text-sm">{match.peserta_b || 'Menunggu Lawan'}</span>
                              </div>
                            </div>

                            {/* Score if completed or live */}
                            {(match.status === 'live' || match.status === 'completed') && (
                              <div className="flex flex-col gap-2 shrink-0 text-right font-mono font-bold text-lg border-l border-slate-200 dark:border-slate-700 pl-4">
                                <span className={(match.skor_a ?? 0) > (match.skor_b ?? 0) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                                  {match.skor_a ?? 0}
                                </span>
                                <span className={(match.skor_b ?? 0) > (match.skor_a ?? 0) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                                  {match.skor_b ?? 0}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="w-3 h-3" /> {match.venue_name || 'Venue TBA'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
