import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Download, Loader2, RefreshCw, Search, Server, ShieldCheck } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
// INFO: Import table controls
import { useTableControls, usePagination } from '../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../components/common/TableControls';

interface AuditEvent {
  id: string; event_id: string; event_version: string; event_type: string; service_name: string; entity_name: string;
  entity_id: string; action: string; actor_id: string; request_id: string; ip_address: string; payload: unknown; payload_hash: string; created_at: string;
}

type AuditSortKey = 'created_at' | 'actor_id' | 'action' | 'service_name' | 'entity_id';

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function AuditLog() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // INFO: Hook controls
  const table = useTableControls<AuditSortKey>({ sortKey: 'created_at', sortDirection: 'desc', rowsPerPage: 25 });

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (search.trim()) params.set('search', search.trim());
      if (action) params.set('action', action);
      if (service) params.set('service', service);
      const response = await apiClient.get<AuditEvent[]>(`/audit/logs?${params}`, authConfig(token));
      setEvents(unwrapApiData<AuditEvent[]>(response.data) || []);
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Gagal membaca audit log immutable.'));
    } finally { setLoading(false); }
  }, [action, search, service, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 250);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  const services = useMemo(() => [...new Set(events.map((item) => item.service_name))].sort(), [events]);

  // CHANGE: Reset ke halaman 1 saat filter/search/rowsPerPage berubah
  useEffect(() => {
    table.resetPage();
  }, [search, action, service, table.rowsPerPage, table.resetPage]);

  // PERFORMANCE: Sort data secara memoized
  const sortedEvents = useMemo(() => {
    const result = [...events];
    result.sort((a, b) => {
      let comparison = 0;
      switch (table.sortKey) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'actor_id':
          comparison = (a.actor_id || '').localeCompare(b.actor_id || '');
          break;
        case 'action':
          comparison = a.action.localeCompare(b.action);
          break;
        case 'service_name':
          comparison = `${a.service_name}/${a.entity_name}`.localeCompare(`${b.service_name}/${b.entity_name}`);
          break;
        case 'entity_id':
          comparison = (a.event_id || '').localeCompare(b.event_id || '');
          break;
      }
      return table.sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [events, table.sortKey, table.sortDirection]);

  // INFO: Pagination
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedEvents,
    table.currentPage,
    table.rowsPerPage
  );

  const exportCSV = () => {
    const header = ['created_at','event_id','event_version','event_type','actor_id','action','service_name','entity_name','entity_id','request_id','ip_address','payload_hash'];
    const rows = events.map((item) => header.map((key) => csvCell(item[key as keyof AuditEvent])).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `porprov-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Immutable Evidence Trail</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Sistem Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Dedup event ID, payload SHA-256, actor, request correlation, dan append-only database trigger.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => void loadEvents()} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="mr-2 h-4 w-4" />Perbarui
          </button>
          <button type="button" onClick={exportCSV} disabled={events.length === 0} className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-bold text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors">
            <Download className="mr-2 h-4 w-4" />Export CSV
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Toolbar — pencarian, filter aksi, filter service, rows per page */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-700 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            {/* Search input */}
            <label className="relative">
              <span className="sr-only">Cari audit</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
                placeholder="Aktor, entitas, ID..."
              />
            </label>

            {/* Filter aksi */}
            <label className="relative">
              <span className="sr-only">Aksi</span>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Semua aksi</option>
                {['CREATE','UPDATE','DELETE','LIVESCORE_UPDATED','LIVESCORE_CORRECTED','MEDAL_SUBMISSION_CREATED','MEDAL_SUBMISSION_VERIFIED','MEDAL_SUBMISSION_REJECTED','MEDAL_SUBMISSION_OFFICIAL'].map((value) => (
                  <option key={value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{value}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>

            {/* Filter service */}
            <label className="relative">
              <span className="sr-only">Service</span>
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Semua service</option>
                {services.map((value) => (
                  <option key={value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{value}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <RowsPerPageSelector
              value={table.rowsPerPage}
              onChange={table.setRowsPerPage}
            />

            {/* DB status */}
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Audit DB terhubung</span>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div role="alert" className="m-4 flex gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />{error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="sr-only">Memuat audit log</span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-14 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-900 dark:text-white">Belum ada event audit</h2>
            <p className="mt-2 text-sm text-slate-500">Event outbox akan tampil setelah diproses subscriber.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <tr>
                    <th className="p-4">
                      <SortableHeader<AuditSortKey>
                        label="Waktu"
                        columnKey="created_at"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<AuditSortKey>
                        label="Aktor"
                        columnKey="actor_id"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<AuditSortKey>
                        label="Aksi"
                        columnKey="action"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<AuditSortKey>
                        label="Service / Entitas"
                        columnKey="service_name"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<AuditSortKey>
                        label="Correlation"
                        columnKey="entity_id"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm">
                        <p className="font-bold text-slate-900 dark:text-white">{new Date(item.created_at).toLocaleString('id-ID')}</p>
                        <p className="mt-1 text-xs text-slate-400">v{item.event_version}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{item.actor_id || 'legacy/system'}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-black text-indigo-700 dark:text-indigo-300">{item.action}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.service_name} / {item.entity_name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{item.entity_id}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <p>event {item.event_id}</p>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">request {item.request_id || '—'}</p>
                      </td>
                      <td className="p-4">
                        <p className="max-w-48 truncate font-mono text-xs text-slate-700 dark:text-slate-300" title={item.payload_hash}>{item.payload_hash || 'legacy/no hash'}</p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400">Payload</summary>
                          <pre className="mt-2 max-w-md overflow-auto rounded bg-slate-950 p-3 text-xs text-emerald-300">{JSON.stringify(item.payload, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={table.currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startItem={startItem}
              endItem={endItem}
              onPageChange={table.setCurrentPage}
              itemLabel="event"
              footerNote="database menolak UPDATE dan DELETE"
            />
          </>
        )}
      </section>
    </div>
  );
}
