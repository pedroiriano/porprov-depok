import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Search, Upload } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../Modal';
import { RowsPerPageSelector, TablePagination } from '../common/TableControls';
import { AdminMediaGrid } from '../cuba/AdminMediaGrid';
import { AdminAlert, AdminEmptyState, AdminLoadingState } from '../cuba/AdminPrimitives';
import { usePagination, useTableControls } from '../../hooks/useTableControls';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  normalizeStoredMediaUrl,
  unwrapApiData,
} from '../../lib/api';
import type { MediaAsset } from '../../types/master-data';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MediaSelectorModal({ isOpen, onClose, onSelect }: MediaSelectorModalProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    resetPage,
  } = useTableControls<'file_name'>({ rowsPerPage: 25 });

  const mediaQuery = useQuery({
    queryKey: ['media-assets'],
    enabled: isOpen,
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
      setUploadError('');
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    },
    onError: (error) => setUploadError(getApiErrorMessage(error, 'Gagal mengunggah gambar.')),
  });

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Format harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError('Ukuran gambar maksimal 10 MB.');
      return;
    }

    setUploadError('');
    uploadMutation.mutate(file);
  };

  const media = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);
  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    if (!query) return media;
    return media.filter((item) => item.file_name.toLocaleLowerCase('id-ID').includes(query));
  }, [media, searchQuery]);
  const pagination = usePagination(filteredMedia, currentPage, rowsPerPage);

  useEffect(() => resetPage(), [resetPage, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Media"
      description="Gunakan gambar aktif dari Media Library atau unggah gambar baru."
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
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Baru'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-300">JPG, PNG, atau WebP · maksimal 10 MB per file.</p>
        {uploadError && <AdminAlert>{uploadError}</AdminAlert>}

        {mediaQuery.isLoading ? (
          <AdminLoadingState label="Memuat Media Library..." />
        ) : mediaQuery.isError ? (
          <AdminAlert>{getApiErrorMessage(mediaQuery.error, 'Gagal memuat Media Library.')}</AdminAlert>
        ) : filteredMedia.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-3 sm:p-4">
              <AdminMediaGrid
                items={pagination.paginatedData}
                onSelect={(item) => {
                  onSelect(normalizeStoredMediaUrl(item.file_url));
                  onClose();
                }}
              />
            </div>
            <TablePagination
              startItem={pagination.startItem}
              endItem={pagination.endItem}
              totalItems={pagination.totalItems}
              currentPage={pagination.safePage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              itemLabel="media"
            />
          </div>
        ) : (
          <AdminEmptyState
            icon={ImageIcon}
            title={media.length === 0 ? 'Belum ada media' : 'Media tidak ditemukan'}
            description={media.length === 0 ? 'Unggah gambar pertama untuk melanjutkan.' : 'Coba kata kunci nama file yang berbeda.'}
          />
        )}
      </div>
    </Modal>
  );
}
