import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import {
  apiClient,
  authConfig,
  getApiErrorMessage,
  resolveMediaUrl,
  unwrapApiData,
} from '../../lib/api';
import type { MediaAsset } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MediaLibrary() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

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
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/master-data/media/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
    },
    onSuccess: async () => {
      setActionError('');
      setNotice('Media dipindahkan ke Recycle Bin.');
      await queryClient.invalidateQueries({ queryKey: ['media-assets'] });
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

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(resolveMediaUrl(url));
      setActionError('');
      setNotice('URL media berhasil disalin.');
    } catch {
      setActionError('Browser tidak mengizinkan akses clipboard.');
    }
  };

  const media = mediaQuery.data ?? [];
  const isMutating = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Media Library</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Kelola gambar yang digunakan oleh seluruh Master Data.</p>
        </div>
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
          disabled={isMutating}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          Unggah Gambar
        </button>
      </div>

      {(actionError || mediaQuery.error) && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError || getApiErrorMessage(mediaQuery.error, 'Gagal memuat Media Library.')}
        </div>
      )}
      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {mediaQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="sr-only">Memuat media</span>
        </div>
      ) : media.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <article key={item.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900">
                {item.mime_type?.startsWith('image/') ? (
                  <img src={resolveMediaUrl(item.file_url)} alt={item.file_name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-slate-400" />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-slate-900/60 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(item.file_url)}
                    aria-label={`Salin URL ${item.file_name}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = requestSoftDeleteReason(`Media ${item.file_name}`);
                      if (reason !== null) deleteMutation.mutate({ id: item.id, reason });
                    }}
                    disabled={deleteMutation.isPending}
                    aria-label={`Arsipkan ${item.file_name}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white" title={item.file_name}>{item.file_name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Ukuran tidak tersedia'}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          <ImageIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>Belum ada gambar yang diunggah.</p>
        </div>
      )}
    </div>
  );
}
