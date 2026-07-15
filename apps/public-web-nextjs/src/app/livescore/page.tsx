"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Clock, Loader2, Radio } from "lucide-react";
import { publicApiUrl, readPgText, readPgTimestamp, readResourceId, unwrapCollection } from "@/lib/public-api";

interface LiveScoreUpdate {
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

interface RawMatch {
  id?: unknown;
  cabor_name?: string | null;
  round?: string | null;
  peserta_a?: string | null;
  peserta_b?: string | null;
  match_date?: Parameters<typeof readPgTimestamp>[0];
  match_time?: Parameters<typeof readPgTimestamp>[0];
  status?: string | null;
}

interface MatchViewModel {
  id: string;
  cabor: string;
  round: string;
  teamA: string;
  teamB: string;
  time: string;
  initialStatus: string;
}

function normalizeMatch(raw: RawMatch, index: number): MatchViewModel {
  const timestamp = readPgTimestamp(raw.match_time) || readPgTimestamp(raw.match_date);
  return {
    id: readResourceId(raw.id, `match-${index}`),
    cabor: raw.cabor_name?.trim() || "Pertandingan PORPROV",
    round: readPgText(raw.round) || "Tahap pertandingan",
    teamA: raw.peserta_a?.trim() || "Peserta A menunggu konfirmasi",
    teamB: raw.peserta_b?.trim() || "Peserta B menunggu konfirmasi",
    time: timestamp
      ? new Date(timestamp).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : "Waktu menyusul",
    initialStatus: raw.status?.trim() || "Belum mulai",
  };
}

export default function LiveScorePage() {
  const [matches, setMatches] = useState<MatchViewModel[]>([]);
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
      const response = await fetch(publicApiUrl("/schedule/matches"), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`API Gateway merespons ${response.status}`);
      }
      const payload: unknown = await response.json();
      setMatches(unwrapCollection<RawMatch>(payload).map(normalizeMatch));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Kesalahan tidak dikenal";
      setError(`Pertandingan aktif belum dapat dimuat. ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadMatches(), 0);
    return () => window.clearTimeout(initialTimer);
  }, [loadMatches]);

  useEffect(() => {
    // INFO: EventSource memakai API Gateway sebagai satu-satunya edge publik.
    const eventSource = new EventSource(publicApiUrl("/stream/events"));

    eventSource.onopen = () => setConnected(true);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<LiveScoreUpdate>;
        if (typeof data.matchId !== "string" || !data.matchId) {
          return;
        }

        const update: LiveScoreUpdate = {
          matchId: data.matchId,
          scoreA: typeof data.scoreA === "number" ? data.scoreA : 0,
          scoreB: typeof data.scoreB === "number" ? data.scoreB : 0,
          status: typeof data.status === "string" && data.status ? data.status : "Berlangsung",
        };
        setScores((current) => ({ ...current, [update.matchId]: update }));
        setFlashCard(update.matchId);
        if (flashTimerRef.current !== null) {
          window.clearTimeout(flashTimerRef.current);
        }
        flashTimerRef.current = window.setTimeout(() => setFlashCard(null), 1000);
      } catch {
        // INFO: Event non-LiveScore (misalnya medali) sengaja diabaikan oleh layar ini.
      }
    };
    eventSource.onerror = () => setConnected(false);

    return () => {
      eventSource.close();
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className={`flex size-11 items-center justify-center rounded-full ${connected ? "bg-red-100 text-red-500 shadow-[0_0_18px_rgba(239,68,68,0.25)] dark:bg-red-950" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`} aria-hidden="true">
              <Activity className={`size-5 ${connected ? "animate-pulse" : ""}`} />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">LiveScore</h1>
          </div>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Skor resmi dan status pertandingan dari seluruh venue PORPROV.</p>
        </div>
        <div className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300"}`} role="status" aria-live="polite">
          <Radio className={`size-4 ${connected ? "animate-pulse" : ""}`} aria-hidden="true" />
          {connected ? "Realtime terhubung" : "Menghubungkan realtime"}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">Pembaruan pertandingan tertunda</p>
            <p className="mt-1 text-sm">{error}</p>
            <button type="button" onClick={() => void loadMatches()} className="mt-3 min-h-11 rounded-md bg-amber-900 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 dark:bg-amber-300 dark:text-amber-950">Coba lagi</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center" role="status" aria-label="Memuat pertandingan LiveScore">
          <Loader2 className="size-8 animate-spin text-primary-500" aria-hidden="true" />
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-500/10 text-primary-500"><Activity className="size-8" aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-black">Belum ada pertandingan aktif</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-500 dark:text-slate-400">LiveScore akan muncul otomatis setelah jadwal pertandingan dipublikasikan oleh panitia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {matches.map((match) => {
              const liveData = scores[match.id];
              const isFlashing = flashCard === match.id;
              return (
                <article key={match.id} className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-500 dark:bg-slate-900 ${liveData ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-800"} ${isFlashing ? "scale-[1.01] shadow-lg ring-2 ring-amber-300" : ""}`}>
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{match.cabor} · {match.round}</p>
                    <p className={`flex items-center gap-1.5 text-xs font-bold ${liveData ? "text-red-500" : "text-slate-500"}`}><Clock className="size-3.5" aria-hidden="true" /> {liveData?.status || match.initialStatus}</p>
                  </header>
                  <div className="space-y-5 p-5 sm:p-6">
                    {[
                      { name: match.teamA, score: liveData?.scoreA },
                      { name: match.teamB, score: liveData?.scoreB },
                    ].map((team) => (
                      <div key={team.name} className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500 dark:bg-slate-800">{team.name.charAt(0)}</span>
                          <span className="truncate font-bold text-slate-900 dark:text-white">{team.name}</span>
                        </div>
                        <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{team.score ?? "–"}</span>
                      </div>
                    ))}
                    <p className="border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">{match.time}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="live-status-title">
            <h2 id="live-status-title" className="flex items-center gap-2 font-black"><Activity className="size-4 text-primary-500" aria-hidden="true" /> Status Data</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Pertandingan</dt><dd className="font-black">{matches.length}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Update skor</dt><dd className="font-black">{Object.keys(scores).length}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500 dark:text-slate-400">Koneksi</dt><dd className={connected ? "font-black text-emerald-600" : "font-black text-amber-600"}>{connected ? "Terhubung" : "Mencoba ulang"}</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
