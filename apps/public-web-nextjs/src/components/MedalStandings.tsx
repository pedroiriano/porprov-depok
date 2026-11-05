"use client";

import {PublicCardGrid} from './PublicCardGrid';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Medal, Radio, RefreshCw } from "lucide-react";
import { publicApiUrl, readPgNumber, readResourceId, unwrapCollection } from "@/lib/public-api";
import { normalizeKontingen, type RawKontingen } from "@/lib/public-models";
import { PublicPageHero } from "@/components/PublicPageHero";

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
    } catch {
      setError("Klasemen belum dapat dimuat. Silakan coba lagi.");
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
    <main className="bg-slate-50 dark:bg-slate-950">
      <PublicPageHero eyebrow="Prestasi Kontingen" title="Klasemen Medali" description="Urutan resmi berdasarkan perolehan emas, perak, lalu perunggu." icon="ri-medal-line" breadcrumbs={[{ label: "Klasemen" }]}>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2"><span className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black ${connected ? "border-emerald-300/40 bg-emerald-950 text-emerald-200" : "border-amber-300/40 bg-amber-950 text-amber-200"}`} role="status"><Radio className={`size-4 ${connected ? "animate-pulse" : ""}`} aria-hidden="true" />{connected ? "Pembaruan langsung" : "Pembaruan berkala"}</span><button type="button" onClick={() => void loadStandings()} disabled={loading} className="inline-flex min-h-11 items-center rounded-xl bg-primary-500 px-4 font-black text-white hover:bg-primary-600 disabled:opacity-60"><RefreshCw className={`me-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />Perbarui</button></div>
      </PublicPageHero>

      <div className="container py-14 md:py-20">

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><h2 className="font-black">Pembaruan klasemen tertunda</h2><p className="mt-1 text-sm">{error}</p></div></div>}
      {loading && standings.length === 0 ? (
        <div className="space-y-8" aria-label="Memuat klasemen">
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="mt-6 flex justify-around border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="h-14 bg-slate-100 dark:bg-slate-800/80" />
            <div className="divide-y divide-slate-100 p-4 space-y-3 dark:divide-slate-800">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-10 rounded bg-slate-100 dark:bg-slate-800/50" />
              ))}
            </div>
          </div>
        </div>
      ) : standings.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700"><Medal className="mx-auto size-12 text-amber-500" aria-hidden="true" /><h2 className="mt-5 text-xl font-black">Klasemen belum tersedia</h2><p className="mt-2 text-slate-500">Perolehan medali akan tampil setelah hasil disahkan.</p></div> : <>
        <PublicCardGrid maxColumns={3} className="mb-8 gap-5" aria-label="Tiga besar klasemen">
          {standings.slice(0, 3).map((item, index) => {
            const podiumConfigs = [
              {
                border: 'border-amber-300/80 bg-gradient-to-b from-amber-50/80 to-white dark:border-amber-800/80 dark:from-amber-950/20 dark:to-slate-900',
                badge: 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200',
                dot: 'bg-amber-500',
                label: 'Peringkat 1'
              },
              {
                border: 'border-slate-300 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-700 dark:from-slate-800/20 dark:to-slate-900',
                badge: 'border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                dot: 'bg-slate-400',
                label: 'Peringkat 2'
              },
              {
                border: 'border-amber-700/40 bg-gradient-to-b from-orange-50/60 to-white dark:border-amber-900/60 dark:from-orange-950/15 dark:to-slate-900',
                badge: 'border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950/80 dark:text-orange-200',
                dot: 'bg-amber-700',
                label: 'Peringkat 3'
              }
            ];
            const config = podiumConfigs[index] || podiumConfigs[1];

            return (
              <article key={item.id} className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md sm:p-6 ${config.border}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${config.badge}`}>
                    <span className={`size-2 rounded-full ${config.dot}`} aria-hidden="true" />
                    {config.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Total: <strong className="text-sm text-slate-950 sm:text-base dark:text-white">{item.total}</strong>
                  </span>
                </div>

                <h2 className="mt-3 truncate text-lg font-black text-slate-950 sm:text-xl dark:text-white">
                  {item.name}
                </h2>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-4 text-center dark:border-slate-800">
                  <div className="rounded-xl bg-amber-500/10 p-2 dark:bg-amber-500/15">
                    <span className="block text-[11px] font-bold text-amber-700 dark:text-amber-400">Emas</span>
                    <strong className="text-lg font-black tabular-nums text-amber-800 dark:text-amber-300">{item.gold}</strong>
                  </div>
                  <div className="rounded-xl bg-slate-500/10 p-2 dark:bg-slate-400/15">
                    <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">Perak</span>
                    <strong className="text-lg font-black tabular-nums text-slate-800 dark:text-slate-200">{item.silver}</strong>
                  </div>
                  <div className="rounded-xl bg-orange-600/10 p-2 dark:bg-orange-500/15">
                    <span className="block text-[11px] font-bold text-orange-700 dark:text-orange-400">Perunggu</span>
                    <strong className="text-lg font-black tabular-nums text-orange-800 dark:text-orange-300">{item.bronze}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </PublicCardGrid>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Klasemen perolehan medali kontingen PORPROV XV Jawa Barat 2026</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-sm uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                  <th className="sticky left-0 z-20 w-16 bg-slate-100 p-4 text-center sm:p-5 dark:bg-slate-950" scope="col">Peringkat</th>
                  <th className="sticky left-16 z-20 bg-slate-100 p-4 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] sm:p-5 dark:bg-slate-950 dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]" scope="col">Kontingen</th>
                  <th className="p-4 text-center sm:p-5" scope="col">Emas</th>
                  <th className="p-4 text-center sm:p-5" scope="col">Perak</th>
                  <th className="p-4 text-center sm:p-5" scope="col">Perunggu</th>
                  <th className="p-4 text-center sm:p-5" scope="col">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {standings.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="sticky left-0 z-10 w-16 bg-white p-4 text-center font-black group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800 sm:p-5">{index + 1}</td>
                    <th scope="row" className="sticky left-16 z-10 bg-white p-4 font-bold shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)] group-hover:bg-slate-50 dark:bg-slate-900 dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)] dark:group-hover:bg-slate-800 sm:p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 font-black dark:border-slate-700">
                          {item.logoUrl ? <img src={item.logoUrl} alt="" loading="lazy" decoding="async" className="size-full object-contain p-1" /> : item.name.charAt(0)}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">{item.name}</span>
                      </div>
                    </th>
                    <td className="p-4 text-center text-xl font-black sm:p-5">{item.gold}</td>
                    <td className="p-4 text-center text-lg font-bold sm:p-5">{item.silver}</td>
                    <td className="p-4 text-center text-lg font-bold sm:p-5">{item.bronze}</td>
                    <td className="bg-slate-50 p-4 text-center text-2xl font-black text-primary-600 dark:bg-slate-950/30 dark:text-primary-300 sm:p-5">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}
      <p className="mt-5 text-right text-xs text-slate-500" aria-live="polite">{lastUpdated ? `Pembaruan terakhir ${lastUpdated.toLocaleString("id-ID")}` : "Menunggu pembaruan"}</p>
      </div>
    </main>
  );
}
