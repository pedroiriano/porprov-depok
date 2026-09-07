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
  entity_id: string; action: string; actor_id: string; request_id: string; ip_address: string; payload: unknown; payload_hash: string; created_at: string;
}
interface User { id: string; username: string; full_name: string }
type AuditSortKey = 'created_at' | 'actor_id' | 'action' | 'service_name' | 'entity_id';

const emptySelection = new Set<string>();
const ignoreSelection = () => undefined;
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function actionBadge(action: string) {
  const style = action.includes('REJECTED') || action.includes('DELETE')
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
    : action.includes('CREATE') || action.includes('OFFICIAL')
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
      : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${style}`}>{action}</span>;
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
      const [eventsRes, usersRes] = await Promise.all([
        apiClient.get<AuditEvent[]>(`/audit/logs?${params}`, authConfig(token)),
        apiClient.get<User[]>('/users', authConfig(token)).catch(() => ({ data: [] })),
      ]);
      const fetchedEvents = unwrapApiData<AuditEvent[]>(eventsRes.data) || [];
      const fetchedUsers = unwrapApiData<User[]>(usersRes.data) || [];
      setEvents(fetchedEvents);
      setUsersMap(Object.fromEntries(fetchedUsers.map((user) => [user.id, user.username])));
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Gagal membaca audit log immutable.'));
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

  const exportCSV = () => {
    const header = ['created_at','event_id','event_version','event_type','actor_id','action','service_name','entity_name','entity_id','request_id','ip_address','payload_hash'];
    const rows = events.map((item) => header.map((key) => csvCell(item[key as keyof AuditEvent])).join(','));
    const url = URL.createObjectURL(new Blob([[header.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `porprov-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<Array<AdminDataTableColumn<AuditEvent, AuditSortKey>>>(() => [
    { key: 'created_at', label: 'Waktu', sortKey: 'created_at', render: (item) => <div><p className="font-black text-slate-950 dark:text-white">{new Date(item.created_at).toLocaleString('id-ID')}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">event v{item.event_version}</p></div> },
    { key: 'actor_id', label: 'Aktor', sortKey: 'actor_id', render: (item) => <span className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">{usersMap[item.actor_id] || item.actor_id || 'legacy/system'}</span> },
    { key: 'action', label: 'Aksi', sortKey: 'action', render: (item) => actionBadge(item.action) },
    { key: 'service_name', label: 'Service / Entitas', sortKey: 'service_name', render: (item) => <div><p className="font-black text-slate-950 dark:text-white">{item.service_name} / {item.entity_name}</p><p className="mt-1 break-all font-mono text-xs text-slate-500 dark:text-slate-400">{item.entity_id}</p></div> },
    { key: 'entity_id', label: 'Correlation', sortKey: 'entity_id', render: (item) => <div className="max-w-56 font-mono text-xs text-slate-700 dark:text-slate-200"><p className="truncate" title={item.event_id}>event {item.event_id}</p><p className="mt-1 truncate text-slate-500 dark:text-slate-400" title={item.request_id}>request {item.request_id || '—'}</p></div> },
  ], [usersMap]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="Immutable evidence trail" title="Sistem Audit Log" description="Telusuri actor, request correlation, event ID, dan hash payload dari penyimpanan append-only yang menolak perubahan atau penghapusan." actions={<><button type="button" onClick={() => void loadEvents()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className="size-4" aria-hidden="true" />Perbarui</button><button type="button" onClick={exportCSV} disabled={events.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Export CSV</button></>} />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan audit"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Event ditemukan</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{events.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Service tercatat</p><p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-200">{services.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Payload ber-hash</p><p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">{events.filter((item) => Boolean(item.payload_hash)).length}</p></div></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <label><span className="sr-only">Cari audit</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Aktor, entitas, ID..." /></label>
            <label className="relative"><span className="sr-only">Aksi</span><select value={action} onChange={(event) => setAction(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><option value="">Semua aksi</option>{['CREATE','UPDATE','DELETE','LIVESCORE_UPDATED','LIVESCORE_CORRECTED','MEDAL_SUBMISSION_CREATED','MEDAL_SUBMISSION_VERIFIED','MEDAL_SUBMISSION_REJECTED','MEDAL_SUBMISSION_OFFICIAL'].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></label>
            <label className="relative"><span className="sr-only">Service</span><select value={service} onChange={(event) => setService(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><option value="">Semua service</option>{services.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-4"><RowsPerPageSelector value={table.rowsPerPage} onChange={table.setRowsPerPage} /><div className="flex min-h-11 items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-200"><Server className="size-4" aria-hidden="true" />Audit DB terhubung</div></div>
        </div>
        {error && <div className="m-4"><AdminAlert tone="danger">{error}</AdminAlert></div>}
        <AdminDataTable caption="Audit log PORPROV" rows={pagination.paginatedData} columns={columns} getRowId={(item) => item.id} sortKey={table.sortKey} sortDirection={table.sortDirection} onSort={table.handleSort} selectedIds={emptySelection} onSelectedIdsChange={ignoreSelection} selectionEnabled={false} loading={loading} loadingLabel="Memuat audit log..." error="" emptyTitle="Belum ada event audit" emptyDescription="Event outbox akan tampil setelah diproses subscriber." minWidthClassName="min-w-[980px]" rowActions={(item) => <button type="button" onClick={() => setDetailEvent(item)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-200 dark:hover:bg-blue-950/40" aria-label={`Lihat detail event ${item.event_id}`}><Eye className="size-4" aria-hidden="true" />Detail</button>} />
        {!loading && events.length > 0 && <TablePagination currentPage={table.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} startItem={pagination.startItem} endItem={pagination.endItem} onPageChange={table.setCurrentPage} itemLabel="event" footerNote="database menolak UPDATE dan DELETE" />}
      </section>

      <Modal isOpen={Boolean(detailEvent)} onClose={() => setDetailEvent(null)} title="Detail Event Audit" description="Payload ditampilkan untuk pemeriksaan terotorisasi dan tidak dapat diubah." maxWidth="3xl">
        {detailEvent && <div className="space-y-5 p-4 sm:p-6"><dl className="grid gap-3 sm:grid-cols-2">{[['Event ID', detailEvent.event_id], ['Request ID', detailEvent.request_id || '—'], ['Actor', usersMap[detailEvent.actor_id] || detailEvent.actor_id || 'legacy/system'], ['Service', `${detailEvent.service_name} / ${detailEvent.entity_name}`], ['Entity ID', detailEvent.entity_id], ['Payload SHA-256', detailEvent.payload_hash || 'legacy/no hash']].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</dt><dd className="mt-1 break-all font-mono text-sm text-slate-900 dark:text-white">{value}</dd></div>)}</dl><div><h3 className="font-black text-slate-950 dark:text-white">Payload</h3><pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">{JSON.stringify(detailEvent.payload, null, 2)}</pre></div><div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700"><button type="button" onClick={() => setDetailEvent(null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Tutup</button></div></div>}
      </Modal>
    </div>
  );
}
