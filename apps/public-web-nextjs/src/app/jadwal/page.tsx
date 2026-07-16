"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Loader2, RefreshCw, Search } from "lucide-react";
import { ScheduleMatchCard } from "@/components/ScheduleMatchCard";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeEnrichedMatch, type EnrichedMatch, type RawEnrichedMatch } from "@/lib/public-models";

function localDateKey(timestamp: string): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function JadwalPage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [cabor, setCabor] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState("");

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(publicApiUrl("/schedule/matches/enriched"), { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`API Gateway merespons ${response.status}`);
      const data = unwrapCollection<RawEnrichedMatch>(await response.json()).map(normalizeEnrichedMatch);
      data.sort((left, right) => (left.matchDate || "9999").localeCompare(right.matchDate || "9999"));
      setMatches(data);
      setLastUpdated(new Date());
    } catch (cause) {
      setError(`Jadwal belum dapat dimuat. ${cause instanceof Error ? cause.message : "Periksa service terkait."}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMatches(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMatches]);

  const options = useMemo(() => ({
    dates: [...new Set(matches.map((match) => localDateKey(match.matchDate)).filter(Boolean))].sort(),
    cabors: [...new Map(matches.filter((match) => match.caborId).map((match) => [match.caborId, match.caborName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "id")),
    venues: [...new Map(matches.filter((match) => match.venueId).map((match) => [match.venueId, match.venueName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "id")),
    statuses: [...new Set(matches.map((match) => match.status).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id")),
  }), [matches]);

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id");
    return matches.filter((match) => {
      const searchable = [match.caborName, match.nomorTandingName, match.round, match.venueName, ...match.participants.map((item) => item.display_name)].join(" ").toLocaleLowerCase("id");
      return (!query || searchable.includes(query)) && (!date || localDateKey(match.matchDate) === date) && (!cabor || match.caborId === cabor) && (!venue || match.venueId === venue) && (!status || match.status === status);
    });
  }, [cabor, date, matches, search, status, venue]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, EnrichedMatch[]>();
    for (const match of filteredMatches) groups.set(match.caborName, [...(groups.get(match.caborName) || []), match]);
    return [...groups.entries()];
  }, [filteredMatches]);

  const resetFilters = () => { setSearch(""); setDate(""); setCabor(""); setVenue(""); setStatus(""); };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 md:py-40 lg:px-8">
      <header className="flex flex-col items-center text-center gap-5 mb-8">
        <div className="max-w-3xl mx-auto"><p className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Agenda Resmi</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Jadwal Pertandingan</h1><p className="mt-4 mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">Telusuri jadwal berdasarkan tanggal, cabor, venue, dan status pertandingan.</p></div>
        <div className="flex flex-wrap justify-center items-center gap-3 mt-2"><span className="text-sm text-slate-500" role="status" aria-live="polite">{lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Menunggu data"}</span><button type="button" onClick={() => void loadMatches()} disabled={loading} className="inline-flex min-h-11 items-center rounded-xl bg-primary-500 px-4 font-black text-white hover:bg-primary-600 disabled:opacity-60"><RefreshCw className={`me-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />Perbarui</button></div>
      </header>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="filter-title">
        <div className="flex items-center justify-between gap-3"><h2 id="filter-title" className="font-black">Filter jadwal</h2><button type="button" onClick={resetFilters} className="min-h-11 px-3 text-sm font-bold text-primary-600 hover:text-primary-700">Reset filter</button></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-1"><span className="sr-only">Cari jadwal</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cabor, peserta, venue..." className="min-h-11 w-full rounded-xl border border-slate-300 bg-transparent pl-10 pr-3 dark:border-slate-700" /></label>
          <label><span className="sr-only">Tanggal</span><select value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Semua tanggal</option>{options.dates.map((item) => <option key={item} value={item}>{new Date(`${item}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</option>)}</select></label>
          <label><span className="sr-only">Cabang olahraga</span><select value={cabor} onChange={(event) => setCabor(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Semua cabor</option>{options.cabors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label><span className="sr-only">Venue</span><select value={venue} onChange={(event) => setVenue(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Semua venue</option>{options.venues.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label><span className="sr-only">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><option value="">Semua status</option>{options.statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </section>

      {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><h2 className="font-black">Pembaruan jadwal tertunda</h2><p className="mt-1 text-sm">{error}</p></div></div>}
      {loading && matches.length === 0 ? <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary-500" aria-hidden="true" /><span className="sr-only">Memuat jadwal</span></div> : groupedMatches.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-14 text-center dark:border-slate-700"><Calendar className="mx-auto size-12 text-slate-300" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">{matches.length ? "Tidak ada jadwal yang cocok" : "Jadwal belum dipublikasikan"}</h2><p className="mt-2 text-slate-500">{matches.length ? "Coba ubah atau reset filter Anda." : "Jadwal akan tampil setelah disahkan panitia."}</p></div> : <div className="mt-10 space-y-10">{groupedMatches.map(([caborName, items]) => <section key={caborName} aria-labelledby={`schedule-${items[0].caborId}`}><div className="flex items-center justify-between gap-4"><h2 id={`schedule-${items[0].caborId}`} className="text-2xl font-black">{caborName}</h2><span className="text-sm font-bold text-slate-500">{items.length} pertandingan</span></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{items.map((match) => <ScheduleMatchCard key={match.id} match={match} compact />)}</div></section>)}</div>}
    </main>
  );
}
