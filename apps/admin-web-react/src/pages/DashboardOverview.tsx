import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  CalendarDays,
  Clock,
  Flag,
  Map,
  MapPin,
  Medal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { usePortalAdmin } from '../contexts/portal';
import { localModule, localFeature } from '../../../../packages/portal-config/config';
import VisitorAnalytics from '../components/VisitorAnalytics';
import { AdminAlert, AdminEmptyState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { canAccessRole, getRealmRoles } from '../lib/auth';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import type { MatchSchedule } from '../types/master-data';

interface DashboardStats { cabors: number; venues: number; cityGuides: number; kontingens: number }
interface CityGuideSummary { total_items?: number }
interface AuditPreview { id: string; action: string; actor_id?: string; entity_name?: string; created_at: string }

interface OverviewCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose';
  loading?: boolean;
  badge?: string;
}

function OverviewCard({ icon, label, value, tone = 'blue', loading = false, badge }: OverviewCardProps) {
  const styles = {
    blue: {
      icon: 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-400/20',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    },
    emerald: {
      icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-400/20',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-400/20',
      badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-400/20',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    },
  }[tone];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105 ${styles.icon}`}>
          {icon}
        </span>
        {badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${styles.badge}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-slate-950 dark:text-white sm:text-3xl">
          {loading ? (
            <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            value
          )}
        </p>
      </div>
    </article>
  );
}

const getActionMeta = (action: string) => {
  if (action.includes('CREATE')) {
    return {
      Icon: Plus,
      badgeStyle: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    };
  }
  if (action.includes('VERIFIED') || action.includes('OFFICIAL')) {
    return {
      Icon: ShieldCheck,
      badgeStyle: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    };
  }
  if (action.includes('UPDATE') || action.includes('CORRECTED')) {
    return {
      Icon: Pencil,
      badgeStyle: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    };
  }
  if (action.includes('DELETE') || action.includes('REJECTED')) {
    return {
      Icon: Trash2,
      badgeStyle: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    };
  }
  if (action.includes('RESTORE')) {
    return {
      Icon: RotateCcw,
      badgeStyle: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    };
  }
  return {
    Icon: Activity,
    badgeStyle: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  };
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
  const portal = usePortalAdmin();
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
    if (!token || !portal.config) return;
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const config = authConfig(token);
      const [caborsRes, venuesRes, cityGuidesRes, kontingensRes, matchesRes] = await Promise.all([
        localModule(portal.config, 'cabor', true) ? apiClient.get<unknown[]>('/master-data/cabors', config) : Promise.resolve({ data: [] }),
        localModule(portal.config, 'venue', true) ? apiClient.get<unknown[]>('/venues', config) : Promise.resolve({ data: [] }),
        localModule(portal.config, 'city_guide', true) ? apiClient.get<CityGuideSummary>('/master-data/city-guides?page=1&per_page=1', config) : Promise.resolve({ data: { total_items: 0 } }),
        localModule(portal.config, 'kontingen', true) ? apiClient.get<unknown[]>('/master-data/kontingens', config) : Promise.resolve({ data: [] }),
        localFeature(portal.config, 'schedule_matches', true) ? apiClient.get<MatchSchedule[]>('/schedule/matches/enriched', config) : Promise.resolve({ data: [] }),
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
    } finally {
      setOverviewLoading(false);
    }
  }, [token, portal.config]);

  const loadLogs = useCallback(async () => {
    if (!token || !canViewAudit) { setLogsLoading(false); return; }
    setLogsLoading(true);
    setLogsError('');
    try {
      const response = await apiClient.get<AuditPreview[]>('/audit/logs?limit=10', authConfig(token));
      setLogs(unwrapApiData<AuditPreview[]>(response.data) || []);
    } catch (cause) {
      setLogsError(getApiErrorMessage(cause, 'Log sistem terkini belum dapat dimuat.'));
    } finally {
      setLogsLoading(false);
    }
  }, [canViewAudit, token]);

  useEffect(() => { void loadOverview(); void loadLogs(); }, [loadLogs, loadOverview]);

  const upcomingMatches = useMemo(() => [...matches]
    .sort((first, second) => new Date(first.match_date).getTime() - new Date(second.match_date).getTime())
    .slice(0, 5), [matches]);

  const isRefreshing = overviewLoading || logsLoading;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Ruang kerja panitia"
        title="Dasbor Operasional"
        description="Ringkasan data utama, jadwal, statistik pengunjung, dan aktivitas sistem untuk membantu operator menentukan pekerjaan berikutnya."
        actions={
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => { void loadOverview(); void loadLogs(); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} aria-hidden="true" />
            {isRefreshing ? 'Memperbarui...' : 'Perbarui'}
          </button>
        }
      />

      {overviewError && <AdminAlert tone="danger">{overviewError}</AdminAlert>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan data utama">
        <OverviewCard
          icon={<Medal className="size-6" aria-hidden="true" />}
          label="Cabang olahraga"
          value={stats.cabors}
          loading={overviewLoading}
          badge="Cabor"
          tone="blue"
        />
        <OverviewCard
          icon={<MapPin className="size-6" aria-hidden="true" />}
          label="Lokasi pertandingan"
          value={stats.venues}
          loading={overviewLoading}
          badge="Arena"
          tone="emerald"
        />
        <OverviewCard
          icon={<Map className="size-6" aria-hidden="true" />}
          label="Panduan Kota"
          value={stats.cityGuides}
          loading={overviewLoading}
          badge="Katalog"
          tone="amber"
        />
        <OverviewCard
          icon={<Flag className="size-6" aria-hidden="true" />}
          label="Kontingen"
          value={stats.kontingens}
          loading={overviewLoading}
          badge="Daerah"
          tone="rose"
        />
      </section>

      {token && canViewAnalytics && <VisitorAnalytics token={token} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        {portal.config && localFeature(portal.config, 'schedule_matches', true) && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-labelledby="upcoming-match-title">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-700">
              <div>
                <h2 id="upcoming-match-title" className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
                  <CalendarDays className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                  Jadwal terdekat
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Data langsung dari Jadwal Pertandingan.</p>
              </div>
              <a
                href={`${import.meta.env.BASE_URL}master-data?tab=jadwal`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:hover:bg-blue-950/40"
              >
                Kelola jadwal
              </a>
            </div>

            {overviewLoading ? (
              <div className="divide-y divide-slate-100 p-4 space-y-3 dark:divide-slate-800" role="status" aria-label="Memuat jadwal terdekat">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 py-2 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                    <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : upcomingMatches.length === 0 ? (
              <AdminEmptyState
                icon={CalendarDays}
                title="Belum ada jadwal"
                description="Buat pertandingan lengkap dengan Peserta A/B agar siap digunakan oleh Pusat Skor Langsung."
                action={
                  <a
                    href={`${import.meta.env.BASE_URL}master-data?tab=jadwal`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
                  >
                    Buka Jadwal Pertandingan
                  </a>
                }
              />
            ) : (
              <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingMatches.map((match) => (
                  <li
                    key={match.id}
                    className="grid gap-3 p-4 transition-colors hover:bg-slate-50/80 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:items-center sm:px-5 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                      <time className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {new Date(match.match_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </time>
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-500 tabular-nums dark:text-slate-400">
                        <Clock className="size-3 text-slate-400" aria-hidden="true" />
                        {new Date(match.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-black text-slate-950 dark:text-white">
                          {match.cabor_name || 'Cabang belum tersedia'}
                        </span>
                        <span className="text-xs font-medium text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {match.nomor_tanding_name || 'Nomor belum tersedia'}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate">{match.venue_name || 'Lokasi belum tersedia'}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="shrink-0 font-medium">{match.round}</span>
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${
                          match.status === 'finished'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : match.status === 'ongoing'
                              ? 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                              : match.status === 'delayed'
                                ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {matchStatusLabels[match.status] || 'Status belum dikenali'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900" aria-labelledby="system-log-title">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 id="system-log-title" className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
              <ScrollText className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              Aktivitas terkini
            </h2>
            {canViewAudit && (
              <a
                href={`${import.meta.env.BASE_URL}audit-log`}
                className="min-h-11 rounded-xl px-3 py-2 text-sm font-black text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-950/40"
              >
                Lihat riwayat
              </a>
            )}
          </div>

          {!canViewAudit ? (
            <AdminEmptyState
              icon={Activity}
              title="Akses terbatas"
              description="Ringkasan aktivitas hanya tersedia bagi auditor dan administrator utama."
            />
          ) : logsLoading ? (
            <div className="space-y-4 pt-4" role="status" aria-label="Memuat aktivitas terkini">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex items-start gap-3 animate-pulse">
                  <div className="size-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : logsError ? (
            <div className="mt-4">
              <AdminAlert tone="danger">{logsError}</AdminAlert>
            </div>
          ) : logs.length === 0 ? (
            <AdminEmptyState
              icon={ScrollText}
              title="Belum ada aktivitas terbaru"
              description="Catatan terbaru akan muncul setelah aktivitas terproses."
            />
          ) : (
            <ol className="mt-4 space-y-2">
              {logs.slice(0, 6).map((log) => {
                const { Icon, badgeStyle } = getActionMeta(log.action);
                return (
                  <li
                    key={log.id}
                    className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg border text-xs shadow-xs transition-transform duration-150 group-hover:scale-105 ${badgeStyle}`}
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm leading-snug text-slate-700 dark:text-slate-200">
                        <strong className="font-black text-slate-950 dark:text-white">
                          {log.actor_id ? 'Operator' : 'Sistem'}
                        </strong>{' '}
                        <span className="text-slate-600 dark:text-slate-300">
                          {actionLabels[log.action] || 'mencatat perubahan'}
                        </span>{' '}
                        pada{' '}
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                          {entityLabels[log.entity_name || ''] || 'data terkait'}
                        </span>
                      </p>
                      <time className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
