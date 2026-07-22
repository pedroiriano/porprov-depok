import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, Loader2, RotateCcw, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import type { DeletedRecord } from '../../types/master-data';
// INFO: Import table controls
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../common/TableControls';

const entityLabels: Record<DeletedRecord['entity_type'], string> = {
  cabor: 'Cabang Olahraga',
  nomor_tanding: 'Nomor Pertandingan',
  kontingen: 'Kontingen',
  city_guide: 'City Guide',
  media: 'Media',
  venue: 'Venue',
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
  const [feedback, setFeedback] = useState('');
  const requestConfig = () => authConfig(auth.user?.access_token);

  // INFO: Initialize table controls
  const table = useTableControls<RecycleBinSortKey>({ sortKey: 'deleted_at', sortDirection: 'desc', rowsPerPage: 10 });

  // CHANGE: Reset page when search changes
  useEffect(() => {
    table.resetPage();
  }, [search, table.resetPage]);

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
      setFeedback(`${record.display_name} berhasil dipulihkan.`);
      await queryClient.invalidateQueries({ queryKey: ['soft-delete'] });
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, 'Gagal memulihkan data.')),
  });

  const records = deletedQuery.data || [];

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <ArchiveRestore className="h-5 w-5 text-indigo-600" /> Recycle Bin
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data diarsipkan tanpa penghapusan fisik dan dapat dipulihkan sesuai kewenangan.</p>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400" aria-live="polite">
          {records.length} data diarsipkan
        </span>
      </div>

      {feedback && <div role="status" className="rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40 p-3 text-sm text-indigo-800 dark:text-indigo-200">{feedback}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:w-80">
            <span className="sr-only">Cari data di Recycle Bin</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Cari nama, jenis, actor, atau alasan..." 
            />
          </label>

          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.setRowsPerPage}
          />
        </div>

        {deletedQuery.isLoading ? (
          <div className="flex min-h-56 items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="sr-only">Memuat Recycle Bin</span></div>
        ) : deletedQuery.isError ? (
          <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {getApiErrorMessage(deletedQuery.error, 'Gagal memuat Recycle Bin.')}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-4 text-center text-slate-500 dark:text-slate-400">
            <ArchiveRestore className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p>{search ? 'Tidak ada data arsip yang cocok.' : 'Recycle Bin masih kosong.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <tr>
                    <th className="p-4">
                      <SortableHeader<RecycleBinSortKey>
                        label="Data"
                        columnKey="display_name"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<RecycleBinSortKey>
                        label="Jenis"
                        columnKey="entity_type"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<RecycleBinSortKey>
                        label="Diarsipkan"
                        columnKey="deleted_at"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4">
                      <SortableHeader<RecycleBinSortKey>
                        label="Actor & Alasan"
                        columnKey="deleted_by"
                        activeSortKey={table.sortKey}
                        sortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    </th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedData.map((record) => (
                    <tr key={`${record.entity_type}-${record.id}`} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{record.display_name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{entityLabels[record.entity_type]}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{new Date(record.deleted_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{record.deleted_by || 'Tidak diketahui'}</p>
                        <p className="mt-1 max-w-xs text-slate-500 dark:text-slate-400">{record.delete_reason || 'Tanpa alasan'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => restoreMutation.mutate(record)}
                          disabled={restoreMutation.isPending}
                          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                          aria-label={`Pulihkan ${record.display_name}`}
                        >
                          {restoreMutation.isPending && restoreMutation.variables?.id === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          Pulihkan
                        </button>
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
              itemLabel="data diarsipkan"
            />
          </>
        )}
      </div>
    </div>
  );
}
