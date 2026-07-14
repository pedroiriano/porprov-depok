import { useState } from 'react';
import { ArchiveRestore, Loader2, RotateCcw, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import type { DeletedRecord } from '../../types/master-data';

const entityLabels: Record<DeletedRecord['entity_type'], string> = {
  cabor: 'Cabang Olahraga',
  nomor_tanding: 'Nomor Pertandingan',
  kontingen: 'Kontingen',
  city_guide: 'City Guide',
  media: 'Media',
  venue: 'Venue',
  match: 'Jadwal Pertandingan',
};

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
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
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
  const filteredRecords = (() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((record) =>
      `${entityLabels[record.entity_type]} ${record.display_name} ${record.delete_reason || ''} ${record.deleted_by || ''}`
        .toLowerCase()
        .includes(keyword),
    );
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary">
            <ArchiveRestore className="h-5 w-5 text-indigo-600" /> Recycle Bin
          </h2>
          <p className="mt-1 text-sm text-text-muted">Data diarsipkan tanpa penghapusan fisik dan dapat dipulihkan sesuai kewenangan.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600" aria-live="polite">
          {records.length} data diarsipkan
        </span>
      </div>

      {feedback && <div role="status" className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">{feedback}</div>}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <label className="relative block max-w-md">
            <span className="sr-only">Cari data di Recycle Bin</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="form-input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, jenis, actor, atau alasan..." />
          </label>
        </div>

        {deletedQuery.isLoading ? (
          <div className="flex min-h-56 items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="sr-only">Memuat Recycle Bin</span></div>
        ) : deletedQuery.isError ? (
          <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {getApiErrorMessage(deletedQuery.error, 'Gagal memuat Recycle Bin.')}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-4 text-center text-slate-500">
            <ArchiveRestore className="h-10 w-10 text-slate-300" />
            <p>{search ? 'Tidak ada data arsip yang cocok.' : 'Recycle Bin masih kosong.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
                <tr><th className="p-4">Data</th><th className="p-4">Jenis</th><th className="p-4">Diarsipkan</th><th className="p-4">Actor & alasan</th><th className="p-4 text-right">Aksi</th></tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={`${record.entity_type}-${record.id}`} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{record.display_name}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{entityLabels[record.entity_type]}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{new Date(record.deleted_at).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-sm"><p className="font-medium text-slate-700 dark:text-slate-200">{record.deleted_by || 'Tidak diketahui'}</p><p className="mt-1 max-w-xs text-slate-500">{record.delete_reason || 'Tanpa alasan'}</p></td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => restoreMutation.mutate(record)}
                        disabled={restoreMutation.isPending}
                        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}
