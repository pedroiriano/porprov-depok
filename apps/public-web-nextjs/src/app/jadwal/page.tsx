"use client";

import { useState, useEffect } from "react";
import { Calendar, Filter, Search, MapPin, Clock, Loader2 } from "lucide-react";
import axios from "axios";

export default function Jadwal() {
  const [matches, setMatches] = useState<any[]>([]);
  const [cabors, setCabors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, caborsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/schedule/matches'),
        axios.get('http://localhost:8080/api/v1/master-data/cabors')
      ]);

      const fetchedMatches = matchesRes.data || [];
      setMatches(fetchedMatches);
      setCabors(caborsRes.data || []);

      // Extract unique dates for the date carousel
      const dates = new Set<string>();
      fetchedMatches.forEach((m: any) => {
        if (m.match_time) {
          const dateStr = new Date(m.match_time).toISOString().split('T')[0];
          dates.add(dateStr);
        }
      });
      const sortedDates = Array.from(dates).sort();
      setAvailableDates(sortedDates);

      if (sortedDates.length > 0 && !selectedDate) {
        setSelectedDate(sortedDates[0]);
      }
    } catch (error) {
      console.error("Gagal memuat jadwal:", error);
    } finally {
      setLoading(false);
    }
  };

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
      match.match_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (match.venue_name && match.venue_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDate && matchesSearch;
  });

  // Group matches by Cabor
  const groupedMatches: { [caborId: string]: any[] } = {};
  filteredMatches.forEach(match => {
    if (!groupedMatches[match.cabor_id]) {
      groupedMatches[match.cabor_id] = [];
    }
    groupedMatches[match.cabor_id].push(match);
  });

  const getCaborName = (id: string) => {
    const cabor = cabors.find(c => c.id === id);
    return cabor ? cabor.name : 'Unknown Cabor';
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 hover:border-indigo-700 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />} Refresh
          </button>
        </div>
      </div>

      {loading && matches.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Tidak ada jadwal ditemukan</h3>
                <p className="text-slate-500">Coba ubah tanggal atau kata kunci pencarian Anda.</p>
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
                    {groupedMatches[caborId].map((match: any) => (
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
                                <span className={match.skor_a > match.skor_b ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                                  {match.skor_a}
                                </span>
                                <span className={match.skor_b > match.skor_a ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                                  {match.skor_b}
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
