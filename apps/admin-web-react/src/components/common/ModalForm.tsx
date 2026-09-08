import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useModalDialog } from '../../hooks/useModalDialog';
import { deleteFormDraft, readFormDraft, saveFormDraft, type StoredFormDraft } from '../../lib/formDraftStorage';
import { deleteServerDraft, draftFieldDifferences, readServerDraft, sanitizeDraftPayload, saveServerDraft, ServerDraftConflictError, type ServerFormDraft } from '../../lib/serverDraft';

interface ModalFormDraft<T = unknown> {
  entityId: string;
  value: T;
  onRestore: (value: T) => void;
  version?: string;
}

interface ModalFormProps<T = unknown> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitText: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  draft?: ModalFormDraft<T>;
}

export default function ModalForm<T = unknown>({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting,
  submitText,
  children,
  size = 'default',
  draft,
}: ModalFormProps<T>) {
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);
  const [draftCandidate, setDraftCandidate] = useState<StoredFormDraft<T> | null>(null);
  const [draftResolved, setDraftResolved] = useState(true);
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [serverDraft, setServerDraft] = useState<ServerFormDraft<T> | null>(null);
  const [draftConflict, setDraftConflict] = useState<ServerFormDraft<T> | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const baselineRef = useRef('');
  const previousSubmitting = useRef(submitting);
  const draftRef = useRef(draft);
  const serverVersionRef = useRef(0);
  draftRef.current = draft;
  const draftValue = draft?.value;
  const restoreDraft = draft?.onRestore;
  const generatedFormId = useId();
  const formId = `modal-form-${generatedFormId.replace(/:/g, '')}`;
  const { dialogRef, titleId, requestClose } = useModalDialog({
    isOpen: isOpen && mounted,
    onClose: () => {
      const currentDraft = draftRef.current;
      if (currentDraft && draftResolved && JSON.stringify(currentDraft.value) !== baselineRef.current) {
        setCloseConfirmationOpen(true);
        return;
      }
      onClose();
    },
    closeDisabled: submitting,
  });
  const draftKey = (() => {
    if (!draft) return '';
    const actor = String(auth.user?.profile?.sub || 'anonymous');
    const route = window.location.pathname;
    return [actor, route, draft.entityId || 'new', draft.version || '1'].map(encodeURIComponent).join(':');
  })();
  const draftRoute = window.location.pathname;
  const draftEntity = draft?.entityId || '';
  const draftVersion = draft?.version || '1';
  const token = auth.user?.access_token || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const currentDraft = draftRef.current;
    if (!isOpen || !currentDraft || !draftKey) return;
    let active = true;
    baselineRef.current = JSON.stringify(currentDraft.value);
    setDraftCandidate(null);
    setDraftSavedAt('');
    setServerDraft(null);
    setDraftConflict(null);
    setCompareOpen(false);
    setDraftStatus('');
    serverVersionRef.current = 0;
    setCloseConfirmationOpen(false);
    setDraftResolved(false);
    const localPromise = readFormDraft<T>(draftKey);
    const serverPromise = token ? readServerDraft<T>(token, draftRoute, draftEntity, draftVersion).catch(() => null) : Promise.resolve(null);
    void Promise.all([localPromise, serverPromise]).then(([stored, remote]) => {
      if (!active) return;
      if (remote) {
        serverVersionRef.current = remote.version;
        setServerDraft(remote);
      }
      if (stored && JSON.stringify(stored.payload) !== baselineRef.current) {
        setDraftCandidate(stored);
      } else if (remote && JSON.stringify(remote.payload) !== baselineRef.current) {
        setDraftCandidate({ key: draftKey, version: 1, payload: remote.payload, savedAt: remote.updated_at, expiresAt: remote.expires_at });
      } else {
        setDraftResolved(true);
      }
    });
    return () => { active = false; };
  }, [isOpen, draftKey, draftEntity, draftRoute, draftVersion, token]);

  useEffect(() => {
    if (!isOpen || draftValue === undefined || !draftKey || !draftResolved) return;
    const serialized = JSON.stringify(draftValue);
    if (serialized === baselineRef.current) return;
    const timeout = window.setTimeout(() => {
      setDraftStatus('Menyimpan draf...');
      const safePayload = sanitizeDraftPayload(draftValue);
      void saveFormDraft(draftKey, safePayload).then((stored) => {
        setDraftSavedAt(stored.savedAt);
        if (!token) { setDraftStatus('Draf tersimpan di perangkat ini.'); return; }
        return saveServerDraft(token, draftRoute, draftEntity, draftVersion, safePayload, serverVersionRef.current).then((remote) => {
          serverVersionRef.current = remote.version;
          setServerDraft(remote);
          setDraftStatus('Draf tersimpan dan tersedia di perangkat lain.');
        });
      }).catch((error) => {
        if (error instanceof ServerDraftConflictError) {
          setDraftConflict(error.current as ServerFormDraft<T>);
          setDraftStatus('Draf di perangkat lain lebih baru. Pilih versi yang ingin digunakan.');
          return;
        }
        setDraftStatus('Draf tersimpan di perangkat ini. Sinkronisasi akan dicoba kembali saat jaringan pulih.');
      });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [draftValue, draftKey, draftResolved, isOpen, token, draftRoute, draftEntity, draftVersion]);

  useEffect(() => {
    if (!isOpen || draftValue === undefined || !draftKey || !draftResolved || JSON.stringify(draftValue) === baselineRef.current) return;
    const persistImmediately = () => { void saveFormDraft(draftKey, sanitizeDraftPayload(draftValue)); };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') persistImmediately(); };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      persistImmediately();
      event.preventDefault();
      event.returnValue = '';
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [draftKey, draftResolved, draftValue, isOpen]);

  useEffect(() => {
    if (previousSubmitting.current && !submitting && !isOpen && draftKey) {
      void deleteFormDraft(draftKey);
      if (token) void deleteServerDraft(token, draftRoute, draftEntity, draftVersion).catch(() => undefined);
    }
    previousSubmitting.current = submitting;
  }, [draftKey, isOpen, submitting, token, draftRoute, draftEntity, draftVersion]);

  const resolveDraft = (payload: T, source: 'local' | 'server') => {
    restoreDraft?.(payload);
    baselineRef.current = JSON.stringify(payload);
    if (source === 'server' && (draftConflict || serverDraft)) serverVersionRef.current = (draftConflict || serverDraft)?.version || 0;
    if (source === 'local' && draftConflict) serverVersionRef.current = draftConflict.version;
    setDraftResolved(true);
    setDraftCandidate(null);
    setDraftConflict(null);
    setCompareOpen(false);
    setDraftStatus(source === 'server' ? 'Draf dari perangkat lain digunakan.' : 'Draf dari perangkat ini digunakan.');
  };

  const comparison = draftConflict && draftValue !== undefined ? draftFieldDifferences(draftValue, draftConflict.payload) : serverDraft && draftCandidate ? draftFieldDifferences(draftCandidate.payload, serverDraft.payload) : [];
  const saveDraftAndClose = async () => {
    if (draftValue === undefined) return;
    const safePayload = sanitizeDraftPayload(draftValue);
    await saveFormDraft(draftKey, safePayload);
    if (token) {
      try {
        const remote = await saveServerDraft(token, draftRoute, draftEntity, draftVersion, safePayload, serverVersionRef.current);
        serverVersionRef.current = remote.version;
      } catch {
        // INFO: Salinan perangkat tetap tersedia ketika jaringan tidak siap.
      }
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm animate-fade-in-up sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[85vh] dark:border-slate-700 dark:bg-slate-900 ${size === 'large' ? 'max-w-4xl' : 'max-w-lg'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 id={titleId} className="text-lg font-black text-slate-950 dark:text-white">
            {title}
          </h3>
          <button 
            onClick={requestClose}
            disabled={submitting}
            aria-label="Tutup dialog"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
            type="button"
          >
            &times;
          </button>
        </div>
        
        {/* Form Body */}
        <div className="overflow-y-auto p-4 custom-scrollbar sm:p-6">
          {closeConfirmationOpen && (
            <div role="alertdialog" aria-label="Konfirmasi menutup formulir" className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100">
              <p className="font-black">Formulir memiliki perubahan yang belum disimpan.</p>
              <p className="mt-1">Simpan sebagai draf agar dapat dipulihkan, atau buang perubahan secara eksplisit.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-xl bg-blue-600 px-4 font-black text-white hover:bg-blue-700" onClick={() => void saveDraftAndClose()}>Simpan draf dan tutup</button>
                <button type="button" className="min-h-11 rounded-xl border border-red-300 px-4 font-bold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/50" onClick={() => { void deleteFormDraft(draftKey); if (token) void deleteServerDraft(token, draftRoute, draftEntity, draftVersion).catch(() => undefined); onClose(); }}>Buang perubahan</button>
                <button type="button" className="min-h-11 rounded-xl px-4 font-bold hover:bg-yellow-100 dark:hover:bg-yellow-950" onClick={() => setCloseConfirmationOpen(false)}>Lanjut mengedit</button>
              </div>
            </div>
          )}
          {draftCandidate && !draftResolved && (
            <div role="status" className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
              <div className="flex items-start gap-3"><History className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-black">Draf sebelumnya ditemukan</p><p className="mt-1">Tersimpan {new Date(draftCandidate.savedAt).toLocaleString('id-ID')} dan otomatis kedaluwarsa dalam 7 hari.</p></div></div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-xl bg-blue-600 px-4 font-black text-white hover:bg-blue-700" onClick={() => resolveDraft(draftCandidate.payload, 'local')}>Gunakan draf perangkat ini</button>
                {serverDraft && JSON.stringify(serverDraft.payload) !== JSON.stringify(draftCandidate.payload) && <button type="button" className="min-h-11 rounded-xl border border-blue-300 px-4 font-bold hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-950" onClick={() => resolveDraft(serverDraft.payload, 'server')}>Gunakan draf perangkat lain</button>}
                {serverDraft && JSON.stringify(serverDraft.payload) !== JSON.stringify(draftCandidate.payload) && <button type="button" className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setCompareOpen((value) => !value)}>Bandingkan perubahan</button>}
                <button type="button" className="min-h-11 rounded-xl px-4 font-bold hover:bg-blue-100 dark:hover:bg-blue-950" onClick={() => { setDraftResolved(true); setDraftCandidate(null); }}>Batal memulihkan</button>
              </div>
            </div>
          )}
          {draftConflict && (
            <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-black">Draf telah diperbarui dari perangkat lain.</p>
              <p className="mt-1">Pilih versi yang ingin digunakan agar perubahan tidak tertimpa tanpa sengaja.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {draftValue !== undefined && <button type="button" className="min-h-11 rounded-xl bg-blue-600 px-4 font-black text-white hover:bg-blue-700" onClick={() => resolveDraft(draftValue, 'local')}>Gunakan draf perangkat ini</button>}
                <button type="button" className="min-h-11 rounded-xl border border-blue-300 px-4 font-bold hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-950" onClick={() => resolveDraft(draftConflict.payload, 'server')}>Gunakan draf perangkat lain</button>
                <button type="button" className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setCompareOpen((value) => !value)}>Bandingkan perubahan</button>
                <button type="button" className="min-h-11 rounded-xl px-4 font-bold hover:bg-amber-100 dark:hover:bg-amber-950" onClick={() => { setDraftConflict(null); setCompareOpen(false); setDraftStatus('Sinkronisasi draf ditunda.'); }}>Batal</button>
              </div>
            </div>
          )}
          {compareOpen && comparison.length > 0 && <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"><table className="min-w-full text-left text-sm"><caption className="sr-only">Perbandingan draf</caption><thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2">Bagian</th><th className="px-3 py-2">Perangkat ini</th><th className="px-3 py-2">Perangkat lain</th></tr></thead><tbody>{comparison.map((item) => <tr key={item.field} className="border-t border-slate-200 align-top dark:border-slate-700"><th className="px-3 py-2 font-bold">{item.field.replaceAll('_', ' ')}</th><td className="max-w-64 break-words px-3 py-2">{item.local}</td><td className="max-w-64 break-words px-3 py-2">{item.server}</td></tr>)}</tbody></table></div>}
          <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
            {children}
          </form>
          {draft && draftResolved && (draftStatus || draftSavedAt) && <p role="status" className="mt-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400">{draftStatus || `Draf tersimpan ${new Date(draftSavedAt).toLocaleTimeString('id-ID')}.`}</p>}
        </div>
        
        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <button 
            type="button"
            onClick={requestClose}
            disabled={submitting}
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Batal
          </button>
          <button 
            type="submit" 
            form={formId}
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Menyimpan...' : submitText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
