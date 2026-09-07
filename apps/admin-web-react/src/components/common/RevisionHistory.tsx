import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, History, RotateCcw } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import { AdminAlert, AdminEmptyState, AdminLoadingState } from '../cuba/AdminPrimitives';

interface AuditRevision {
  id: string;
  event_id: string;
  entity_name: string;
  entity_id: string;
  action: string;
  actor_id: string;
  payload: unknown;
  payload_hash: string;
  created_at: string;
}

interface RevisionHistoryProps {
  entityName: string;
  entityId?: string;
  onRestore: (payload: Record<string, unknown>) => void;
}

export default function RevisionHistory({ entityName, entityId, onRestore }: RevisionHistoryProps) {
  const auth = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState('');
  const revisionsQuery = useQuery({
    queryKey: ['audit-revisions', entityName, entityId],
    enabled: expanded && Boolean(entityId),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ search: entityId || '', limit: '100' });
      const response = await apiClient.get<AuditRevision[]>(`/audit/logs?${params}`, { ...authConfig(auth.user?.access_token), signal });
      return unwrapApiData(response.data) ?? [];
    },
  });
  const revisions = useMemo(() => (revisionsQuery.data ?? []).filter((item) => (
    item.entity_id === entityId
    && item.entity_name.toLocaleLowerCase('id-ID') === entityName.toLocaleLowerCase('id-ID')
    && ['CREATE', 'UPDATE'].includes(item.action.toUpperCase())
    && item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
  )), [entityId, entityName, revisionsQuery.data]);

  if (!entityId) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700" aria-label={`Riwayat perubahan ${entityName}`}>
      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 bg-slate-50 px-4 text-left font-black text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:bg-slate-800/60 dark:text-white dark:hover:bg-slate-800" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
        <span className="flex items-center gap-2"><History className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Riwayat perubahan</span>
        <ChevronDown className={`size-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-300">Memulihkan revisi akan mengisi form saat ini. Data baru tersimpan hanya setelah tombol Simpan ditekan, sehingga histori lama tetap immutable.</p>
          {notice && <AdminAlert tone="success">{notice}</AdminAlert>}
          {revisionsQuery.isLoading ? <AdminLoadingState label="Memuat riwayat perubahan..." /> : revisionsQuery.isError ? <AdminAlert>{getApiErrorMessage(revisionsQuery.error, 'Gagal memuat riwayat perubahan.')}</AdminAlert> : revisions.length === 0 ? <AdminEmptyState icon={History} title="Belum ada revisi" description="Audit create/update untuk data ini belum tersedia." /> : (
            <ol className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {revisions.map((revision, index) => (
                <li key={revision.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                  <div><p className="font-black text-slate-950 dark:text-white">{index === 0 ? 'Revisi terbaru' : revision.action.toUpperCase()}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{new Date(revision.created_at).toLocaleString('id-ID')} · actor {revision.actor_id || 'system'} · hash {revision.payload_hash ? revision.payload_hash.slice(0, 12) : 'legacy'}</p></div>
                  <button type="button" onClick={() => { onRestore(revision.payload as Record<string, unknown>); setNotice(`Revisi ${new Date(revision.created_at).toLocaleString('id-ID')} dimuat ke form. Periksa lalu simpan sebagai revisi baru.`); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40"><RotateCcw className="size-4" aria-hidden="true" />Gunakan revisi</button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
