import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, Loader2, RotateCcw, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import type { DeletedRecord } from '../../types/master-data';
// INFO: Import table controls
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';

const entityLabels: Record<DeletedRecord['entity_type'], string> = {
  cabor: 'Cabang Olahraga',
  nomor_tanding: 'Nomor Pertandingan',
  kontingen: 'Kontingen',
  city_guide: 'Panduan Kota',
  media: 'Media',
  hero: 'Tampilan Utama',
  venue: 'Lokasi Pertandingan',
  match: 'Jadwal Pertandingan',
};

type RecycleBinSortKey = 'display_name' | 'entity_type' | 'deleted_at' | 'deleted_by';

function restorePath(record: DeletedRecord) {
  if (record.entity_type === 'venue') return `/venues/${record.id}/restore`;
  if (record.entity_type === 'match') return `/schedule/matches/${record.id}/restore`;
  return `/master-data/deleted/${record.entity_type}/${record.id}/restore`;
}

export default function RecycleBin() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'danger' | 'success'; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const requestConfig = () => authConfig(auth.user?.access_token);

  // INFO: Initialize table controls
  const table = useTableControls<RecycleBinSortKey>({ sortKey: 'deleted_at', sortDirection: 'desc', rowsPerPage: 10 });
  const { resetPage } = table;

  // CHANGE: Reset page when search changes
  useEffect(() => {
    resetPage();
  }, [search, resetPage]);

  const deletedQuery = useQuery({
    queryKey: ['soft-delete', 'recycle-bin'],
    queryFn: async () => {
      const [master, venues, matches] = await Promise.all([
        apiClient.get<DeletedRecord[] | { data: DeletedRecord[] }>('/master-data/deleted', requestConfig()),
        apiClient.get<DeletedRecord[] | { data: DeletedRecord[] }>('/venues/deleted', requestConfig()),
        apiClient.get<DeletedRecord[] | { data: DeletedRecord[] }>('/schedule/matches/deleted', requestConfig()),
      ]);
      return [
        ...(unwrapApiData(master.data) || []),
        ...(unwrapApiData(venues.data) || []),
        ...(unwrapApiData(matches.data) || []),
      ];
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (record: DeletedRecord) => {
      await apiClient.post(restorePath(record), undefined, requestConfig());
      return record;
    },
    onSuccess: async (record) => {
      setFeedback({ tone: 'success', message: `${record.display_name} berhasil dipulihkan.` });
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(`${record.entity_type}:${record.id}`);
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ['soft-delete'] });
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => setFeedback({ tone: 'danger', message: getApiErrorMessage(error, 'Gagal memulihkan data.') }),
  });

  const requestRestore = (record: DeletedRecord) => {
    if (!window.confirm(`Pulihkan ${record.display_name} ke daftar aktif?`)) return;
    setFeedback(null);
    restoreMutation.mutate(record);
  };

  const records = useMemo(() => deletedQuery.data ?? [], [deletedQuery.data]);

  // PERFORMANCE: Memoized search filter
  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((record) =>
      `${entityLabels[record.entity_type]} ${record.display_name} ${record.delete_reason || ''} ${record.deleted_by || ''}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [records, search]);

  // PERFORMANCE: Memoized sorting logic
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      switch (table.sortKey) {
        case 'display_name':
          comparison = a.display_name.localeCompare(b.display_name, 'id');
          break;
        case 'entity_type':
          comparison = entityLabels[a.entity_type].localeCompare(entityLabels[b.entity_type], 'id');
          break;
        case 'deleted_at':
          comparison = new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime();
          break;
        case 'deleted_by':
          comparison = (a.deleted_by || '').localeCompare(b.deleted_by || '', 'id');
          break;
      }
      return table.sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, table.sortKey, table.sortDirection]);

  // INFO: Paginate sorted records
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedRecords,
    table.currentPage,
    table.rowsPerPage
  );

  const recordKey = (record: DeletedRecord) => `${record.entity_type}:${record.id}`;

  const restoreSelected = async () => {
    const targets = records.filter((record) => selectedIds.has(recordKey(record)));
    if (targets.length === 0) return;
    if (!window.confirm(`Pulihkan ${targets.length} data terpilih ke daftar aktif?`)) return;

    const restoredKeys: string[] = [];
    try {
      setRestoring(true);
      setFeedback(null);
      for (const record of targets) {
        await apiClient.post(restorePath(record), undefined, requestConfig());
        restoredKeys.push(recordKey(record));
      }
      await queryClient.invalidateQueries({ queryKey: ['soft-delete'] });
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setSelectedIds(new Set());
      setFeedback({ tone: 'success', message: `${restoredKeys.length} data berhasil dipulihkan.` });
    } catch (error) {
      if (restoredKeys.length > 0) {
        await queryClient.invalidateQueries({ queryKey: ['soft-delete'] });
        await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
        setSelectedIds((current) => {
          const next = new Set(current);
          restoredKeys.forEach((key) => next.delete(key));
          return next;
        });
      }
      setFeedback({ tone: 'danger', message: `${restoredKeys.length} data berhasil dipulihkan sebelum proses berhenti. ${getApiErrorMessage(error, 'Sebagian data gagal dipulihkan.')}` });
    } finally {
      setRestoring(false);
    }
  };

  const columns = useMemo<Array<AdminDataTableColumn<DeletedRecord, RecycleBinSortKey>>>(() => [
    { key: 'name', label: 'Data', sortKey: 'display_name', render: (record) => <span className="font-black text-slate-950 dark:text-white">{record.display_name}</span> },
    { key: 'type', label: 'Jenis', sortKey: 'entity_type', render: (record) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{entityLabels[record.entity_type]}</span> },
    { key: 'deleted', label: 'Diarsipkan', sortKey: 'deleted_at', className: 'whitespace-nowrap', render: (record) => <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(record.deleted_at).toLocaleString('id-ID')}</span> },
    { key: 'actor', label: 'Pelaku dan Alasan', sortKey: 'deleted_by', className: 'min-w-72', render: (record) => <div className="text-sm"><p className="font-bold text-slate-700 dark:text-slate-200">{record.deleted_by || 'Tidak diketahui'}</p><p className="mt-1 max-w-sm text-slate-500 dark:text-slate-400">{record.delete_reason || 'Tanpa alasan'}</p></div> },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Pemulihan data"
        title="Arsip Terhapus"
        description="Data diarsipkan tanpa penghapusan fisik dan dapat dipulihkan sesuai kewenangan."
        actions={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-live="polite"><ArchiveRestore className="size-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />{records.length} data diarsipkan</span>}
      />

      {feedback && <AdminAlert tone={feedback.tone}>{feedback.message}</AdminAlert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari data di Arsip Terhapus</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              maxLength={80}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Cari nama, jenis, pelaku, atau alasan..."
            />
          </label>

          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.setRowsPerPage}
          />
        </div>

        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onAction={() => void restoreSelected()} deleting={restoring} itemLabel="data" actionLabel="Pulihkan terpilih" loadingLabel="Memulihkan..." actionTone="primary" actionIcon={<RotateCcw className="size-4" aria-hidden="true" />} />

        <AdminDataTable<DeletedRecord, RecycleBinSortKey>
          caption="Daftar data yang diarsipkan"
          rows={paginatedData}
          columns={columns}
          getRowId={recordKey}
          getRowLabel={(record) => record.display_name}
          selectionLabel="data arsip"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          loading={deletedQuery.isLoading}
          loadingLabel="Memuat Arsip Terhapus..."
          error={deletedQuery.isError ? getApiErrorMessage(deletedQuery.error, 'Gagal memuat Arsip Terhapus.') : ''}
          onRetry={() => void deletedQuery.refetch()}
          emptyTitle={search ? 'Data arsip tidak ditemukan' : 'Arsip Terhapus masih kosong'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Data yang diarsipkan akan tampil di sini dan tetap dapat dipulihkan.'}
          minWidthClassName="min-w-[920px]"
          rowActions={(record) => <button type="button" onClick={() => requestRestore(record)} disabled={restoreMutation.isPending || restoring} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-black text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40" aria-label={`Pulihkan ${record.display_name}`}>{restoreMutation.isPending && restoreMutation.variables && recordKey(restoreMutation.variables) === recordKey(record) ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}Pulihkan</button>}
        />

        {!deletedQuery.isLoading && !deletedQuery.isError && totalItems > 0 && <TablePagination currentPage={table.currentPage} totalPages={totalPages} totalItems={totalItems} startItem={startItem} endItem={endItem} onPageChange={table.setCurrentPage} itemLabel="data diarsipkan" />}
      </div>
    </div>
  );
}
