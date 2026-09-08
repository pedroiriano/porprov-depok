import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Search } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../Modal';
import { RowsPerPageSelector, TablePagination } from '../common/TableControls';
import { AdminMediaGrid } from '../cuba/AdminMediaGrid';
import { AdminAlert, AdminEmptyState, AdminLoadingState } from '../cuba/AdminPrimitives';
import { useTableControls } from '../../hooks/useTableControls';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  normalizeStoredMediaUrl,
} from '../../lib/api';
import type { MediaAsset } from '../../types/master-data';
import MediaUploadButton from './MediaUploadButton';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}
interface MediaListResponse { data: MediaAsset[]; page: number; per_page: number; total_items: number; total_pages: number }

export default function MediaSelectorModal({ isOpen, onClose, onSelect }: MediaSelectorModalProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    resetPage,
  } = useTableControls<'file_name'>({ rowsPerPage: 25 });

  const mediaQuery = useQuery({
    queryKey: ['media-assets', 'selector', currentPage, rowsPerPage, debouncedSearch],
    enabled: isOpen,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ page: String(currentPage), per_page: String(rowsPerPage), sort: 'created_at', order: 'desc' });
      if (debouncedSearch) params.set('q', debouncedSearch);
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
      setUploadError('');
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => setUploadError(getApiErrorMessage(error, 'Gagal mengunggah gambar.')),
  });

  const media = useMemo(() => mediaQuery.data?.data ?? [], [mediaQuery.data]);
  const totalItems = mediaQuery.data?.total_items ?? 0;
  const totalPages = Math.max(1, mediaQuery.data?.total_pages ?? 1);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => resetPage(), [debouncedSearch, resetPage]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, setCurrentPage, totalPages]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Media"
      description="Gunakan gambar aktif dari Pustaka Media atau unggah gambar baru."
      maxWidth="4xl"
      closeDisabled={uploadMutation.isPending}
    >
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700 dark:bg-slate-800/50">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Cari media</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama file..."
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <RowsPerPageSelector value={rowsPerPage} onChange={setRowsPerPage} />
            <MediaUploadButton compact busy={uploadMutation.isPending} onUpload={(file, options) => uploadMutation.mutateAsync({ file, options })} onError={setUploadError} />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-300">JPG, PNG, atau WebP · sumber maksimal 20 MiB · hasil maksimal 3 MiB · penurunan kualitas hanya setelah persetujuan.</p>
        {uploadError && <AdminAlert>{uploadError}</AdminAlert>}

        {mediaQuery.isLoading ? (
          <AdminLoadingState label="Memuat Pustaka Media..." />
        ) : mediaQuery.isError ? (
          <AdminAlert>{getApiErrorMessage(mediaQuery.error, 'Gagal memuat Pustaka Media.')}</AdminAlert>
        ) : media.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-3 sm:p-4">
              <AdminMediaGrid
                items={media}
                onSelect={(item) => {
                  onSelect(normalizeStoredMediaUrl(item.file_url));
                  onClose();
                }}
              />
            </div>
            <TablePagination
              startItem={startItem}
              endItem={endItem}
              totalItems={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemLabel="media"
            />
          </div>
        ) : (
          <AdminEmptyState
            icon={ImageIcon}
            title={debouncedSearch ? 'Media tidak ditemukan' : 'Belum ada media'}
            description={debouncedSearch ? 'Coba kata kunci nama file yang berbeda.' : 'Unggah gambar pertama untuk melanjutkan.'}
          />
        )}
      </div>
    </Modal>
  );
}
