import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, CalendarDays, Flag, Map, MapPin, Medal, RefreshCw, ScrollText } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import VisitorAnalytics from '../components/VisitorAnalytics';
import { AdminAlert, AdminEmptyState, AdminLoadingState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { canAccessRole, getRealmRoles } from '../lib/auth';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import type { MatchSchedule } from '../types/master-data';

interface DashboardStats { cabors: number; venues: number; cityGuides: number; kontingens: number }
interface CityGuideSummary { total_items?: number }
interface AuditPreview { id: string; action: string; actor_id?: string; entity_name?: string; created_at: string }

function OverviewCard({ icon, label, value, tone = 'blue' }: { icon: ReactNode; label: string; value: number | string; tone?: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-200',
  }[tone];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${styles}`}>{icon}</span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p></div></div>
    </article>
  );
}

const actionTone = (action: string) => {
  if (action.includes('CREATE')) return 'bg-emerald-500';
  if (action.includes('UPDATE') || action.includes('VERIFIED')) return 'bg-blue-500';
  if (action.includes('DELETE') || action.includes('REJECTED')) return 'bg-red-500';
  return 'bg-amber-500';
};

const actionLabels: Record<string, string> = {
  CREATE: 'membuat', UPDATE: 'mengubah', DELETE: 'mengarsipkan', RESTORE: 'memulihkan',
  LIVESCORE_UPDATED: 'memperbarui skor', LIVESCORE_CORRECTED: 'mengoreksi skor',
  MEDAL_SUBMISSION_CREATED: 'mengajukan perolehan medali', MEDAL_SUBMISSION_VERIFIED: 'memverifikasi perolehan medali',
  MEDAL_SUBMISSION_REJECTED: 'menolak pengajuan medali', MEDAL_SUBMISSION_OFFICIAL: 'mempublikasikan perolehan medali',
};

const entityLabels: Record<string, string> = {
  user: 'pengguna', cabor: 'cabang olahraga', nomor_tanding: 'nomor pertandingan',
  venue: 'lokasi pertandingan', match: 'jadwal pertandingan', livescore: 'skor pertandingan',
  medal_submission: 'pengajuan medali', city_guide: 'panduan kota', media: 'pustaka media', hero: 'tampilan utama',
};

const matchStatusLabels: Record<string, string> = {
  scheduled: 'Terjadwal', ongoing: 'Berlangsung', finished: 'Selesai', delayed: 'Ditunda', cancelled: 'Dibatalkan',
};

export default function DashboardOverview() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const roles = getRealmRoles(auth.user);
  const canViewAnalytics = canAccessRole(roles, ['auditor']);
  const canViewAudit = canAccessRole(roles, ['auditor']);
  const [logs, setLogs] = useState<AuditPreview[]>([]);
  const [logsLoading, setLogsLoading] = useState(canViewAudit);
  const [logsError, setLogsError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({ cabors: 0, venues: 0, cityGuides: 0, kontingens: 0 });
  const [matches, setMatches] = useState<MatchSchedule[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const config = authConfig(token);
      const [caborsRes, venuesRes, cityGuidesRes, kontingensRes, matchesRes] = await Promise.all([
        apiClient.get<unknown[]>('/master-data/cabors', config),
        apiClient.get<unknown[]>('/venues', config),
        apiClient.get<CityGuideSummary>('/master-data/city-guides?page=1&per_page=1', config),
        apiClient.get<unknown[]>('/master-data/kontingens', config),
        apiClient.get<MatchSchedule[]>('/schedule/matches/enriched', config),
      ]);
      const cabors = unwrapApiData<unknown[]>(caborsRes.data);
      const venues = unwrapApiData<unknown[]>(venuesRes.data);
      const kontingens = unwrapApiData<unknown[]>(kontingensRes.data);
      setStats({
        cabors: Array.isArray(cabors) ? cabors.length : 0,
        venues: Array.isArray(venues) ? venues.length : 0,
        cityGuides: cityGuidesRes.data.total_items || 0,
        kontingens: Array.isArray(kontingens) ? kontingens.length : 0,
      });
      setMatches(unwrapApiData<MatchSchedule[]>(matchesRes.data) || []);
    } catch (cause) {
      setOverviewError(getApiErrorMessage(cause, 'Ringkasan operasional belum dapat dimuat.'));
    } finally { setOverviewLoading(false); }
  }, [token]);

  const loadLogs = useCallback(async () => {
    if (!token || !canViewAudit) { setLogsLoading(false); return; }
    setLogsLoading(true);
    setLogsError('');
    try {
      const response = await apiClient.get<AuditPreview[]>('/audit/logs?limit=10', authConfig(token));
      setLogs(unwrapApiData<AuditPreview[]>(response.data) || []);
    } catch (cause) {
      setLogsError(getApiErrorMessage(cause, 'Log sistem terkini belum dapat dimuat.'));
    } finally { setLogsLoading(false); }
  }, [canViewAudit, token]);

  useEffect(() => { void loadOverview(); void loadLogs(); }, [loadLogs, loadOverview]);

  const upcomingMatches = useMemo(() => [...matches]
    .sort((first, second) => new Date(first.match_date).getTime() - new Date(second.match_date).getTime())
    .slice(0, 5), [matches]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="Ruang kerja panitia" title="Dasbor Operasional" description="Ringkasan data utama, jadwal, statistik pengunjung, dan aktivitas sistem untuk membantu operator menentukan pekerjaan berikutnya." actions={<button type="button" onClick={() => { void loadOverview(); void loadLogs(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className="size-4" aria-hidden="true" />Perbarui</button>} />

      {overviewError && <AdminAlert tone="danger">{overviewError}</AdminAlert>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan data utama">
        <OverviewCard icon={<Medal className="size-5" aria-hidden="true" />} label="Cabang olahraga" value={overviewLoading ? '…' : stats.cabors} />
        <OverviewCard icon={<MapPin className="size-5" aria-hidden="true" />} label="Lokasi pertandingan" value={overviewLoading ? '…' : stats.venues} tone="emerald" />
        <OverviewCard icon={<Map className="size-5" aria-hidden="true" />} label="Panduan Kota" value={overviewLoading ? '…' : stats.cityGuides} tone="amber" />
        <OverviewCard icon={<Flag className="size-5" aria-hidden="true" />} label="Kontingen" value={overviewLoading ? '…' : stats.kontingens} tone="rose" />
      </section>

      {token && canViewAnalytics && <VisitorAnalytics token={token} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-labelledby="upcoming-match-title">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"><div><h2 id="upcoming-match-title" className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><CalendarDays className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Jadwal terdekat</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Data langsung dari Jadwal Pertandingan.</p></div><a href={`${import.meta.env.BASE_URL}master-data?tab=jadwal`} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:hover:bg-blue-950/40">Kelola jadwal</a></div>
          {overviewLoading ? <AdminLoadingState label="Memuat jadwal..." /> : upcomingMatches.length === 0 ? <AdminEmptyState icon={CalendarDays} title="Belum ada jadwal" description="Buat pertandingan lengkap dengan Peserta A/B agar siap digunakan oleh Pusat Skor Langsung." action={<a href={`${import.meta.env.BASE_URL}master-data?tab=jadwal`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700">Buka Jadwal Pertandingan</a>} /> : <ol className="divide-y divide-slate-200 dark:divide-slate-700">{upcomingMatches.map((match) => <li key={match.id} className="grid gap-2 p-4 transition-colors hover:bg-blue-50/50 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center dark:hover:bg-blue-950/20"><div><p className="text-sm font-black text-slate-900 dark:text-white">{new Date(match.match_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p><p className="text-xs text-slate-500 dark:text-slate-300">{new Date(match.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p></div><div className="min-w-0"><p className="truncate font-black text-slate-950 dark:text-white">{match.cabor_name || 'Cabang belum tersedia'} · {match.nomor_tanding_name || 'Nomor belum tersedia'}</p><p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-300">{match.venue_name || 'Lokasi belum tersedia'} · {match.round}</p></div><span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{matchStatusLabels[match.status] || 'Status belum dikenali'}</span></li>)}</ol>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="system-log-title">
          <div className="flex items-center justify-between gap-3"><h2 id="system-log-title" className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><ScrollText className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Aktivitas terkini</h2>{canViewAudit && <a href={`${import.meta.env.BASE_URL}audit-log`} className="min-h-11 rounded-xl px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-950/40">Lihat riwayat</a>}</div>
          {!canViewAudit ? <AdminEmptyState icon={Activity} title="Akses terbatas" description="Ringkasan aktivitas hanya tersedia bagi auditor dan administrator utama." /> : logsLoading ? <AdminLoadingState label="Memuat aktivitas..." /> : logsError ? <div className="mt-4"><AdminAlert tone="danger">{logsError}</AdminAlert></div> : logs.length === 0 ? <AdminEmptyState icon={ScrollText} title="Belum ada aktivitas terbaru" description="Catatan terbaru akan muncul setelah aktivitas terproses." /> : <ol className="mt-5 space-y-4">{logs.slice(0, 6).map((log) => <li key={log.id} className="flex items-start gap-3"><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${actionTone(log.action)}`} aria-hidden="true" /><div className="min-w-0"><p className="break-words text-sm text-slate-700 dark:text-slate-200"><strong>{log.actor_id ? 'Pengguna terautentikasi' : 'Sistem'}</strong> {actionLabels[log.action] || 'mencatat perubahan'} pada {entityLabels[log.entity_name || ''] || 'data terkait'}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleString('id-ID')}</p></div></li>)}</ol>}
        </section>
      </div>
    </div>
  );
}
