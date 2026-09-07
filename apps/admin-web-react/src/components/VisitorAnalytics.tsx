import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Eye, RefreshCw, Users } from 'lucide-react';
import { apiClient, authConfig, unwrapApiData } from '../lib/api';

type Metric = { x?: string; t?: string; y?: number };
type Summary = { pageviews?: number; visitors?: number; visits?: number; bounces?: number; totaltime?: number };
type AnalyticsPayload = {
  days: number;
  active?: { visitors?: number };
  stats?: Summary;
  pageviews?: { pageviews?: Metric[]; sessions?: Metric[] } | Metric[];
  top_pages?: Metric[];
  referrers?: Metric[];
  devices?: Metric[];
  browsers?: Metric[];
};

const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const list = (value: unknown): Metric[] => Array.isArray(value) ? value.filter((item): item is Metric => Boolean(item) && typeof item === 'object') : [];

function MiniStat({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Eye }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Icon className="size-4" aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-wider">{title}</span></div>
      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Ranking({ title, rows, empty }: { title: string; rows: Metric[]; empty: string }) {
  const maximum = Math.max(1, ...rows.map((row) => number(row.y)));
  return (
    <section aria-labelledby={`analytics-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 id={`analytics-${title.toLowerCase().replace(/\s+/g, '-')}`} className="font-black text-slate-900 dark:text-white">{title}</h3>
      {rows.length === 0 ? <p className="mt-4 text-sm text-slate-500">{empty}</p> : (
        <ol className="mt-4 space-y-3">
          {rows.slice(0, 6).map((row, index) => (
            <li key={`${row.x || 'unknown'}-${index}`}>
              <div className="flex items-center justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-700 dark:text-slate-200">{row.x || 'Langsung/tidak diketahui'}</span><span className="shrink-0 font-black">{number(row.y).toLocaleString('id-ID')}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(4, (number(row.y) / maximum) * 100)}%` }} /></div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function VisitorAnalytics({ token }: { token: string }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/analytics/overview?days=${days}`, authConfig(token));
      setData(unwrapApiData<AnalyticsPayload>(response.data));
    } catch {
      setError('Statistik pengunjung belum dapat dimuat. Pastikan layanan analytics aktif lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => { load(); }, [load]);

  const series = useMemo(() => {
    if (Array.isArray(data?.pageviews)) return list(data?.pageviews);
    return list(data?.pageviews?.pageviews);
  }, [data]);
  const chartValues = series.map((point) => number(point.y));
  const chartMax = Math.max(1, ...chartValues);
  const points = chartValues.map((value, index) => `${series.length <= 1 ? 0 : (index / (series.length - 1)) * 100},${48 - (value / chartMax) * 44}`).join(' ');
  const stats = data?.stats || {};
  const bounceRate = number(stats.visits) ? Math.round((number(stats.bounces) / number(stats.visits)) * 100) : 0;
  const averageSeconds = number(stats.visits) ? Math.round(number(stats.totaltime) / number(stats.visits)) : 0;

  return (
    <section className="card overflow-hidden" aria-labelledby="visitor-analytics-title">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Umami self-hosted</p><h2 id="visitor-analytics-title" className="mt-1 text-xl font-black">Statistik Pengunjung</h2><p className="mt-1 text-sm text-slate-500">Analytics Public Web tanpa mengirim data ke layanan eksternal.</p></div>
        <div className="flex items-center gap-2">
          <label htmlFor="analytics-range" className="sr-only">Rentang statistik</label>
          <select id="analytics-range" value={days} onChange={(event) => setDays(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value={1}>Hari ini</option><option value={7}>7 hari</option><option value={30}>30 hari</option><option value={90}>90 hari</option>
          </select>
          <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Muat ulang statistik"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /></button>
        </div>
      </div>
      {loading ? <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Memuat statistik pengunjung">{[0,1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div> : error ? <div className="p-8 text-center"><p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p><button type="button" onClick={load} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 font-bold text-white">Coba lagi</button></div> : (
        <div className="space-y-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MiniStat title="Aktif sekarang" value={number(data?.active?.visitors).toLocaleString('id-ID')} icon={Activity} /><MiniStat title="Page views" value={number(stats.pageviews).toLocaleString('id-ID')} icon={Eye} /><MiniStat title="Pengunjung unik" value={number(stats.visitors).toLocaleString('id-ID')} icon={Users} /><MiniStat title="Rata-rata waktu" value={`${Math.floor(averageSeconds / 60)}m ${averageSeconds % 60}d`} icon={Clock3} /></div>
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="flex items-center justify-between"><h3 className="font-black">Tren kunjungan</h3><span className="text-xs font-bold text-slate-500">Bounce rate {bounceRate}%</span></div>{series.length > 1 ? <svg viewBox="0 0 100 52" className="mt-4 h-44 w-full" role="img" aria-label="Grafik page views"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-indigo-500" /><line x1="0" y1="49" x2="100" y2="49" className="text-slate-200 dark:text-slate-700" stroke="currentColor" strokeWidth="1" /></svg> : <p className="py-12 text-center text-sm text-slate-500">Data tren akan muncul setelah kunjungan mulai tercatat.</p>}</div>
          <div className="grid gap-8 rounded-2xl border border-slate-200 p-5 dark:border-slate-700 md:grid-cols-2 xl:grid-cols-4"><Ranking title="Halaman populer" rows={list(data?.top_pages)} empty="Belum ada halaman tercatat." /><Ranking title="Sumber kunjungan" rows={list(data?.referrers)} empty="Belum ada referrer tercatat." /><Ranking title="Perangkat" rows={list(data?.devices)} empty="Belum ada perangkat tercatat." /><Ranking title="Browser" rows={list(data?.browsers)} empty="Belum ada browser tercatat." /></div>
        </div>
      )}
    </section>
  );
}
