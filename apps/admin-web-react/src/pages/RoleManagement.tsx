import { Archive, Edit2, Loader2, Plus, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import { TextInput } from '../components/common/FormInputs';
import { AdminDataTable, type AdminDataTableColumn } from '../components/cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import type { SortDirection } from '../hooks/useTableControls';
import { useAuthorization } from '../contexts/authorization';
import { RowsPerPageSelector, TablePagination } from '../components/common/TableControls';

type AccessRole = { id: string; slug: string; name: string; description: string; is_system: boolean; is_active: boolean; permissions: string[]; assigned_count: number; deleted_at?: string | null };
type AccessPermission = { code: string; domain: string; action: string; name: string; description: string };
type RoleForm = { slug: string; name: string; description: string; permissions: string[] };
type RoleSortKey = 'name' | 'permissions' | 'assigned' | 'status';
type RolePage = { data: AccessRole[]; page: number; limit: number; total: number; total_pages: number };

const emptyForm: RoleForm = { slug: '', name: '', description: '', permissions: [] };
const roleCodePattern = /^[a-z][a-z0-9_]{2,63}$/;
const domainLabels: Record<string, string> = { dashboard: 'Dasbor', master_data: 'Data Utama', city_guide: 'Panduan Kota', media: 'Pustaka Media', livescore: 'Skor Langsung', medal: 'Perolehan Medali', audit: 'Log Audit', integration: 'Kesehatan Integrasi', user: 'Akun Pengguna', role: 'Peran dan Hak Akses', notification: 'Notifikasi' };

export default function RoleManagement() {
  const auth = useAuth(); const token = auth.user?.access_token;
  const authorization = useAuthorization();
  const [roles, setRoles] = useState<AccessRole[]>([]); const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [editorOpen, setEditorOpen] = useState(false); const [editing, setEditing] = useState<AccessRole | null>(null); const [form, setForm] = useState<RoleForm>(emptyForm); const [submitting, setSubmitting] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortKey, setSortKey] = useState<RoleSortKey>('name'); const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [search, setSearch] = useState(''); const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1); const [limit, setLimit] = useState(10); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(0);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => window.clearTimeout(timer); }, [search]);

  const load = useCallback(async () => {
    if (!token) return; setLoading(true); setError('');
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiClient.get<RolePage>('/access-roles', { ...authConfig(token), params: { include_archived: includeArchived, page, limit, q: debouncedSearch, sort: sortKey, order: sortDirection } }),
        apiClient.get<AccessPermission[]>('/access-roles/permissions', authConfig(token)),
      ]);
      setRoles(rolesResponse.data.data || []); setTotal(rolesResponse.data.total || 0); setTotalPages(rolesResponse.data.total_pages || 0);
      setPermissions(unwrapApiData<AccessPermission[]>(permissionsResponse.data) || permissionsResponse.data || []);
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Peran dan hak akses belum dapat dimuat.')); }
    finally { setLoading(false); }
  }, [debouncedSearch, includeArchived, limit, page, sortDirection, sortKey, token]);

  useEffect(() => { void load(); }, [load]);
  const groupedPermissions = useMemo(() => permissions.reduce((groups, permission) => {
    const items = groups.get(permission.domain) || [];
    items.push(permission); groups.set(permission.domain, items); return groups;
  }, new Map<string, AccessPermission[]>()), [permissions]);
  const openEditor = (role?: AccessRole) => { setEditing(role || null); setForm(role ? { slug: role.slug, name: role.name, description: role.description, permissions: role.permissions } : emptyForm); setEditorOpen(true); setError(''); };
  const togglePermission = (code: string) => setForm((current) => ({ ...current, permissions: current.permissions.includes(code) ? current.permissions.filter((item) => item !== code) : [...current.permissions, code] }));

  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!token || form.name.trim().length < 3 || (!editing && !roleCodePattern.test(form.slug))) return;
    setSubmitting(true); setError('');
    try {
      if (editing) await apiClient.put(`/access-roles/${editing.id}`, { name: form.name.trim(), description: form.description.trim(), permissions: form.permissions }, authConfig(token));
      else await apiClient.post('/access-roles', { ...form, slug: form.slug.trim().toLowerCase(), name: form.name.trim(), description: form.description.trim() }, authConfig(token));
      setEditorOpen(false); setNotice(editing ? 'Peran dan hak akses berhasil diperbarui.' : 'Peran baru berhasil dibuat.'); await load();
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Peran gagal disimpan.')); }
    finally { setSubmitting(false); }
  };

  const changeStatus = async (role: AccessRole) => {
    if (!token) return; setError('');
    try { await apiClient.put(`/access-roles/${role.id}/status`, { is_active: !role.is_active, reason: role.is_active ? 'Dinonaktifkan melalui Manajemen Peran' : '' }, authConfig(token)); setNotice(role.is_active ? 'Peran berhasil dinonaktifkan.' : 'Peran berhasil diaktifkan.'); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError, 'Status peran gagal diubah.')); }
  };

  const archive = async (role: AccessRole) => {
    if (!token) return; setError('');
    try { await apiClient.delete(`/access-roles/${role.id}`, { ...authConfig(token), data: { reason: 'Diarsipkan melalui Manajemen Peran' } }); setNotice('Peran berhasil diarsipkan.'); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError, 'Peran gagal diarsipkan.')); }
  };
  const restore = async (role: AccessRole) => { if (!token) return; try { await apiClient.post(`/access-roles/${role.id}/restore`, undefined, authConfig(token)); setNotice('Peran berhasil dipulihkan.'); await load(); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Peran gagal dipulihkan.')); } };

  const columns = useMemo<Array<AdminDataTableColumn<AccessRole, string>>>(() => [
    { key: 'name', label: 'Peran', sortKey: 'name', render: (role) => <div><p className="font-black text-slate-950 dark:text-white">{role.name}</p><p className="text-xs text-slate-500 dark:text-slate-300">{role.slug}</p></div> },
    { key: 'permissions', label: 'Hak akses', sortKey: 'permissions', render: (role) => <span className="font-bold">{role.permissions.length.toLocaleString('id-ID')} izin</span> },
    { key: 'assigned', label: 'Pengguna', sortKey: 'assigned', render: (role) => role.assigned_count.toLocaleString('id-ID') },
    { key: 'status', label: 'Status', sortKey: 'status', render: (role) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${role.deleted_at ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white' : role.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{role.deleted_at ? 'Diarsipkan' : role.is_active ? 'Aktif' : 'Tidak Aktif'}</span> },
  ], []);
  const start = total === 0 ? 0 : (page - 1) * limit + 1; const end = Math.min(page * limit, total);

  return <section>
    <AdminPageHeader eyebrow="Keamanan dan akses" title="Peran dan Hak Akses" description="Atur kewenangan setiap peran secara konsisten pada menu, halaman, tombol, dan layanan data." actions={authorization.hasPermission('role.create') ? <button type="button" onClick={() => openEditor()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white"><Plus className="size-4" aria-hidden="true" />Tambah peran</button> : undefined} />
    {notice && <div className="mb-4"><AdminAlert tone="success">{notice}</AdminAlert></div>}{error && <div className="mb-4"><AdminAlert>{error}</AdminAlert></div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"><label className="relative w-full sm:max-w-sm"><span className="sr-only">Cari peran</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type="search" value={search} maxLength={80} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama atau kode peran" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 dark:border-slate-600 dark:bg-slate-800" /></label><div className="flex flex-wrap items-center gap-3"><label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={includeArchived} onChange={(event) => { setIncludeArchived(event.target.checked); setPage(1); }} className="size-5 rounded" />Tampilkan arsip</label><RowsPerPageSelector rowsPerPage={limit} onChange={(value) => { setLimit(value); setPage(1); }} /></div></div><AdminDataTable caption="Daftar peran dan hak akses" rows={roles} columns={columns} getRowId={(role) => role.id} sortKey={sortKey} sortDirection={sortDirection} onSort={(key)=>{if(key===sortKey)setSortDirection((current)=>current==='asc'?'desc':'asc');else{setSortKey(key as RoleSortKey);setSortDirection('asc')}setPage(1)}} selectedIds={new Set()} onSelectedIdsChange={() => undefined} selectionEnabled={false} loading={loading} loadingLabel="Memuat peran..." error={error} onRetry={load} emptyTitle={search ? 'Peran tidak ditemukan' : 'Belum ada peran'} emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan peran sesuai kebutuhan operasional.'} rowActions={(role) => role.deleted_at ? authorization.hasPermission('role.restore') && <button type="button" onClick={() => void restore(role)} className="admin-cuba-icon-button" aria-label={`Pulihkan ${role.name}`}><RotateCcw className="size-4" aria-hidden="true" /></button> : <>{authorization.hasPermission('role.update') && <button type="button" onClick={() => openEditor(role)} className="admin-cuba-icon-button" aria-label={`Ubah ${role.name}`}><Edit2 className="size-4" aria-hidden="true" /></button>}{authorization.hasPermission('role.status') && <button type="button" onClick={() => void changeStatus(role)} disabled={role.is_system || role.assigned_count > 0} className="admin-cuba-icon-button disabled:opacity-35" aria-label={`${role.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${role.name}`}><ShieldCheck className="size-4" aria-hidden="true" /></button>}{authorization.hasPermission('role.archive') && <button type="button" onClick={() => void archive(role)} disabled={role.is_system || role.assigned_count > 0} className="admin-cuba-icon-button text-red-600 disabled:opacity-35" aria-label={`Arsipkan ${role.name}`}><Archive className="size-4" aria-hidden="true" /></button>}</>} />{!loading && !error && total > 0 && <TablePagination currentPage={page} totalPages={totalPages} totalItems={total} startItem={start} endItem={end} onPageChange={setPage} itemLabel="peran" />}</div>
    <Modal isOpen={editorOpen} onClose={() => !submitting && setEditorOpen(false)} closeDisabled={submitting} title={editing ? 'Ubah peran' : 'Tambah peran'} description="Pilih hak akses paling sedikit yang diperlukan untuk menjalankan tugas." maxWidth="xl"><form onSubmit={save} className="space-y-5 p-4 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Kode peran" name="slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} disabled={Boolean(editing)} helpText="Huruf kecil, angka, dan garis bawah. Tidak dapat diubah setelah dibuat." required /><TextInput label="Nama peran" name="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></div><TextInput label="Keterangan" name="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /><fieldset><legend className="text-sm font-black text-slate-900 dark:text-white">Hak akses</legend><div className="mt-3 grid max-h-80 gap-4 overflow-y-auto rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2">{[...groupedPermissions.entries()].map(([domain, items]) => <section key={domain}><h3 className="mb-2 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-200">{domainLabels[domain] || 'Fungsi lainnya'}</h3><div className="space-y-2">{items.map((permission) => <label key={permission.code} className="flex min-h-10 items-start gap-2 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800"><input type="checkbox" checked={form.permissions.includes(permission.code)} onChange={() => togglePermission(permission.code)} className="mt-0.5 size-5 rounded" /><span><strong className="block text-sm">{permission.name}</strong><span className="text-xs text-slate-500 dark:text-slate-300">{permission.description || 'Akses sesuai tugas pada bagian ini.'}</span></span></label>)}</div></section>)}</div></fieldset><div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700"><button type="button" onClick={() => setEditorOpen(false)} className="min-h-11 rounded-xl border px-4 font-bold">Batal</button><button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white disabled:opacity-50">{submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Simpan peran</button></div></form></Modal>
  </section>;
}
