import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileImage, FolderOpen, HardDrive, Image as ImageIcon, Loader2, Search, Upload } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../Modal';
import { RowsPerPageSelector, TablePagination } from '../common/TableControls';
import { AdminMediaGrid } from '../cuba/AdminMediaGrid';
import { AdminAlert, AdminEmptyState, AdminErrorState, AdminLoadingState, AdminPageHeader } from '../cuba/AdminPrimitives';
import { usePagination, useTableControls } from '../../hooks/useTableControls';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  resolveMediaUrl,
  unwrapApiData,
} from '../../lib/api';
import { formatMediaSize } from '../../lib/mediaFormat';
import type { MediaAsset } from '../../types/master-data';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
type MediaSort = 'newest' | 'oldest' | 'name';

export default function MediaLibrary() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MediaSort>('newest');
  const [archiveTarget, setArchiveTarget] = useState<MediaAsset | null>(null);
  const [archiveReason, setArchiveReason] = useState('Diarsipkan melalui Media Library');
  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    resetPage,
  } = useTableControls<'file_name'>({ rowsPerPage: 10 });

  const mediaQuery = useQuery({
    queryKey: ['media-assets'],
    queryFn: async () => {
      const response = await apiClient.get<MediaAsset[] | { data: MediaAsset[] }>(
        '/master-data/media',
        authConfig(auth.user?.access_token),
      );
      return unwrapApiData(response.data) ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/master-data/media/upload', formData, authConfig(auth.user?.access_token));
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
      setNotice(`${item.file_name} dipindahkan ke Recycle Bin.`);
      setArchiveTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['media-assets'] }),
        queryClient.invalidateQueries({ queryKey: ['soft-delete'] }),
      ]);
    },
    onError: (error) => setActionError(getApiErrorMessage(error, 'Gagal mengarsipkan media.')),
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setNotice('');
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setActionError('Format harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setActionError('Ukuran gambar maksimal 10 MB.');
      return;
    }

    setActionError('');
    uploadMutation.mutate(file);
  };

  const copyToClipboard = async (item: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(resolveMediaUrl(item.file_url));
      setActionError('');
      setNotice(`URL ${item.file_name} berhasil disalin.`);
    } catch {
      setActionError('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const media = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);
  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    const result = query
      ? media.filter((item) => item.file_name.toLocaleLowerCase('id-ID').includes(query))
      : [...media];
    return result.sort((left, right) => {
      if (sortBy === 'name') return left.file_name.localeCompare(right.file_name, 'id-ID');
      const delta = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      return sortBy === 'oldest' ? delta : -delta;
    });
  }, [media, searchQuery, sortBy]);
  const pagination = usePagination(filteredMedia, currentPage, rowsPerPage);
  const totalBytes = media.reduce((total, item) => total + (item.file_size ?? 0), 0);
  const totalFormats = new Set(media.map((item) => item.mime_type).filter(Boolean)).size;
  const isMutating = uploadMutation.isPending || deleteMutation.isPending;

  useEffect(() => resetPage(), [resetPage, searchQuery, sortBy]);

  return (
    <section aria-labelledby="media-library-title">
      <AdminPageHeader
        eyebrow="Aset Konten PORPROV"
        title="Media Library"
        description="Kelola gambar aktif untuk Hero, cabang olahraga, venue, dan City Guide dari satu galeri terkontrol."
        actions={(
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isMutating}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Gambar'}
            </button>
          </>
        )}
      />

      <h1 id="media-library-title" className="sr-only">Media Library</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200"><FolderOpen className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Media aktif</p><p className="text-2xl font-black text-slate-950 dark:text-white">{media.length}</p></div></div>
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
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">JPG, PNG, atau WebP · maksimal 10 MB per file · pengarsipan tidak menghapus file fisik.</p>
          {mediaQuery.isLoading ? (
            <AdminLoadingState label="Memuat Media Library..." />
          ) : mediaQuery.isError ? (
            <AdminErrorState message={getApiErrorMessage(mediaQuery.error, 'Gagal memuat Media Library.')} onRetry={() => void mediaQuery.refetch()} />
          ) : pagination.paginatedData.length > 0 ? (
            <AdminMediaGrid items={pagination.paginatedData} onCopy={(item) => void copyToClipboard(item)} onArchive={setArchiveTarget} busy={deleteMutation.isPending} />
          ) : (
            <AdminEmptyState icon={ImageIcon} title={media.length === 0 ? 'Belum ada media' : 'Media tidak ditemukan'} description={media.length === 0 ? 'Unggah gambar pertama untuk mulai membangun galeri.' : 'Coba kata kunci pencarian yang berbeda.'} />
          )}
        </div>

        {!mediaQuery.isLoading && !mediaQuery.isError && filteredMedia.length > 0 && (
          <TablePagination
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            totalItems={pagination.totalItems}
            currentPage={pagination.safePage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            itemLabel="media"
          />
        )}
      </div>

      <Modal isOpen={archiveTarget !== null} onClose={() => !deleteMutation.isPending && setArchiveTarget(null)} title="Arsipkan media" description="Media tetap tersimpan dan dapat dipulihkan dari Recycle Bin." closeDisabled={deleteMutation.isPending}>
        <form
          className="space-y-4 p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!archiveTarget) return;
            deleteMutation.mutate({ item: archiveTarget, reason: archiveReason.trim() || 'Diarsipkan melalui Media Library' });
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
