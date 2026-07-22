"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Clock, Loader2, MapPin, Radio } from "lucide-react";
import { publicApiUrl, unwrapCollection } from "@/lib/public-api";
import { normalizeEnrichedMatch, type EnrichedMatch, type RawEnrichedMatch } from "@/lib/public-models";

interface LiveScoreUpdate {
  eventVersion?: string;
  eventId?: string;
  eventType?: string;
  sequence?: number;
  timestamp?: string;
  actor?: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

export default function LiveScorePage() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [scores, setScores] = useState<Record<string, LiveScoreUpdate>>({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flashCard, setFlashCard] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [matchResponse, scoreResponse] = await Promise.all([
        fetch(publicApiUrl("/schedule/matches/enriched"), { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(publicApiUrl("/livescore/public"), { cache: "no-store", headers: { Accept: "application/json" } }),
      ]);
      if (!matchResponse.ok || !scoreResponse.ok) throw new Error(`API Gateway merespons ${matchResponse.status}/${scoreResponse.status}`);
      setMatches(unwrapCollection<RawEnrichedMatch>(await matchResponse.json()).map(normalizeEnrichedMatch));
      const persistedScores = unwrapCollection<LiveScoreUpdate>(await scoreResponse.json());
      setScores(Object.fromEntries(persistedScores.map((item) => [item.matchId, item])));
    } catch (cause) {
      setError(`Pertandingan aktif belum dapat dimuat. ${cause instanceof Error ? cause.message : "Periksa service terkait."}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMatches(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMatches]);

  useEffect(() => {
    const eventSource = new EventSource(publicApiUrl("/stream/events"));
    eventSource.onopen = () => setConnected(true);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<LiveScoreUpdate>;
        const supportedEvent = !data.eventType || data.eventType === "LIVESCORE_UPDATED" || data.eventType === "LIVESCORE_CORRECTED";
        if (typeof data.matchId !== "string" || !data.matchId || !supportedEvent) return;
        const update: LiveScoreUpdate = {
          eventVersion: data.eventVersion,
          eventId: data.eventId,
          eventType: data.eventType,
          sequence: typeof data.sequence === "number" ? data.sequence : undefined,
          timestamp: data.timestamp,
          actor: data.actor,
          matchId: data.matchId,
          scoreA: typeof data.scoreA === "number" ? data.scoreA : 0,
          scoreB: typeof data.scoreB === "number" ? data.scoreB : 0,
          status: typeof data.status === "string" && data.status ? data.status : "Berlangsung",
        };
        setScores((current) => ({ ...current, [update.matchId]: update }));
        setFlashCard(update.matchId);
        if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(() => setFlashCard(null), 1000);
      } catch {
        // INFO: Event domain lain sengaja diabaikan.
      }
    };
    eventSource.onerror = () => setConnected(false);
    return () => {
      eventSource.close();
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 md:py-40 lg:px-8">
      <header className="mb-10 flex w-full flex-col items-center gap-5 text-center">
        <div><div className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[3rem_auto_3rem] sm:items-center"><span className={`flex size-12 items-center justify-center rounded-full ${connected ? "bg-red-100 text-red-500 shadow-[0_0_18px_rgba(239,68,68,0.25)] dark:bg-red-950" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`} aria-hidden="true"><Activity className={`size-5 ${connected ? "animate-pulse" : ""}`} /></span><div><p className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Pusat Pertandingan</p><h1 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">LiveScore</h1></div><span className="hidden size-12 sm:block" aria-hidden="true" /></div><p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Skor, peserta, ronde, dan venue dalam satu aliran data resmi.</p></div>
        <div className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"}`} role="status" aria-live="polite"><Radio className={`size-4 ${connected ? "animate-pulse" : ""}`} aria-hidden="true" />{connected ? "Realtime terhubung" : "Menghubungkan realtime"}</div>
      </header>

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><h2 className="font-black">Pembaruan pertandingan tertunda</h2><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => void loadMatches()} className="mt-3 min-h-11 rounded-xl bg-amber-900 px-4 text-sm font-black text-white">Coba lagi</button></div></div>}

      {loading ? <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary-500" aria-hidden="true" /><span className="sr-only">Memuat LiveScore</span></div> : matches.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700"><Activity className="mx-auto size-12 text-primary-500" aria-hidden="true" /><h2 className="mt-5 text-xl font-black">Belum ada pertandingan aktif</h2><p className="mt-2 text-slate-500">LiveScore muncul otomatis setelah jadwal dipublikasikan.</p></div> : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
          <div className="space-y-5">{matches.map((match) => {
            const live = scores[match.id];
            const participants = match.participants.slice(0, 2);
            const teams = participants.length ? participants.map((item) => item.display_name) : ["Peserta menunggu konfirmasi", "Lawan menunggu konfirmasi"];
            const scoreValues = [live?.scoreA, live?.scoreB];
            return <article key={match.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-500 dark:bg-slate-900 ${live ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-800"} ${flashCard === match.id ? "scale-[1.01] shadow-lg ring-2 ring-amber-300" : ""}`}>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"><div><p className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-300">{match.caborName}</p><p className="mt-1 text-sm font-bold">{match.nomorTandingName} · {match.round}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${live ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{live?.status || match.status}</span></header>
              <div className="space-y-4 p-5 sm:p-6">{teams.map((team, index) => <div key={`${match.id}-${index}`} className="flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-500/10 font-black text-primary-600">{team.charAt(0)}</span><span className="truncate font-black">{team}</span></div><span className="text-4xl font-black tabular-nums">{scoreValues[index] ?? "–"}</span></div>)}<div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800"><span className="flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />{match.matchDate ? new Date(match.matchDate).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Waktu menyusul"}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{match.venueId ? <Link href={`/venue/${encodeURIComponent(match.venueId)}`} className="hover:text-primary-600">{match.venueName}</Link> : match.venueName}</span>{live?.sequence !== undefined && <span>Event #{live.sequence}{live.timestamp ? ` · ${new Date(live.timestamp).toLocaleTimeString("id-ID")}` : ""}</span>}</div></div>
            </article>;
          })}</div>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-black"><Activity className="size-4 text-primary-500" aria-hidden="true" />Integritas data</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Pertandingan</dt><dd className="font-black">{matches.length}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Update skor</dt><dd className="font-black">{Object.keys(scores).length}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Transport</dt><dd className="font-black">SSE + JetStream</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Koneksi</dt><dd className={connected ? "font-black text-emerald-700 dark:text-emerald-400" : "font-black text-amber-700 dark:text-amber-400"}>{connected ? "Terhubung" : "Mencoba ulang"}</dd></div></dl></aside>
        </div>
      )}
    </main>
  );
}
