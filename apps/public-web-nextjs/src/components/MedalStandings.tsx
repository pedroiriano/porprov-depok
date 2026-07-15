"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Medal, Radio, RefreshCw, Trophy } from "lucide-react";
import { publicApiUrl, readPgNumber, readResourceId, unwrapCollection } from "@/lib/public-api";
import { normalizeKontingen, type RawKontingen } from "@/lib/public-models";

interface RawMedalStanding {
  id?: unknown;
  kontingen_id?: unknown;
  gold?: Parameters<typeof readPgNumber>[0];
  silver?: Parameters<typeof readPgNumber>[0];
  bronze?: Parameters<typeof readPgNumber>[0];
}

interface Standing {
  id: string;
  name: string;
  logoUrl: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

const POLL_INTERVAL_MS = 30_000;

export function MedalStandings() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStandings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [medalsResponse, contingentsResponse] = await Promise.all([
        fetch(publicApiUrl("/medals/standings"), { cache: "no-store" }),
        fetch(publicApiUrl("/master-data/kontingens"), { cache: "no-store" }),
      ]);
      if (!medalsResponse.ok || !contingentsResponse.ok) throw new Error(`API merespons ${medalsResponse.status}/${contingentsResponse.status}`);
      const contingents = unwrapCollection<RawKontingen>(await contingentsResponse.json()).map(normalizeKontingen);
      const contingentMap = new Map(contingents.map((item) => [item.id, item]));
      const data = unwrapCollection<RawMedalStanding>(await medalsResponse.json()).map((item, index) => {
        const kontingenId = readResourceId(item.kontingen_id, `kontingen-${index}`);
        const kontingen = contingentMap.get(kontingenId);
        const gold = readPgNumber(item.gold);
        const silver = readPgNumber(item.silver);
        const bronze = readPgNumber(item.bronze);
        return { id: readResourceId(item.id, `standing-${index}`), name: kontingen?.name || "Kontingen PORPROV", logoUrl: kontingen?.logoUrl || "", gold, silver, bronze, total: gold + silver + bronze };
      });
      data.sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.name.localeCompare(b.name, "id"));
      setStandings(data);
      setLastUpdated(new Date());
    } catch (cause) {
      setError(`Klasemen belum dapat dimuat. ${cause instanceof Error ? cause.message : "Periksa service terkait."}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadStandings(), 0);
    const poll = window.setInterval(() => void loadStandings(true), POLL_INTERVAL_MS);
    const source = new EventSource(publicApiUrl("/stream/events"));
    source.onopen = () => setConnected(true);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { eventType?: string };
        if (payload.eventType === "MEDAL_STANDING_UPDATED") void loadStandings(true);
      } catch {
        // INFO: Payload SSE yang tidak valid tidak menggantikan data terakhir.
      }
    };
    source.onerror = () => setConnected(false);
    return () => { window.clearTimeout(initial); window.clearInterval(poll); source.close(); };
  }, [loadStandings]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 md:py-40 lg:px-8">
      <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"><Trophy className="size-5" aria-hidden="true" /></span><div><p className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Prestasi Kontingen</p><h1 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">Klasemen Medali</h1></div></div><p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Urutan resmi berdasarkan emas, perak, lalu perunggu.</p></div><div className="flex flex-wrap items-center gap-3"><span className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black ${connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"}`} role="status"><Radio className={`size-4 ${connected ? "animate-pulse" : ""}`} aria-hidden="true" />{connected ? "Realtime terhubung" : "Polling aktif"}</span><button type="button" onClick={() => void loadStandings()} disabled={loading} className="inline-flex min-h-11 items-center rounded-xl bg-primary-500 px-4 font-black text-white hover:bg-primary-600 disabled:opacity-60"><RefreshCw className={`me-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />Perbarui</button></div></header>

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><h2 className="font-black">Pembaruan klasemen tertunda</h2><p className="mt-1 text-sm">{error}</p></div></div>}
      {loading && standings.length === 0 ? <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary-500" aria-hidden="true" /><span className="sr-only">Memuat klasemen</span></div> : standings.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700"><Medal className="mx-auto size-12 text-amber-500" aria-hidden="true" /><h2 className="mt-5 text-xl font-black">Klasemen belum tersedia</h2><p className="mt-2 text-slate-500">Data tampil setelah medali pertama disahkan panitia.</p></div> : <>
        <section className="mb-8 grid gap-5 md:grid-cols-3" aria-label="Tiga besar klasemen">{standings.slice(0, 3).map((item, index) => <article key={item.id} className={`rounded-2xl border p-6 shadow-sm ${index === 0 ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}><p className="text-xs font-black uppercase tracking-wider text-slate-500">Peringkat {index + 1}</p><h2 className="mt-3 text-xl font-black">{item.name}</h2><p className="mt-4 text-3xl font-black text-amber-600">{item.total} <span className="text-sm text-slate-500">medali</span></p></article>)}</section>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left"><caption className="sr-only">Klasemen perolehan medali kontingen PORPROV XV Jawa Barat 2026</caption><thead><tr className="border-b border-slate-200 bg-slate-100 text-sm uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40"><th className="p-5 text-center" scope="col">Peringkat</th><th className="p-5" scope="col">Kontingen</th><th className="p-5 text-center" scope="col">Emas</th><th className="p-5 text-center" scope="col">Perak</th><th className="p-5 text-center" scope="col">Perunggu</th><th className="p-5 text-center" scope="col">Total</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{standings.map((item, index) => <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="p-5 text-center font-black">{index + 1}</td><th scope="row" className="p-5"><div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 font-black dark:border-slate-700">{item.logoUrl ? <img src={item.logoUrl} alt="" className="size-full object-contain p-1" /> : item.name.charAt(0)}</span><span className="font-black">{item.name}</span></div></th><td className="p-5 text-center text-xl font-black">{item.gold}</td><td className="p-5 text-center text-lg font-bold">{item.silver}</td><td className="p-5 text-center text-lg font-bold">{item.bronze}</td><td className="bg-slate-50 p-5 text-center text-2xl font-black text-primary-600 dark:bg-slate-950/30 dark:text-primary-300">{item.total}</td></tr>)}</tbody></table></div></div>
      </>}
      <p className="mt-5 text-right text-xs text-slate-500" aria-live="polite">{lastUpdated ? `Pembaruan terakhir ${lastUpdated.toLocaleString("id-ID")}` : "Menunggu pembaruan"} · fallback 30 detik</p>
    </main>
  );
}
