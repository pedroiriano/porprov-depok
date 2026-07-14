import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  normalizeStoredMediaUrl,
  resolveMediaUrl,
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadError, setUploadError] = useState('');

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
    onError: (error) => {
      setUploadError(getApiErrorMessage(error, 'Gagal mengunggah gambar.'));
    },
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploadMutation.isPending) onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, uploadMutation.isPending]);

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

  if (!isOpen || !mounted) return null;

  const media = mediaQuery.data ?? [];
  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup pemilih media"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-selector-title"
        className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/80 sm:px-6">
          <div>
            <h2 id="media-selector-title" className="text-xl font-bold text-slate-800 dark:text-white">Pilih Media</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pilih gambar yang sudah ada atau unggah gambar baru.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200 disabled:opacity-50 dark:bg-indigo-500/20 dark:text-indigo-300"
            >
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="hidden sm:inline">Unggah Baru</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {(uploadError || mediaQuery.error) && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {uploadError || getApiErrorMessage(mediaQuery.error, 'Gagal memuat Media Library.')}
            </div>
          )}

          {mediaQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="sr-only">Memuat media</span>
            </div>
          ) : media.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(normalizeStoredMediaUrl(item.file_url));
                    onClose();
                  }}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left shadow-sm transition-all hover:ring-2 hover:ring-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  <span className="relative flex aspect-square items-center justify-center overflow-hidden">
                    {item.mime_type?.startsWith('image/') ? (
                      <img
                        src={resolveMediaUrl(item.file_url)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-slate-400" />
                    )}
                  </span>
                  <span className="block truncate px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {item.file_name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <ImageIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Belum ada gambar. Unggah gambar pertama untuk melanjutkan.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}
