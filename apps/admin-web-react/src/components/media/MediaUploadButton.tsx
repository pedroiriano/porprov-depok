import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
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
  onUpload: (file: File) => Promise<void>;
  onError: (message: string) => void;
  onNotice?: (message: string) => void;
}

export default function MediaUploadButton({ busy, compact = false, onUpload, onError, onNotice }: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [pendingLossy, setPendingLossy] = useState<Extract<MediaPreparation, { status: 'needs-lossy-consent' }> | null>(null);
  const isBusy = busy || preparing;

  const uploadPrepared = async (file: File, message?: string) => {
    onError('');
    await onUpload(file);
    if (message) onNotice?.(message);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setPreparing(true);
    try {
      const prepared = await prepareMediaUpload(file);
      if (prepared.status === 'needs-lossy-consent') {
        setPendingLossy(prepared);
        return;
      }
      await uploadPrepared(
        prepared.file,
        prepared.mode === 'lossless' ? 'Gambar berhasil dikompresi lossless dan diunggah.' : undefined,
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gagal menyiapkan gambar.');
    } finally {
      setPreparing(false);
    }
  };

  const confirmLossy = async () => {
    if (!pendingLossy) return;
    setPreparing(true);
    try {
      const compressed = await compressMediaWithConsent(pendingLossy.file);
      await uploadPrepared(compressed, 'Gambar dikompresi berkualitas tinggi dengan persetujuan Anda dan berhasil diunggah.');
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
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'px-4' : 'px-5'}`}
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {isBusy ? 'Memproses...' : compact ? 'Unggah Baru' : 'Unggah Gambar'}
      </button>

      <Modal
        isOpen={pendingLossy !== null}
        onClose={() => !isBusy && setPendingLossy(null)}
        title="Persetujuan kompresi gambar"
        description="Kompresi lossless belum dapat mencapai batas akhir 3 MiB."
        closeDisabled={isBusy}
      >
        <div className="space-y-4 p-4 sm:p-6">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Untuk melanjutkan, sistem akan mengubah gambar ke WebP berkualitas tinggi dan bila diperlukan mengurangi dimensinya secara bertahap. Perubahan ini bersifat lossy, tetapi dioptimalkan agar tetap tajam untuk web.
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
