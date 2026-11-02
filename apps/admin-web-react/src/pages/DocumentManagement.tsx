import { Archive, Download, FileText, History, Pencil, RotateCcw, Settings, Upload, Pin, Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import ModalForm from '../components/common/ModalForm';
import { TextInput, TextArea } from '../components/common/FormInputs';
import { RowsPerPageSelector, TablePagination } from '../components/common/TableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../components/cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { useAuthorization } from '../contexts/authorization';
import { apiClient, authConfig, getApiErrorMessage } from '../lib/api';
import { getRealmRoles } from '../lib/auth';
import type { SortDirection } from '../hooks/useTableControls';

type DocumentItem = { id: string; title: string; description: string; original_name: string; mime_type: string; file_bytes: number; checksum_sha256: string; version: number; created_username: string; created_at: string; deleted_at: string | null; is_published: boolean; is_pinned: boolean };
type Policy = { version: number; allowed_mime_types: string[]; max_file_bytes: number };
type Format = { mime: string; extensions: string; label: string };
type PolicyResponse = { policy: Policy; formats: Format[]; hard_max_bytes: number };
type DocumentPage = { data: DocumentItem[]; total: number; total_pages: number };
type Revision = { id: number; version: number; action: string; snapshot: DocumentItem | Policy; actor_username: string; reason: string; created_at: string };
type Editor = { item: DocumentItem | null; title: string; description: string; reason: string; revision_id: number };
type SortKey = 'title' | 'created_at' | 'file_bytes';
const base = '/documents';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600';
const primary = `${button} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;
const panel = 'rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const mib = (bytes: number) => `${(bytes / 1048576).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MiB`;
const date = (value: string) => new Date(value).toLocaleString('id-ID');
const actionNames: Record<string, string> = { UPLOAD: 'Unggah', UPDATE: 'Perubahan keterangan', ARCHIVE: 'Arsip', RESTORE: 'Pemulihan arsip', RESTORE_REVISION: 'Pemulihan riwayat', POLICY_UPDATE: 'Perubahan pengaturan', POLICY_INITIAL: 'Pengaturan awal', PUBLISH: 'Ditayangkan', UNPUBLISH: 'Dijadikan privat', PIN: 'Disematkan', UNPIN: 'Sematan dilepas' };

export default function DocumentManagement() {
  const auth = useAuth(); const token = auth.user?.access_token; const access = useAuthorization();
  const mayPublish = access.hasPermission('document.update') && getRealmRoles(auth.user).includes('super_admin');
  const mayConfigure = access.hasPermission('document.policy') && getRealmRoles(auth.user).includes('super_admin');
  const [items, setItems] = useState<DocumentItem[]>([]); const [policy, setPolicy] = useState<PolicyResponse | null>(null);
  const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(10); const [total, setTotal] = useState(0); const [pages, setPages] = useState(0);
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState<SortKey>('created_at'); const [order, setOrder] = useState<SortDirection>('desc');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set()); const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null); const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<(Policy & { reason: string }) | null>(null);
  const [pending, setPending] = useState<{ action: 'archive' | 'restore' | 'publication' | 'pin'; enabled?: boolean; targets: DocumentItem[] } | null>(null); const [reason, setReason] = useState('');
  const [history, setHistory] = useState<{ item: DocumentItem | null; page: number } | null>(null);
  const [historyRows, setHistoryRows] = useState<Revision[]>([]); const [historyMore, setHistoryMore] = useState(false); const [historyLoading, setHistoryLoading] = useState(false); const [historyError, setHistoryError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { const id = window.setTimeout(() => setQuery(search.trim()), 350); return () => window.clearTimeout(id); }, [search]);
  useEffect(() => { setSelected(new Set()); }, [page, perPage, query, archived, sort, order]);
  // RELIABILITY: Cancel stale reads without replacing open forms when the token renews.
  useEffect(() => {
    if (!token) return; const controller = new AbortController(); setLoading(true); setError('');
    const options = { ...authConfig(token), signal: controller.signal };
    void Promise.all([
      apiClient.get<DocumentPage>(base, { ...options, params: { page, per_page: perPage, q: query, state: archived ? 'archived' : 'active', sort, order } }),
      apiClient.get<PolicyResponse>(`${base}/policy`, options),
    ]).then(([documents, rules]) => {
      if (controller.signal.aborted) return;
      setItems(documents.data.data); setTotal(documents.data.total); setPages(documents.data.total_pages); setPolicy(rules.data);
      if (page > 1 && documents.data.total_pages < page) setPage(Math.max(1, documents.data.total_pages));
    }).catch(cause => { if (!controller.signal.aborted) setError(getApiErrorMessage(cause, 'Dokumen belum dapat dimuat. Coba lagi.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, perPage, query, archived, sort, order, revision]);
  useEffect(() => {
    if (!history || !token) return; const controller = new AbortController(); setHistoryLoading(true); setHistoryError('');
    void apiClient.get<{ data: Revision[]; has_more: boolean }>(`${base}/${history.item ? `${history.item.id}/` : 'policy/'}history`, { ...authConfig(token), signal: controller.signal, params: { page: history.page, per_page: 10 } })
      .then(response => { if (!controller.signal.aborted) { setHistoryRows(response.data.data); setHistoryMore(response.data.has_more); } })
      .catch(cause => { if (!controller.signal.aborted) setHistoryError(getApiErrorMessage(cause, 'Riwayat belum dapat dimuat.')); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [history, token]);

  const reload = () => { setRevision(value => value + 1); setSelected(new Set()); };
  const chooseFile = (candidate?: File) => {
    if (!candidate || !policy) return;
    const extension = `.${candidate.name.split('.').pop()?.toLowerCase()}`;
    const format = policy.formats.find(value => value.extensions.split(',').includes(extension));
    if (!candidate.size || candidate.size > policy.policy.max_file_bytes || !format || !policy.policy.allowed_mime_types.includes(format.mime) || candidate.type && candidate.type !== format.mime) {
      setError(`Pilih jenis berkas yang diizinkan dengan ukuran maksimal ${mib(policy.policy.max_file_bytes)}.`); return;
    }
    // INFO: Browser may omit a MIME; the server still verifies the actual bytes and extension.
    setFile(candidate.type ? candidate : new File([candidate], candidate.name, { type: format.mime })); setError('');
  };
  const saveDocument = async (event: FormEvent) => {
    event.preventDefault(); if (!editor || !token || busy) return;
    setBusy(true); setError('');
    try {
      if (!editor.item) {
        if (!file) throw new Error('Pilih berkas yang akan diunggah.');
        const data = new FormData(); data.append('title', editor.title.trim()); data.append('description', editor.description.trim()); data.append('file', file);
        await apiClient.post(base, data, { ...authConfig(token), timeout: 130000 });
      } else {
        const data = { title: editor.title.trim(), description: editor.description.trim(), reason: editor.reason.trim(), expected_version: editor.item.version, revision_id: editor.revision_id };
        if (editor.revision_id) await apiClient.post(`${base}/${editor.item.id}/restore-revision`, data, authConfig(token));
        else await apiClient.put(`${base}/${editor.item.id}`, data, authConfig(token));
      }
      setNotice(editor.item ? 'Perubahan dokumen berhasil disimpan.' : 'Dokumen berhasil diunggah.'); setEditor(null); setFile(null); reload();
    } catch (cause) { setError(cause instanceof Error && cause.message === 'Pilih berkas yang akan diunggah.' ? cause.message : getApiErrorMessage(cause, 'Dokumen gagal disimpan. Periksa isian dan pengaturan terbaru.')); }
    finally { setBusy(false); }
  };
  const savePolicy = async (event: FormEvent) => {
    event.preventDefault(); if (!settings || !token || busy) return; setBusy(true); setError('');
    try {
      await apiClient.put(`${base}/policy`, { expected_version: settings.version, allowed_mime_types: settings.allowed_mime_types, max_file_bytes: settings.max_file_bytes, reason: settings.reason.trim() }, authConfig(token));
      setSettings(null); setNotice('Pengaturan unggah berhasil disimpan. Dokumen sebelumnya tetap tersimpan.'); reload();
    } catch (cause) { setError(getApiErrorMessage(cause, 'Pengaturan belum dapat disimpan.')); } finally { setBusy(false); }
  };
  const applyPending = async (event: FormEvent) => {
    event.preventDefault(); if (!pending || !token || busy) return; setBusy(true); setError(''); const failed: DocumentItem[] = [];
    for (const item of pending.targets) {
      const data = { expected_version: item.version, reason: reason.trim() };
      try {
        if (pending.action === 'archive') await apiClient.delete(`${base}/${item.id}`, { ...authConfig(token), data });
        else if (pending.action === 'restore') await apiClient.post(`${base}/${item.id}/restore`, data, authConfig(token));
        else await apiClient.put(`${base}/${item.id}/${pending.action}`, { ...data, enabled: pending.enabled }, authConfig(token));
      } catch { failed.push(item); }
    }
    if (failed.length) { setPending({ ...pending, targets: failed }); setError(`${failed.length} dokumen belum berhasil diproses. Muat ulang daftar bila versi telah berubah.`); }
    else { setNotice(pending.action === 'archive' ? 'Dokumen berhasil diarsipkan. Berkas tetap tersimpan.' : pending.action === 'restore' ? 'Dokumen dipulihkan sebagai privat.' : pending.action === 'pin' ? pending.enabled ? 'Dokumen disematkan di samping Lihat Jadwal pada Beranda.' : 'Sematan dokumen dilepas.' : pending.enabled ? 'Dokumen ditayangkan pada halaman Unduhan Publik.' : 'Dokumen dijadikan privat dan sematannya dilepas.'); setPending(null); }
    setBusy(false); reload();
  };
  const download = useCallback(async (item: DocumentItem) => {
    if (!token) return;
    try {
      const response = await apiClient.get<Blob>(`${base}/${item.id}/download`, { ...authConfig(token), responseType: 'blob', timeout: 130000 });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = item.original_name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (cause) { setError(getApiErrorMessage(cause, 'Dokumen belum dapat diunduh. Periksa akses dan status arsipnya.')); }
  }, [token]);
  const openAction = (targets: DocumentItem[], action: 'archive' | 'restore') => { setPending({ targets, action }); setReason(''); setError(''); };
  const columns: Array<AdminDataTableColumn<DocumentItem, SortKey>> = [
    { key: 'title', label: 'Dokumen', sortKey: 'title', render: item => <div><p className="font-black">{item.title}</p><p className="break-all text-sm text-slate-600 dark:text-slate-300">{item.original_name}</p><p className="line-clamp-2 text-sm">{item.description}</p></div> },
    { key: 'publication', label: 'Publikasi', render: item => <div className="space-y-1 text-sm"><span className={item.is_published ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}>{item.is_published ? 'Tayang di Unduhan' : 'Privat'}</span>{item.is_pinned && <p className="font-bold text-blue-700 dark:text-blue-300">Disematkan di Beranda</p>}</div> },
    { key: 'type', label: 'Jenis', render: item => <span className="break-all text-sm">{item.mime_type}</span> },
    { key: 'size', label: 'Ukuran', sortKey: 'file_bytes', render: item => mib(item.file_bytes) },
    { key: 'created', label: 'Diunggah', sortKey: 'created_at', render: item => <div className="text-sm"><p>{date(item.created_at)}</p><p>{item.created_username}</p><p>Versi {item.version}</p></div> },
  ];
  const selectedItems = items.filter(item => selected.has(item.id));
  const accept = policy?.formats.filter(value => policy.policy.allowed_mime_types.includes(value.mime)).map(value => value.extensions).join(',');
  const editorValid = editor && editor.title.trim().length >= 2 && editor.title.length <= 200 && editor.description.length <= 2000 && (editor.item ? editor.reason.trim().length >= 5 : file !== null);
  const settingsValid = settings && settings.allowed_mime_types.length > 0 && settings.reason.trim().length >= 5 && settings.max_file_bytes >= 1048576 && settings.max_file_bytes <= (policy?.hard_max_bytes ?? 0);

  return <section>
    <AdminPageHeader eyebrow="Arsip berkas terkelola" title="Pengelolaan Dokumen" description="Unggah, temukan, dan unduh dokumen sesuai hak akses. Arsip dapat dipulihkan tanpa kehilangan berkas." actions={<div className="flex flex-wrap gap-2">{mayConfigure && <button type="button" className={button} disabled={!policy} onClick={() => { if (policy) setSettings({ ...policy.policy, reason: '' }); }}><Settings className="size-4" aria-hidden="true" />Pengaturan unggah</button>}{access.hasPermission('document.create') && <button type="button" className={primary} disabled={!policy} onClick={() => { setFile(null); setEditor({ item: null, title: '', description: '', reason: '', revision_id: 0 }); setError(''); }}><Upload className="size-4" aria-hidden="true" />Unggah dokumen</button>}</div>} />
    {notice && <div className="mb-4" role="status"><AdminAlert tone="success">{notice}</AdminAlert></div>}
    {error && !editor && !settings && !pending && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    {policy && <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">Jenis yang diizinkan: {policy.formats.filter(value => policy.policy.allowed_mime_types.includes(value.mime)).map(value => value.label).join(', ')}. Maksimal {mib(policy.policy.max_file_bytes)} per berkas. Dokumen baru bersifat privat. Tayangkan dokumen sebelum tersedia pada Web Publik.</p>}
    <div className={panel}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
        <label className="w-full min-w-0 sm:flex-1"><span className="sr-only">Cari judul atau nama berkas</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} maxLength={80} placeholder="Cari judul atau nama berkas" className="min-h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3 dark:border-slate-600" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={archived} onChange={event => { setArchived(event.target.checked); setPage(1); }} />Tampilkan arsip</label>
        <RowsPerPageSelector value={perPage} onChange={value => { setPerPage(value); setPage(1); }} />
      </div>
      {selectedItems.length > 0 && <div className="flex flex-wrap items-center gap-3 p-4"><span>{selectedItems.length} dokumen dipilih pada halaman ini</span>{access.hasPermission(archived ? 'document.restore' : 'document.archive') && <button type="button" className={button} onClick={() => openAction(selectedItems, archived ? 'restore' : 'archive')}>{archived ? 'Pulihkan pilihan' : 'Arsipkan pilihan'}</button>}</div>}
      <AdminDataTable caption="Daftar dokumen" rows={items} columns={columns} getRowId={item => item.id} getRowLabel={item => item.title} sortKey={sort} sortDirection={order} onSort={key => { setSort(key); setOrder(previous => key === sort && previous === 'asc' ? 'desc' : 'asc'); setPage(1); }} selectedIds={selected} onSelectedIdsChange={setSelected} selectionLabel="dokumen" loading={loading} error={error && !editor && !settings && !pending ? error : ''} onRetry={reload} emptyTitle={archived ? 'Belum ada dokumen diarsipkan' : 'Belum ada dokumen'} emptyDescription={query ? 'Coba kata pencarian lain.' : 'Unggah dokumen pertama melalui tombol di atas.'} rowActions={item => <>
        {!archived && <button type="button" className="admin-cuba-icon-button" aria-label={`Unduh ${item.title}`} onClick={() => void download(item)}><Download className="size-4" aria-hidden="true" /></button>}
        <button type="button" className="admin-cuba-icon-button" aria-label={`Riwayat ${item.title}`} onClick={() => { setHistoryRows([]); setHistory({ item, page: 1 }); }}><History className="size-4" aria-hidden="true" /></button>
        {!archived && mayPublish && <><button type="button" className="admin-cuba-icon-button" aria-label={`${item.is_published ? 'Jadikan privat' : 'Tayangkan'} ${item.title}`} onClick={() => { setPending({ action: 'publication', targets: [item], enabled: !item.is_published }); setReason(''); setError(''); }}>{item.is_published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button><button type="button" className="admin-cuba-icon-button disabled:opacity-40" aria-label={`${item.is_pinned ? 'Lepas sematan' : 'Sematkan'} ${item.title}`} title={item.is_published ? 'Tampilkan tombol dokumen di samping Lihat Jadwal' : 'Tayangkan dokumen sebelum menyematkan'} disabled={!item.is_published} onClick={() => { setPending({ action: 'pin', targets: [item], enabled: !item.is_pinned }); setReason(''); setError(''); }}><Pin className="size-4" aria-hidden="true" /></button></>}
        {!archived && access.hasPermission('document.update') && <button type="button" className="admin-cuba-icon-button" aria-label={`Ubah ${item.title}`} onClick={() => { setEditor({ item, title: item.title, description: item.description, reason: '', revision_id: 0 }); setError(''); }}><Pencil className="size-4" aria-hidden="true" /></button>}
        {access.hasPermission(archived ? 'document.restore' : 'document.archive') && <button type="button" className="admin-cuba-icon-button" aria-label={`${archived ? 'Pulihkan' : 'Arsipkan'} ${item.title}`} onClick={() => openAction([item], archived ? 'restore' : 'archive')}>{archived ? <RotateCcw className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}</button>}
      </>} />
      {total > 0 && <TablePagination currentPage={page} totalPages={pages} totalItems={total} startItem={(page - 1) * perPage + 1} endItem={Math.min(page * perPage, total)} onPageChange={setPage} itemLabel="dokumen" />}
    </div>
    <ModalForm isOpen={editor !== null} onClose={() => { if (!busy) { setEditor(null); setFile(null); } }} title={editor?.item ? 'Ubah dokumen' : 'Unggah dokumen'} onSubmit={saveDocument} submitting={busy} submitDisabled={!editorValid} submitText={busy ? 'Menyimpan…' : 'Simpan dokumen'} draft={editor ? { entityId: editor.item?.id ?? 'document-new', version: String(editor.item?.version ?? 1), value: { title: editor.title, description: editor.description, reason: editor.reason }, onRestore: value => setEditor(current => current ? { ...current, ...value, revision_id: 0 } : null) } : undefined}>
      {error && <AdminAlert>{error}</AdminAlert>}
      {editor && <div className="space-y-4">
        <TextInput label="Judul dokumen" name="document_title" value={editor.title} maxLength={200} required onChange={(event: ChangeEvent<HTMLInputElement>) => setEditor({ ...editor, title: event.target.value, revision_id: 0 })} />
        <TextArea label="Keterangan" name="document_description" value={editor.description} maxLength={2000} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setEditor({ ...editor, description: event.target.value, revision_id: 0 })} />
        {!editor.item && <div className="rounded-xl border-2 border-dashed border-slate-400 p-5 text-center dark:border-slate-500" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length === 1) chooseFile(event.dataTransfer.files[0]); else setError('Unggah satu berkas setiap kali.'); }}>
          <FileText className="mx-auto mb-3 size-8 text-blue-600 dark:text-blue-300" aria-hidden="true" /><p>Seret satu berkas ke sini atau pilih dari perangkat.</p><input ref={fileInput} type="file" accept={accept} className="sr-only" aria-label="Berkas dokumen" onChange={event => { chooseFile(event.target.files?.[0]); event.target.value = ''; }} /><button type="button" className={`${button} mt-3`} onClick={() => fileInput.current?.click()}>Pilih berkas</button><p className="mt-2 break-all text-sm" role="status">{file ? `${file.name} · ${mib(file.size)}` : 'Belum ada berkas dipilih'}</p><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Draf menyimpan judul dan keterangan. Pilih ulang berkas jika halaman dibuka kembali.</p>
        </div>}
        {editor.item && <TextInput label="Alasan perubahan" name="document_reason" value={editor.reason} minLength={5} maxLength={500} required onChange={(event: ChangeEvent<HTMLInputElement>) => setEditor({ ...editor, reason: event.target.value })} />}
      </div>}
    </ModalForm>
    <ModalForm isOpen={settings !== null} onClose={() => { if (!busy) setSettings(null); }} title="Pengaturan unggah dokumen" onSubmit={savePolicy} submitting={busy} submitDisabled={!settingsValid} submitText={busy ? 'Menyimpan…' : 'Simpan pengaturan'} draft={settings ? { entityId: 'document-policy', version: String(settings.version), value: { allowed_mime_types: settings.allowed_mime_types, max_file_bytes: settings.max_file_bytes, reason: settings.reason }, onRestore: value => setSettings(current => current ? { ...current, ...value } : null) } : undefined}>
      {error && <AdminAlert>{error}</AdminAlert>}
      {settings && policy && <div className="space-y-5">
        <p className="text-sm">Pengaturan berlaku untuk unggahan berikutnya. Berkas yang sudah tersimpan tidak dihapus atau dikonversi.</p>
        <fieldset className="space-y-2"><legend className="mb-2 font-bold">Jenis berkas yang diizinkan</legend>{policy.formats.map(format => <label key={format.mime} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 p-3 dark:border-slate-600"><input type="checkbox" checked={settings.allowed_mime_types.includes(format.mime)} onChange={event => setSettings({ ...settings, allowed_mime_types: event.target.checked ? [...settings.allowed_mime_types, format.mime] : settings.allowed_mime_types.filter(value => value !== format.mime) })} /><span>{format.label} <span className="break-all text-xs text-slate-600 dark:text-slate-300">({format.mime})</span></span></label>)}</fieldset>
        <TextInput label="Ukuran maksimal per berkas (MiB)" name="document_limit" type="number" min={1} max={100} step={1} value={settings.max_file_bytes / 1048576} required onChange={(event: ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, max_file_bytes: Number(event.target.value) * 1048576 })} />
        <p className="text-xs text-slate-600 dark:text-slate-300">1 MiB = 1.048.576 byte. Batas keamanan server: 100 MiB. HTML, SVG, arsip, dan program tidak didukung.</p>
        <TextInput label="Alasan perubahan" name="policy_reason" value={settings.reason} minLength={5} maxLength={500} required onChange={(event: ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, reason: event.target.value })} />
        <button type="button" className={button} onClick={() => { setHistoryRows([]); setSettings(null); setHistory({ item: null, page: 1 }); }}><History className="size-4" aria-hidden="true" />Riwayat pengaturan</button>
      </div>}
    </ModalForm>
    <ModalForm isOpen={pending !== null} onClose={() => { if (!busy) setPending(null); }} title={`${pending?.action === 'restore' ? 'Pulihkan' : pending?.action === 'publication' ? pending.enabled ? 'Tayangkan' : 'Jadikan privat' : pending?.action === 'pin' ? pending.enabled ? 'Sematkan' : 'Lepas sematan' : 'Arsipkan'} ${pending?.targets.length ?? 0} dokumen?`} onSubmit={applyPending} submitting={busy} submitDisabled={reason.trim().length < 5} submitText={busy ? 'Memproses…' : 'Simpan perubahan'}>
      {error && <AdminAlert>{error}</AdminAlert>}<p>{pending?.action === 'publication' && pending.enabled ? 'Dokumen akan dapat diunduh siapa pun melalui Web Publik. Pastikan tidak ada informasi rahasia atau data pribadi yang tidak boleh dipublikasikan.' : pending?.action === 'pin' && pending.enabled ? 'Tepat satu dokumen tayang disematkan di Beranda, di samping Lihat Jadwal. Sematan sebelumnya diganti dan dicatat pada riwayat.' : 'Berkas tetap tersimpan. Setiap perubahan dicatat dalam riwayat dan log audit.'}</p><ul className="my-3 max-h-40 list-disc overflow-y-auto pl-5">{pending?.targets.map(item => <li key={item.id}>{item.title}</li>)}</ul><TextInput label="Alasan" name="document_action_reason" value={reason} minLength={5} maxLength={500} required onChange={(event: ChangeEvent<HTMLInputElement>) => setReason(event.target.value)} />
    </ModalForm>
    <Modal isOpen={history !== null} onClose={() => setHistory(null)} title={history?.item ? `Riwayat: ${history.item.title}` : 'Riwayat pengaturan unggah'} maxWidth="lg">
      <div className="space-y-4 p-5">{historyLoading ? <p role="status">Memuat riwayat…</p> : historyError ? <AdminAlert>{historyError}</AdminAlert> : <>{historyRows.length === 0 && <p>Belum ada riwayat.</p>}{historyRows.map(row => <article key={row.id} className={`${panel} space-y-2 p-4`}><h3 className="font-black">Versi {row.version} · {actionNames[row.action] ?? 'Perubahan dokumen'}</h3><p className="text-sm">{row.actor_username} · {date(row.created_at)}</p><p>{row.reason}</p>{'title' in row.snapshot ? <><p className="font-bold">{row.snapshot.title}</p><p className="whitespace-pre-wrap text-sm">{row.snapshot.description}</p></> : <p className="break-all text-sm">{row.snapshot.allowed_mime_types.join(', ')} · {mib(row.snapshot.max_file_bytes)}</p>}
        {history && (history.item ? access.hasPermission('document.update') && !history.item.deleted_at : mayConfigure) && <button type="button" className={button} onClick={() => {
          if (history.item && 'title' in row.snapshot) setEditor({ item: history.item, title: row.snapshot.title, description: row.snapshot.description, reason: `Pulihkan keterangan dari versi ${row.version}`, revision_id: row.id });
          else if (!history.item && 'allowed_mime_types' in row.snapshot && policy) setSettings({ ...row.snapshot, version: policy.policy.version, reason: `Pulihkan pengaturan dari versi ${row.version}` });
          setHistory(null); setError('');
        }}>Gunakan versi ini sebagai perubahan baru</button>}</article>)}</>}
        <div className="flex justify-between gap-3"><button type="button" className={button} disabled={!history || history.page <= 1 || historyLoading} onClick={() => setHistory(current => current ? { ...current, page: current.page - 1 } : null)}>Sebelumnya</button><button type="button" className={button} disabled={!historyMore || historyLoading} onClick={() => setHistory(current => current ? { ...current, page: current.page + 1 } : null)}>Berikutnya</button></div>
      </div>
    </Modal>
  </section>;
}
