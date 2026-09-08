import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileImage, FolderOpen, HardDrive, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../Modal';
import { RowsPerPageSelector, TablePagination } from '../common/TableControls';
import { AdminMediaGrid } from '../cuba/AdminMediaGrid';
import { AdminAlert, AdminEmptyState, AdminErrorState, AdminLoadingState, AdminPageHeader } from '../cuba/AdminPrimitives';
import { useTableControls } from '../../hooks/useTableControls';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  resolveMediaUrl,
} from '../../lib/api';
import { formatMediaSize } from '../../lib/mediaFormat';
import type { MediaAsset } from '../../types/master-data';
import MediaUploadButton from './MediaUploadButton';

type MediaSort = 'newest' | 'oldest' | 'name';
interface MediaListResponse { data: MediaAsset[]; page: number; per_page: number; total_items: number; total_pages: number; library_items: number; library_bytes: number; total_formats: number }

export default function MediaLibrary() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<MediaSort>('newest');
  const [archiveTarget, setArchiveTarget] = useState<MediaAsset | null>(null);
  const [archiveReason, setArchiveReason] = useState('Diarsipkan melalui Pustaka Media');
  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    resetPage,
  } = useTableControls<'file_name'>({ rowsPerPage: 10 });

  const mediaQuery = useQuery({
    queryKey: ['media-assets', currentPage, rowsPerPage, debouncedSearch, sortBy],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(currentPage), per_page: String(rowsPerPage) });
      if (debouncedSearch) params.set('q', debouncedSearch);
      params.set('sort', sortBy === 'name' ? 'name' : 'created_at');
      params.set('order', sortBy === 'oldest' || sortBy === 'name' ? 'asc' : 'desc');
      const response = await apiClient.get<MediaListResponse>(
        `/master-data/media?${params}`,
        { ...authConfig(auth.user?.access_token), signal },
      );
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: { signal: AbortSignal; onProgress: (percentage: number) => void } }) => {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/master-data/media/upload', formData, {
        ...authConfig(auth.user?.access_token),
        signal: options.signal,
        onUploadProgress: (event) => options.onProgress(event.total ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : 0),
      });
    },
    onSuccess: async () => {
      setActionError('');
      setNotice('Gambar berhasil diunggah.');
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'Gagal mengunggah gambar.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ item, reason }: { item: MediaAsset; reason: string }) => {
      await apiClient.delete(`/master-data/media/${item.id}`, {
        ...authConfig(auth.user?.access_token),
        data: { reason },
      });
      return item;
    },
    onSuccess: async (item) => {
      setActionError('');
      setNotice(`${item.file_name} dipindahkan ke Arsip Terhapus.`);
      setArchiveTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['media-assets'] }),
        queryClient.invalidateQueries({ queryKey: ['soft-delete'] }),
      ]);
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'Gagal mengarsipkan media.')),
  });

  const copyToClipboard = async (item: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(resolveMediaUrl(item.file_url));
      setActionError('');
      setNotice(`URL ${item.file_name} berhasil disalin.`);
    } catch {
      setActionError('Peramban tidak mengizinkan akses papan klip.');
    }
  };

  const media = useMemo(() => mediaQuery.data?.data ?? [], [mediaQuery.data]);
  const totalItems = mediaQuery.data?.total_items ?? 0;
  const totalPages = Math.max(1, mediaQuery.data?.total_pages ?? 1);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);
  const totalBytes = mediaQuery.data?.library_bytes ?? 0;
  const totalFormats = mediaQuery.data?.total_formats ?? 0;
  const isMutating = uploadMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => resetPage(), [debouncedSearch, resetPage, sortBy]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, setCurrentPage, totalPages]);

  return (
    <section aria-labelledby="media-library-title">
      <AdminPageHeader
        eyebrow="Aset Konten PORPROV"
        title="Pustaka Media"
        description="Kelola gambar aktif untuk tampilan utama, cabang olahraga, lokasi pertandingan, dan Panduan Kota dari satu galeri terkontrol."
        actions={(
          <MediaUploadButton
            busy={isMutating}
            onUpload={(file, options) => uploadMutation.mutateAsync({ file, options })}
            onError={setActionError}
            onNotice={setNotice}
          />
        )}
      />

      <h1 id="media-library-title" className="sr-only">Pustaka Media</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200"><FolderOpen className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Media aktif</p><p className="text-2xl font-black text-slate-950 dark:text-white">{mediaQuery.data?.library_items ?? 0}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200"><HardDrive className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Ukuran tersimpan</p><p className="text-xl font-black text-slate-950 dark:text-white">{formatMediaSize(totalBytes)}</p></div></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"><FileImage className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Format aktif</p><p className="text-2xl font-black text-slate-950 dark:text-white">{totalFormats}</p></div></div>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {actionError && <AdminAlert>{actionError}</AdminAlert>}
        {notice && <AdminAlert tone="success">{notice}</AdminAlert>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative block min-w-0 flex-1 lg:max-w-md">
              <span className="sr-only">Cari media</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama file..."
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Urutkan</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as MediaSort)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="name">Nama A–Z</option>
              </select>
            </label>
          </div>
          <RowsPerPageSelector value={rowsPerPage} onChange={setRowsPerPage} />
        </div>

        <div className="p-4 sm:p-5">
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">JPG, PNG, atau WebP · sumber maksimal 20 MiB · hasil otomatis maksimal 3 MiB · penurunan kualitas selalu meminta persetujuan · pengarsipan tidak menghapus file fisik.</p>
          {mediaQuery.isLoading ? (
            <AdminLoadingState label="Memuat Pustaka Media..." />
          ) : mediaQuery.isError ? (
            <AdminErrorState message={getApiErrorMessage(mediaQuery.error, 'Gagal memuat Pustaka Media.')} onRetry={() => void mediaQuery.refetch()} />
          ) : media.length > 0 ? (
            <AdminMediaGrid items={media} onCopy={(item) => void copyToClipboard(item)} onArchive={setArchiveTarget} busy={deleteMutation.isPending} />
          ) : (
            <AdminEmptyState icon={ImageIcon} title={debouncedSearch ? 'Media tidak ditemukan' : 'Belum ada media'} description={debouncedSearch ? 'Coba kata kunci pencarian yang berbeda.' : 'Unggah gambar pertama untuk mulai membangun galeri.'} />
          )}
        </div>

        {!mediaQuery.isLoading && !mediaQuery.isError && totalItems > 0 && (
          <TablePagination
            startItem={startItem}
            endItem={endItem}
            totalItems={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemLabel="media"
          />
        )}
      </div>

      <Modal isOpen={archiveTarget !== null} onClose={() => !deleteMutation.isPending && setArchiveTarget(null)} title="Arsipkan media" description="Media tetap tersimpan dan dapat dipulihkan dari Arsip Terhapus." closeDisabled={deleteMutation.isPending}>
        <form
          className="space-y-4 p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!archiveTarget) return;
            deleteMutation.mutate({ item: archiveTarget, reason: archiveReason.trim() || 'Diarsipkan melalui Pustaka Media' });
          }}
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">Anda akan mengarsipkan <strong className="text-slate-900 dark:text-white">{archiveTarget?.file_name}</strong>.</p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Alasan pengarsipan</span>
            <textarea required maxLength={240} rows={3} value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setArchiveTarget(null)} disabled={deleteMutation.isPending} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button>
            <button type="submit" disabled={deleteMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50">{deleteMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} {deleteMutation.isPending ? 'Mengarsipkan...' : 'Arsipkan media'}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
