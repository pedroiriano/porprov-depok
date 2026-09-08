import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Eye, RefreshCw, Server } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import { RowsPerPageSelector, TablePagination } from '../components/common/TableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../components/cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { usePagination, useTableControls } from '../hooks/useTableControls';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';

interface AuditEvent {
  id: string; event_id: string; event_version: string; event_type: string; service_name: string; entity_name: string;
  entity_id: string; action: string; actor_id: string; actor_username: string; actor_display_name: string; actor_kind: string;
  request_id: string; ip_address: string; payload: unknown; payload_hash: string; created_at: string;
}
interface UserDirectoryEntry { keycloak_id: string; username: string; full_name: string }
type AuditSortKey = 'created_at' | 'actor_id' | 'action' | 'service_name' | 'entity_id';

const emptySelection = new Set<string>();
const ignoreSelection = () => undefined;
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const actionLabels: Record<string, string> = {
  CREATE: 'Dibuat', UPDATE: 'Diubah', DELETE: 'Diarsipkan', RESTORE: 'Dipulihkan',
  LIVESCORE_UPDATED: 'Skor diperbarui', LIVESCORE_CORRECTED: 'Skor dikoreksi',
  MEDAL_SUBMISSION_CREATED: 'Medali diajukan', MEDAL_SUBMISSION_VERIFIED: 'Medali diverifikasi',
  MEDAL_SUBMISSION_REJECTED: 'Medali ditolak', MEDAL_SUBMISSION_OFFICIAL: 'Medali dipublikasikan',
};
const serviceLabels: Record<string, string> = {
  'user-service': 'Pengelolaan pengguna', 'master-data-service': 'Data utama',
  'schedule-service': 'Jadwal pertandingan', 'venue-service': 'Lokasi pertandingan',
  'livescore-service': 'Skor langsung', 'medal-standing-service': 'Perolehan medali',
};
const entityLabels: Record<string, string> = {
  user: 'Pengguna', cabor: 'Cabang olahraga', nomortanding: 'Nomor pertandingan', nomor_tanding: 'Nomor pertandingan',
  venue: 'Lokasi pertandingan', match: 'Jadwal pertandingan', livescore: 'Skor pertandingan',
  medal_submission: 'Pengajuan medali', cityguide: 'Panduan Kota', city_guide: 'Panduan Kota',
  media: 'Pustaka Media', hero: 'Tampilan Utama',
};
const fieldLabels: Record<string, string> = {
  id: 'Nomor data', name: 'Nama', title: 'Judul', description: 'Deskripsi', status: 'Status', kategori: 'Kategori',
  technical_delegate: 'Delegasi teknis', total_medali: 'Jumlah medali', cabor_id: 'Cabang olahraga',
  gender_category: 'Kategori peserta', match_type: 'Tipe pertandingan', region_type: 'Jenis wilayah',
  address: 'Alamat', capacity: 'Kapasitas', facilities: 'Fasilitas', readiness_status: 'Kesiapan',
  contact_person: 'Narahubung', latitude: 'Lintang', longitude: 'Bujur', map_route_url: 'Alamat rute peta',
  match_date: 'Waktu pertandingan', venue_id: 'Lokasi pertandingan', round: 'Babak', participants: 'Peserta',
  highlight_text: 'Teks sorotan', body: 'Isi', is_active: 'Status aktif', image_url: 'Gambar',
  hero_image_url: 'Gambar utama', icon_url: 'Ikon', logo_url: 'Logo', delete_reason: 'Alasan pengarsipan',
};
const entityLabel = (value: string) => entityLabels[value.toLocaleLowerCase('id-ID')] || 'Data lainnya';
const fieldLabel = (value: string) => fieldLabels[value.toLocaleLowerCase('id-ID')] || value.replaceAll('_', ' ');

function safeAuditPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeAuditPayload);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(password|token|secret|credential|cookie|private.?key|file.?data)/i.test(key))
    .map(([key, entry]) => [fieldLabel(key), safeAuditPayload(entry)]));
}

function actionBadge(action: string) {
  const style = action.includes('REJECTED') || action.includes('DELETE')
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
    : action.includes('CREATE') || action.includes('OFFICIAL')
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
      : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${style}`}>{actionLabels[action] || 'Perubahan tercatat'}</span>;
}

export default function AuditLog() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailEvent, setDetailEvent] = useState<AuditEvent | null>(null);
  const table = useTableControls<AuditSortKey>({ sortKey: 'created_at', sortDirection: 'desc', rowsPerPage: 25 });
  const { resetPage } = table;

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (search.trim()) params.set('search', search.trim());
      if (action) params.set('action', action);
      if (service) params.set('service', service);
      const eventsRes = await apiClient.get<AuditEvent[]>(`/audit/logs?${params}`, authConfig(token));
      const fetchedEvents = unwrapApiData<AuditEvent[]>(eventsRes.data) || [];
      const legacyActorIDs = [...new Set(fetchedEvents.filter((item) => !item.actor_username && !item.actor_display_name && item.actor_id).map((item) => item.actor_id))].slice(0, 100);
      const directoryResponse = legacyActorIDs.length > 0
        ? await apiClient.post<UserDirectoryEntry[]>('/user-directory/lookup', { actor_ids: legacyActorIDs }, authConfig(token)).catch(() => ({ data: [] as UserDirectoryEntry[] }))
        : { data: [] as UserDirectoryEntry[] };
      const fetchedUsers = unwrapApiData<UserDirectoryEntry[]>(directoryResponse.data) || directoryResponse.data || [];
      setEvents(fetchedEvents);
      setUsersMap(Object.fromEntries(fetchedUsers.map((user) => [user.keycloak_id, user.full_name || user.username])));
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Gagal membaca Log Audit.'));
    } finally { setLoading(false); }
  }, [action, search, service, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 250);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  useEffect(() => { resetPage(); }, [action, resetPage, search, service, table.rowsPerPage]);

  const services = useMemo(() => [...new Set(events.map((item) => item.service_name))].filter(Boolean).sort(), [events]);
  const sortedEvents = useMemo(() => [...events].sort((first, second) => {
    const values: Record<AuditSortKey, [string | number, string | number]> = {
      created_at: [new Date(first.created_at).getTime(), new Date(second.created_at).getTime()],
      actor_id: [first.actor_id || '', second.actor_id || ''],
      action: [first.action, second.action],
      service_name: [`${first.service_name}/${first.entity_name}`, `${second.service_name}/${second.entity_name}`],
      entity_id: [first.event_id || '', second.event_id || ''],
    };
    const [left, right] = values[table.sortKey];
    const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
    return table.sortDirection === 'asc' ? comparison : -comparison;
  }), [events, table.sortDirection, table.sortKey]);
  const pagination = usePagination(sortedEvents, table.currentPage, table.rowsPerPage);
  const actorLabel = useCallback((item: AuditEvent) => {
    if (item.actor_display_name || item.actor_username) return item.actor_display_name || item.actor_username;
    if (usersMap[item.actor_id]) return usersMap[item.actor_id];
    if (item.actor_kind === 'process') return `Proses otomatis ${actionLabels[item.action]?.toLocaleLowerCase('id-ID') || 'pencatatan data'}`;
    return 'Pelaku tidak tercatat';
  }, [usersMap]);

  const exportCSV = () => {
    const header = ['created_at','event_id','event_version','event_type','actor_username','actor_display_name','actor_id','action','service_name','entity_name','entity_id','request_id','ip_address','payload_hash'];
    const rows = events.map((item) => header.map((key) => csvCell(item[key as keyof AuditEvent])).join(','));
    const url = URL.createObjectURL(new Blob([[header.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `porprov-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<Array<AdminDataTableColumn<AuditEvent, AuditSortKey>>>(() => [
    { key: 'created_at', label: 'Waktu', sortKey: 'created_at', className: 'min-w-40', headerClassName: 'min-w-40', render: (item) => <div><p className="font-black text-slate-950 dark:text-white">{new Date(item.created_at).toLocaleString('id-ID')}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Catatan {item.event_version}</p></div> },
    { key: 'actor_id', label: 'Pelaku', sortKey: 'actor_id', className: 'min-w-32', headerClassName: 'min-w-32', render: (item) => <span className="break-words text-xs text-slate-700 dark:text-slate-200">{actorLabel(item)}</span> },
    { key: 'action', label: 'Aksi', sortKey: 'action', className: 'min-w-36', headerClassName: 'min-w-36', render: (item) => actionBadge(item.action) },
    { key: 'service_name', label: 'Bagian / Data', sortKey: 'service_name', className: 'min-w-56', headerClassName: 'min-w-56', render: (item) => <div><p className="font-black text-slate-950 dark:text-white">{serviceLabels[item.service_name] || 'Layanan pendukung'} / {entityLabel(item.entity_name)}</p><p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{item.entity_id}</p></div> },
    { key: 'entity_id', label: 'Nomor pelacakan', sortKey: 'entity_id', className: 'min-w-52', headerClassName: 'min-w-52', render: (item) => <div className="max-w-56 text-xs text-slate-700 dark:text-slate-200"><p className="truncate" title={item.event_id}>Catatan {item.event_id}</p><p className="mt-1 truncate text-slate-500 dark:text-slate-400" title={item.request_id}>Permintaan {item.request_id || '—'}</p></div> },
  ], [actorLabel]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="Jejak perubahan" title="Log Audit" description="Telusuri pelaku, waktu, bagian data, dan nomor pelacakan dari catatan perubahan yang tidak dapat diubah atau dihapus." actions={<><button type="button" onClick={() => void loadEvents()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className="size-4" aria-hidden="true" />Perbarui</button><button type="button" onClick={exportCSV} disabled={events.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Unduh CSV</button></>} />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan audit"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Perubahan ditemukan</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{events.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Bagian tercatat</p><p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-200">{services.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Catatan terverifikasi</p><p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">{events.filter((item) => Boolean(item.payload_hash)).length}</p></div></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <label><span className="sr-only">Cari catatan</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Pelaku, bagian data, atau nomor..." /></label>
            <label className="relative"><span className="sr-only">Tindakan</span><select value={action} onChange={(event) => setAction(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><option value="">Semua tindakan</option>{['CREATE','UPDATE','DELETE','LIVESCORE_UPDATED','LIVESCORE_CORRECTED','MEDAL_SUBMISSION_CREATED','MEDAL_SUBMISSION_VERIFIED','MEDAL_SUBMISSION_REJECTED','MEDAL_SUBMISSION_OFFICIAL'].map((value) => <option key={value} value={value}>{actionLabels[value]}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></label>
            <label className="relative"><span className="sr-only">Bagian</span><select value={service} onChange={(event) => setService(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><option value="">Semua bagian</option>{services.map((value) => <option key={value} value={value}>{serviceLabels[value] || 'Layanan pendukung'}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-4"><RowsPerPageSelector value={table.rowsPerPage} onChange={table.setRowsPerPage} /><div className="flex min-h-11 items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-200"><Server className="size-4" aria-hidden="true" />Penyimpanan audit terhubung</div></div>
        </div>
        {error && <div className="m-4"><AdminAlert tone="danger">{error}</AdminAlert></div>}
        <AdminDataTable caption="Log audit PORPROV" rows={pagination.paginatedData} columns={columns} getRowId={(item) => item.id} sortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.handleSort} selectedIds={emptySelection} onSelectedIdsChange={ignoreSelection} selectionEnabled={false} loading={loading} loadingLabel="Memuat Log Audit..." error="" emptyTitle="Belum ada catatan audit" emptyDescription="Catatan akan tampil setelah suatu tindakan berhasil diproses." minWidthClassName="min-w-[1120px]" rowActions={(item) => <button type="button" onClick={() => setDetailEvent(item)} className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:hover:bg-blue-950/40" aria-label={`Lihat rincian catatan ${item.event_id}`}><Eye className="size-4" aria-hidden="true" />Rincian</button>} />
        {!loading && events.length > 0 && <TablePagination currentPage={table.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startItem={pagination.startItem} endItem={pagination.endItem} onPageChange={table.setCurrentPage} itemLabel="catatan" footerNote="catatan tidak dapat diubah atau dihapus" />}
      </section>

      <Modal isOpen={Boolean(detailEvent)} onClose={() => setDetailEvent(null)} title="Rincian Catatan Audit" description="Rincian ditampilkan untuk pemeriksaan pengguna berwenang dan tidak dapat diubah." maxWidth="3xl">
        {detailEvent && <div className="space-y-5 p-4 sm:p-6"><dl className="grid gap-3 sm:grid-cols-2">{[['Nomor catatan', detailEvent.event_id], ['Nomor permintaan', detailEvent.request_id || '—'], ['Pelaku', actorLabel(detailEvent)], ['Nomor pelaku teknis', detailEvent.actor_id || 'Tidak tersedia'], ['Bagian', `${serviceLabels[detailEvent.service_name] || 'Layanan pendukung'} / ${entityLabel(detailEvent.entity_name)}`], ['Nomor data', detailEvent.entity_id], ['Sidik data SHA-256', detailEvent.payload_hash || 'Tidak tersedia']].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</dt><dd className="mt-1 break-all text-sm text-slate-900 dark:text-white">{value}</dd></div>)}</dl><div><h3 className="font-black text-slate-950 dark:text-white">Rincian perubahan</h3><pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">{JSON.stringify(safeAuditPayload(detailEvent.payload), null, 2)}</pre></div><div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700"><button type="button" onClick={() => setDetailEvent(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Tutup</button></div></div>}
      </Modal>
    </div>
  );
}
