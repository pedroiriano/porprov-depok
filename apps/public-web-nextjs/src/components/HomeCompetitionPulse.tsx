"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { publicApiUrl, readPgNumber, readResourceId, unwrapCollection } from "@/lib/public-api";
import { normalizeEnrichedMatch, normalizeKontingen, type EnrichedMatch, type RawEnrichedMatch, type RawKontingen } from "@/lib/public-models";

interface LiveScoreRecord {
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

interface RawMedalStanding {
  id?: unknown;
  kontingen_id?: unknown;
  gold?: Parameters<typeof readPgNumber>[0];
  silver?: Parameters<typeof readPgNumber>[0];
  bronze?: Parameters<typeof readPgNumber>[0];
}

interface MedalPreview {
  id: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

const REFRESH_INTERVAL_MS = 30_000;

function formatMatchTime(value: string): string {
  if (!value) return "Waktu menyusul";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu menyusul";
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function HomeCompetitionPulse() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [scores, setScores] = useState<Record<string, LiveScoreRecord>>({});
  const [medals, setMedals] = useState<MedalPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [scheduleResponse, scoreResponse, medalResponse, contingentResponse] = await Promise.all([
        fetch(publicApiUrl("/schedule/matches/enriched"), { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(publicApiUrl("/livescore/public"), { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(publicApiUrl("/medals/standings"), { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(publicApiUrl("/master-data/kontingens"), { cache: "no-store", headers: { Accept: "application/json" } }),
      ]);
      if (!scheduleResponse.ok || !scoreResponse.ok || !medalResponse.ok || !contingentResponse.ok) throw new Error("Sumber ringkasan belum lengkap");
      const normalizedMatches = unwrapCollection<RawEnrichedMatch>(await scheduleResponse.json()).map(normalizeEnrichedMatch);
      normalizedMatches.sort((left, right) => (left.matchDate || "9999").localeCompare(right.matchDate || "9999"));
      const scoreRecords = unwrapCollection<LiveScoreRecord>(await scoreResponse.json());
      const contingentMap = new Map(unwrapCollection<RawKontingen>(await contingentResponse.json()).map(normalizeKontingen).map((item) => [item.id, item.name]));
      const medalRecords = unwrapCollection<RawMedalStanding>(await medalResponse.json()).map((item, index) => {
        const id = readResourceId(item.kontingen_id, `kontingen-${index}`);
        const gold = readPgNumber(item.gold);
        const silver = readPgNumber(item.silver);
        const bronze = readPgNumber(item.bronze);
        return { id: readResourceId(item.id, `medal-${index}`), name: contingentMap.get(id) || "Kontingen PORPROV", gold, silver, bronze, total: gold + silver + bronze };
      });
      medalRecords.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
      setMatches(normalizedMatches);
      setScores(Object.fromEntries(scoreRecords.map((item) => [item.matchId, item])));
      setMedals(medalRecords.slice(0, 3));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadData(), 0);
    const interval = window.setInterval(() => void loadData(), REFRESH_INTERVAL_MS);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [loadData]);

  const highlightedMatches = useMemo(() => {
    const live = matches.filter((match) => scores[match.id] || /berlangsung|live/i.test(match.status));
    const upcoming = matches.filter((match) => !live.includes(match));
    return [...live, ...upcoming].slice(0, 3);
  }, [matches, scores]);

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-24" aria-labelledby="competition-pulse-title">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#38bdf8_0,transparent_28%),radial-gradient(circle_at_80%_80%,#f59e0b_0,transparent_24%)]" aria-hidden="true" />
      <div className="container relative">
        <div className="grid items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-8"><p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">Denyut Pertandingan</p><h2 id="competition-pulse-title" className="mt-3 text-3xl font-black md:text-4xl">Pantau arena dalam satu pandangan.</h2><p className="mt-4 max-w-2xl text-slate-300">Pertandingan aktif dan berikutnya berpadu dengan tiga besar klasemen resmi.</p></div>
          <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end"><Link href="/livescore" className="inline-flex min-h-11 items-center rounded-lg bg-red-600 px-5 font-black text-white hover:bg-red-700"><i className="ri-live-line me-2" aria-hidden="true" />Buka LiveScore</Link><Link href="/jadwal" className="inline-flex min-h-11 items-center rounded-lg border border-white/30 px-5 font-black hover:bg-white hover:text-slate-950">Lihat jadwal</Link></div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-3" aria-label="Memuat ringkasan pertandingan">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-xl bg-white/10" />)}</div>
        ) : error && highlightedMatches.length === 0 && medals.length === 0 ? (
          <div className="mt-10 rounded-xl border border-amber-300/30 bg-amber-500/10 p-8 text-center" role="status"><h3 className="font-black">Ringkasan pertandingan sedang diperbarui</h3><p className="mt-2 text-sm text-slate-300">Jadwal lengkap, LiveScore, dan klasemen tetap tersedia melalui menu utama.</p></div>
        ) : (
          <div className="mt-10 grid gap-7 lg:grid-cols-12">
            <div className="grid gap-5 md:grid-cols-2 lg:col-span-8">
              {highlightedMatches.length > 0 ? highlightedMatches.map((match) => {
                const score = scores[match.id];
                const participants = [...match.participants].sort((a, b) => a.slot - b.slot).slice(0, 2);
                return <article key={match.id} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">{match.caborName}</p><h3 className="mt-2 text-lg font-black">{match.nomorTandingName}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-black ${score ? "bg-red-500 text-white" : "bg-white/10 text-slate-200"}`}>{score?.status || match.status}</span></div><div className="mt-6 space-y-3">{[0, 1].map((index) => <div key={index} className="flex items-center justify-between gap-4"><span className="truncate font-bold">{participants[index]?.display_name || `Peserta ${index === 0 ? "A" : "B"} menunggu`}</span><strong className="text-3xl tabular-nums">{score ? (index === 0 ? score.scoreA : score.scoreB) : "–"}</strong></div>)}</div><div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-300"><span>{formatMatchTime(match.matchDate)}</span><span>{match.venueName}</span></div></article>;
              }) : <div className="rounded-xl border border-dashed border-white/20 p-10 text-center md:col-span-2"><h3 className="font-black">Pertandingan belum dipublikasikan</h3><p className="mt-2 text-sm text-slate-300">Ringkasan muncul otomatis setelah jadwal resmi tersedia.</p></div>}
            </div>
            <aside className="rounded-xl bg-white p-6 text-slate-950 shadow-xl dark:bg-slate-900 dark:text-white lg:col-span-4" aria-labelledby="home-medal-title"><div className="flex items-center justify-between gap-3"><h3 id="home-medal-title" className="text-xl font-black">Tiga besar klasemen</h3><i className="ri-medal-line text-3xl text-amber-500" aria-hidden="true" /></div><ol className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">{medals.length > 0 ? medals.map((item, index) => <li key={item.id} className="flex items-center gap-4 py-4"><span className={`flex size-10 shrink-0 items-center justify-center rounded-full font-black ${index === 0 ? "bg-amber-400 text-slate-950" : "bg-slate-100 dark:bg-slate-800"}`}>{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate">{item.name}</strong><small className="text-slate-500">{item.gold} emas · {item.silver} perak · {item.bronze} perunggu</small></span><strong className="text-xl text-primary-600 dark:text-sky-300">{item.total}</strong></li>) : <li className="py-10 text-center text-slate-500">Klasemen belum tersedia.</li>}</ol><Link href="/medali" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-5 font-black text-white hover:bg-primary-700">Lihat klasemen lengkap</Link></aside>
          </div>
        )}
      </div>
    </section>
  );
}
