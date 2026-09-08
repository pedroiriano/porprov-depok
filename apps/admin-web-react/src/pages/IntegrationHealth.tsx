import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, Clock3, RefreshCw, TriangleAlert } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { AdminAlert, AdminLoadingState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { apiClient, authConfig, getApiErrorMessage } from '../lib/api';

interface IntegrationStatus {
  key: string;
  available: boolean;
  latency_ms: number;
  pending_items?: number;
  retry_count?: number;
  oldest_pending_seconds?: number;
}

interface IntegrationHealthResponse {
  checked_at: string;
  integrations: IntegrationStatus[];
}

const integrationLabels: Record<string, string> = {
  api: 'Pintu layanan',
  database: 'Penyimpanan data',
  message_broker: 'Pengiriman pembaruan',
  cache: 'Penyimpanan sementara',
  identity: 'Layanan akun',
  analytics: 'Statistik pengunjung',
  users: 'Pengelolaan pengguna',
  master_data: 'Data utama',
  schedule: 'Jadwal pertandingan',
  venues: 'Lokasi pertandingan',
  live_scores: 'Skor langsung',
  medals: 'Perolehan medali',
  audit: 'Log audit',
  realtime: 'Pembaruan langsung',
};

export default function IntegrationHealth() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ['integration-health'],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<IntegrationHealthResponse>('/integrations/health', {
        ...authConfig(auth.user?.access_token),
        signal,
      });
      return response.data;
    },
    refetchInterval: 60_000,
    staleTime: 20_000,
  });
  const refresh = useCallback(() => void query.refetch(), [query]);
  const availableCount = query.data?.integrations.filter((item) => item.available).length ?? 0;
  const totalCount = query.data?.integrations.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Pemantauan layanan"
        title="Kesehatan Integrasi"
        description="Lihat kesiapan layanan pendukung tanpa membuka alamat, kredensial, atau rincian internal sistem."
        actions={<button type="button" onClick={refresh} disabled={query.isFetching} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />Periksa kembali</button>}
      />

      {query.isLoading ? <AdminLoadingState label="Memeriksa kesiapan layanan..." /> : query.isError ? (
        <AdminAlert tone="danger">{getApiErrorMessage(query.error, 'Pemeriksaan layanan belum dapat diselesaikan.')}</AdminAlert>
      ) : (
        <>
          <section className={`rounded-2xl border p-5 ${availableCount === totalCount ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'}`} role="status">
            <div className="flex items-start gap-3">
              {availableCount === totalCount ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-6 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />}
              <div><h2 className="font-black text-slate-950 dark:text-white">{availableCount === totalCount ? 'Seluruh layanan siap digunakan' : 'Sebagian layanan perlu diperiksa'}</h2><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{availableCount} dari {totalCount} layanan merespons pemeriksaan terakhir.</p></div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Status layanan terhubung">
            {query.data?.integrations.map((item) => (
              <article key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-11 place-items-center rounded-xl ${item.available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200'}`}><Activity className="size-5" aria-hidden="true" /></span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.available ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>{item.available ? 'Berfungsi normal' : 'Perlu diperiksa'}</span>
                </div>
                <h2 className="mt-4 font-black text-slate-950 dark:text-white">{integrationLabels[item.key] || 'Layanan pendukung'}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300"><Clock3 className="size-3.5" aria-hidden="true" />Waktu tanggapan {Math.max(0, item.latency_ms)} milidetik</p>
                {item.pending_items !== undefined && <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Antrean tertunda: <strong>{item.pending_items.toLocaleString('id-ID')}</strong> · Percobaan ulang: <strong>{(item.retry_count || 0).toLocaleString('id-ID')}</strong> · Usia terlama: <strong>{Math.round(item.oldest_pending_seconds || 0).toLocaleString('id-ID')} detik</strong></p>}
              </article>
            ))}
          </section>
          <p className="text-xs text-slate-500 dark:text-slate-300">Pemeriksaan terakhir: {new Date(query.data?.checked_at || '').toLocaleString('id-ID')}</p>
        </>
      )}
    </div>
  );
}
