import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Image, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import Modal from '../Modal';
import {
  compressMediaWithConsent,
  MEDIA_ACCEPTED_TYPES,
  prepareMediaUpload,
  type MediaPreparation,
} from '../../lib/mediaUpload';

interface MediaUploadButtonProps {
  busy: boolean;
  compact?: boolean;
  onUpload: (file: File, options: { signal: AbortSignal; onProgress: (percentage: number) => void }) => Promise<void>;
  onError: (message: string) => void;
  onNotice?: (message: string) => void;
}

export default function MediaUploadButton({ busy, compact = false, onUpload, onError, onNotice }: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [pendingLossy, setPendingLossy] = useState<Extract<MediaPreparation, { status: 'needs-lossy-consent' }> | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<{ name: string; size: number; url: string } | null>(null);
  const isBusy = busy || preparing;

  const uploadPrepared = async (file: File, message?: string) => {
    onError('');
    setRetryFile(null);
    setUploadProgress(0);
    const controller = new AbortController();
    setUploadController(controller);
    try {
      await onUpload(file, { signal: controller.signal, onProgress: setUploadProgress });
      setUploadProgress(100);
      if (message) onNotice?.(message);
    } catch (error) {
      setRetryFile(file);
      if (controller.signal.aborted) {
        onError('Unggahan dibatalkan. Anda dapat mencobanya kembali.');
        return;
      }
      throw error;
    } finally {
      setUploadController(null);
      setUploadProgress(null);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { name: file.name, size: file.size, url: URL.createObjectURL(file) };
    });
    setPreparing(true);
    try {
      const prepared = await prepareMediaUpload(file);
      if (prepared.status === 'needs-lossy-consent') {
        setPendingLossy(prepared);
        return;
      }
      await uploadPrepared(
        prepared.file,
        prepared.mode === 'lossless' ? 'Gambar berhasil dipadatkan tanpa penurunan kualitas dan diunggah.' : undefined,
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gagal menyiapkan gambar.');
    } finally {
      setPreparing(false);
    }
  };

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (isBusy) return;
    if (event.dataTransfer.files.length !== 1) {
      onError('Pilih tepat satu gambar untuk setiap proses unggah.');
      return;
    }
    void handleFile(event.dataTransfer.files[0]);
  };

  const confirmLossy = async () => {
    if (!pendingLossy) return;
    setPreparing(true);
    try {
      const compressed = await compressMediaWithConsent(pendingLossy.file);
      await uploadPrepared(compressed, 'Gambar dipadatkan dengan penurunan kualitas minimal sesuai persetujuan Anda dan berhasil diunggah.');
      setPendingLossy(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gagal mengompresi gambar.');
    } finally {
      setPreparing(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={MEDIA_ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void handleFile(file);
        }}
      />
      <div
        className={`flex min-w-56 flex-col gap-3 rounded-2xl border-2 border-dashed p-3 transition-colors motion-reduce:transition-none ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}
        onDragEnter={(event) => { event.preventDefault(); if (!isBusy) setDragActive(true); }}
        onDragOver={(event) => { event.preventDefault(); if (!isBusy) event.dataTransfer.dropEffect = 'copy'; }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragActive(false); }}
        onDrop={handleDrop}
        aria-label="Area seret dan lepas satu gambar"
      >
        {preview && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm dark:bg-slate-800">
            <img src={preview.url} alt="Pratinjau gambar yang dipilih" className="size-12 rounded-lg object-cover" />
            <div className="min-w-0"><p className="truncate text-xs font-black text-slate-900 dark:text-white">{preview.name}</p><p className="text-xs text-slate-500 dark:text-slate-300">{(preview.size / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MiB</p></div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><Image className="size-5" aria-hidden="true" /></span>
          <span className="min-w-28 flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">Seret satu gambar ke sini atau pilih dari perangkat.</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'px-4' : 'px-5'}`}
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
            {isBusy ? 'Memproses...' : compact ? 'Pilih gambar' : 'Pilih Gambar'}
          </button>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="min-w-48" role="status" aria-live="polite">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300"><span>Mengunggah gambar</span><span>{uploadProgress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-blue-600 transition-[width] motion-reduce:transition-none" style={{ width: `${uploadProgress}%` }} /></div>
          <button type="button" onClick={() => uploadController?.abort()} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-black text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40"><X className="size-4" aria-hidden="true" />Batalkan unggahan</button>
        </div>
      )}

      {retryFile && uploadProgress === null && (
        <button type="button" disabled={isBusy} onClick={() => void uploadPrepared(retryFile).catch(() => undefined)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300 px-4 text-sm font-black text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40"><RotateCcw className="size-4" aria-hidden="true" />Coba unggah lagi</button>
      )}

      <Modal
        isOpen={pendingLossy !== null}
        onClose={() => !isBusy && setPendingLossy(null)}
        title="Persetujuan kompresi gambar"
        description="Pemadatan tanpa penurunan kualitas belum dapat mencapai batas akhir 3 MiB."
        closeDisabled={isBusy}
      >
        <div className="space-y-4 p-4 sm:p-6">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Untuk melanjutkan, sistem akan mengubah gambar ke WebP berkualitas tinggi dan bila diperlukan mengurangi dimensinya secara bertahap. Proses ini dapat sedikit menurunkan kualitas, tetapi gambar tetap dioptimalkan agar tajam untuk web.
          </p>
          {pendingLossy && <p className="rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{pendingLossy.file.name} · {pendingLossy.width} × {pendingLossy.height} px</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setPendingLossy(null)} disabled={isBusy} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button>
            <button type="button" onClick={() => void confirmLossy()} disabled={isBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">{isBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Setuju dan kompres</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
