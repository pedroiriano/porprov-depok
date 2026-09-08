import { Edit2, KeyRound, Loader2, Plus, Search, ShieldCheck, Trash2, UserRoundCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import { SelectInput, TextInput } from '../components/common/FormInputs';
import { RowsPerPageSelector, TablePagination } from '../components/common/TableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../components/cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../components/cuba/AdminPrimitives';
import { useTableControls } from '../hooks/useTableControls';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import { deleteUserDraft, readUserDraft, saveUserDraft, type StoredUserDraft, type UserDraftFields } from '../lib/userDraftStorage';

interface User {
  id: string;
  keycloak_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

type UserForm = {
  username: string;
  email: string;
  full_name: string;
  role: string;
  password: string;
};

type UserFormErrors = Partial<Record<keyof UserForm, string>>;
type UserSortKey = 'username' | 'full_name' | 'email' | 'role' | 'created_at';
type UserPagination = { page: number; limit: number; total: number; total_pages: number };
type UserPageResponse = { data: User[]; pagination: UserPagination };
type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

const FALLBACK_ROLES = ['super_admin', 'admin_venue', 'koresponden', 'verifikator', 'auditor'];
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Pengelola Utama', admin_venue: 'Pengelola Lokasi', koresponden: 'Koresponden', verifikator: 'Verifikator', auditor: 'Auditor',
};
const roleLabel = (role: string) => ROLE_LABELS[role] || role.replaceAll('_', ' ');
const emptyForm: UserForm = { username: '', email: '', full_name: '', role: '', password: '' };
const usernamePattern = /^[A-Za-z0-9._-]{3,64}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getDraftFields(form: UserForm): UserDraftFields {
  return {
    username: form.username,
    email: form.email,
    full_name: form.full_name,
    role: form.role,
  };
}

function sameDraftFields(left: UserDraftFields, right: UserDraftFields) {
  return left.username === right.username
    && left.email === right.email
    && left.full_name === right.full_name
    && left.role === right.role;
}

function validateUserForm(form: UserForm, editing: boolean): UserFormErrors {
  const errors: UserFormErrors = {};
  const username = form.username.trim();
  const email = form.email.trim();
  const fullName = form.full_name.trim();

  if (!usernamePattern.test(username)) errors.username = 'Gunakan 3–64 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.';
  if (email.length > 254 || !emailPattern.test(email)) errors.email = 'Masukkan alamat email yang valid.';
  if (fullName.length < 2 || fullName.length > 120) errors.full_name = 'Nama lengkap harus terdiri dari 2–120 karakter.';
  if (!form.role) errors.role = 'Pilih satu peran pengguna.';
  if ((!editing || form.password) && (form.password.length < 12 || form.password.length > 128)) errors.password = 'Kata sandi harus terdiri dari 12–128 karakter.';
  return errors;
}

export default function UserManagement() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [operationMessage, setOperationMessage] = useState('');
  const [operationError, setOperationError] = useState('');
  const [pagination, setPagination] = useState<UserPagination>({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formBaseline, setFormBaseline] = useState<UserDraftFields>(getDraftFields(emptyForm));
  const [availableDraft, setAvailableDraft] = useState<StoredUserDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const usersRequestRef = useRef(0);
  const table = useTableControls<UserSortKey>({ sortKey: 'created_at', sortDirection: 'desc', rowsPerPage: 10 });
  const {
    currentPage,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSort,
    resetPage,
    rowsPerPage,
    setPage,
    sortDirection,
    sortKey,
  } = table;
  const currentSubject = auth.user?.profile.sub;
  const draftFields = useMemo(() => getDraftFields(formData), [formData]);
  const draftKey = currentSubject
    ? `${currentSubject}:${window.location.pathname}:${editingUser ? `edit:${editingUser.id}` : 'create'}:user-v1`
    : '';
  const persistedFieldsDirty = !sameDraftFields(draftFields, formBaseline);
  const formDirty = persistedFieldsDirty || formData.password.length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    const requestID = ++usersRequestRef.current;
    setLoading(true);
    setUsersError('');
    try {
      const response = await apiClient.get<UserPageResponse>('/users', {
        ...authConfig(token),
        params: {
          page: currentPage,
          limit: rowsPerPage,
          q: debouncedSearch,
          sort: sortKey,
          order: sortDirection,
        },
      });
      if (requestID !== usersRequestRef.current) return;
      setUsers(response.data.data || []);
      setPagination(response.data.pagination);
      if (response.data.pagination.page !== currentPage) setPage(response.data.pagination.page);
    } catch (error) {
      if (requestID === usersRequestRef.current) setUsersError(getApiErrorMessage(error, 'Daftar pengguna gagal dimuat.'));
    } finally {
      if (requestID === usersRequestRef.current) setLoading(false);
    }
  }, [currentPage, debouncedSearch, rowsPerPage, setPage, sortDirection, sortKey, token]);

  const fetchRoles = useCallback(async () => {
    if (!token) return;
    setRolesLoading(true);
    setRolesError('');
    try {
      const response = await apiClient.get<string[]>('/roles', authConfig(token));
      const rawData = response.data;
      const roleList = Array.isArray(rawData) ? rawData : (unwrapApiData<string[]>(rawData) || []);
      if (roleList.length === 0) {
        setRoles(FALLBACK_ROLES);
        setRolesError('Daftar peran dari sistem identitas kosong; daftar peran baku sementara digunakan.');
      } else {
        setRoles(roleList);
      }
    } catch (error) {
      setRoles(FALLBACK_ROLES);
      setRolesError(getApiErrorMessage(error, 'Peran pengguna gagal dimuat; daftar peran baku sementara digunakan.'));
    } finally {
      setRolesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchRoles, fetchUsers]);

  useEffect(() => {
    const validIds = new Set(users.map((user) => user.id));
    setSelectedIds((current) => new Set([...current].filter((id) => validIds.has(id))));
  }, [users]);

  const availableRoles = roles.length > 0 ? roles : FALLBACK_ROLES;
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const openModal = (user?: User) => {
    const initialForm = user ? {
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: '',
    } : { ...emptyForm, role: availableRoles[0] || '' };
    setSubmitError('');
    setOperationError('');
    setFormErrors({});
    setEditingUser(user || null);
    setFormData(initialForm);
    setFormBaseline(getDraftFields(initialForm));
    setAvailableDraft(null);
    setDraftStatus('idle');
    setCloseConfirmationOpen(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen || !draftKey) return undefined;
    let cancelled = false;
    readUserDraft(draftKey).then((draft) => {
      if (!cancelled && draft && !sameDraftFields(draft.fields, formBaseline)) setAvailableDraft(draft);
    });
    return () => { cancelled = true; };
  }, [draftKey, formBaseline, isModalOpen]);

  useEffect(() => {
    if (!isModalOpen || !draftKey || !persistedFieldsDirty) return undefined;
    setDraftStatus('saving');
    let cancelled = false;
    const timer = window.setTimeout(() => {
      saveUserDraft(draftKey, draftFields)
        .then(() => { if (!cancelled) setDraftStatus('saved'); })
        .catch(() => { if (!cancelled) setDraftStatus('error'); });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draftFields, draftKey, isModalOpen, persistedFieldsDirty]);

  useEffect(() => {
    if (!isModalOpen || !formDirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formDirty, isModalOpen]);

  const closeEditor = () => {
    if (submitting) return;
    if (formDirty) {
      setCloseConfirmationOpen(true);
      return;
    }
    setIsModalOpen(false);
  };

  const restoreDraft = () => {
    if (!availableDraft) return;
    setFormData({ ...availableDraft.fields, password: '' });
    setAvailableDraft(null);
    setDraftStatus('saved');
  };

  const removeAvailableDraft = async () => {
    if (draftKey) await deleteUserDraft(draftKey);
    setAvailableDraft(null);
    setDraftStatus('idle');
  };

  const saveDraftAndClose = async () => {
    try {
      if (draftKey && persistedFieldsDirty) await saveUserDraft(draftKey, draftFields);
    } catch {
      setDraftStatus('error');
      setCloseConfirmationOpen(false);
      return;
    }
    setDraftStatus(persistedFieldsDirty ? 'saved' : 'idle');
    setCloseConfirmationOpen(false);
    setIsModalOpen(false);
  };

  const discardChangesAndClose = async () => {
    if (draftKey) await deleteUserDraft(draftKey);
    setAvailableDraft(null);
    setDraftStatus('idle');
    setCloseConfirmationOpen(false);
    setIsModalOpen(false);
  };

  const updateField = (field: keyof UserForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validateUserForm(formData, Boolean(editingUser));
    setFormErrors(errors);
    setSubmitError('');
    if (Object.keys(errors).length > 0 || !token) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
      };
      if (editingUser) await apiClient.put(`/users/${editingUser.id}`, payload, authConfig(token));
      else await apiClient.post('/users', payload, authConfig(token));
      if (draftKey) await deleteUserDraft(draftKey);
      setAvailableDraft(null);
      setDraftStatus('idle');
      setIsModalOpen(false);
      setOperationMessage(editingUser ? 'Perubahan pengguna berhasil disimpan.' : 'Pengguna baru berhasil dibuat.');
      await fetchUsers();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Gagal menyimpan pengguna.'));
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (ids: string[]) => {
    setOperationError('');
    const safeIds = ids.filter((id) => users.some((user) => user.id === id && user.keycloak_id !== currentSubject));
    if (safeIds.length > 0) setPendingDeleteIds(safeIds);
  };

  const confirmDelete = async () => {
    if (!token || pendingDeleteIds.length === 0) return;
    setDeleting(true);
    let failed = 0;
    for (const id of pendingDeleteIds) {
      try {
        await apiClient.delete(`/users/${id}`, authConfig(token));
      } catch {
        failed += 1;
      }
    }

    const completed = pendingDeleteIds.length - failed;
    setPendingDeleteIds([]);
    setSelectedIds(new Set());
    setDeleting(false);
    await fetchUsers();
    setOperationError(failed > 0 ? `${failed} pengguna gagal dinonaktifkan. Periksa catatan aktivitas sebelum mencoba kembali.` : '');
    setOperationMessage(completed > 0 ? `${completed} pengguna berhasil dinonaktifkan dan tetap dapat dipulihkan.` : '');
  };

  const columns = useMemo<Array<AdminDataTableColumn<User, UserSortKey>>>(() => [
    { key: 'username', label: 'Nama pengguna', sortKey: 'username', render: (user) => <span className="font-black text-slate-900 dark:text-white">{user.username}</span> },
    { key: 'full_name', label: 'Nama lengkap', sortKey: 'full_name', render: (user) => <span className="text-sm text-slate-600 dark:text-slate-200">{user.full_name}</span> },
    { key: 'email', label: 'Surel', sortKey: 'email', render: (user) => <span className="text-sm text-slate-600 dark:text-slate-200">{user.email}</span> },
    { key: 'role', label: 'Peran', sortKey: 'role', render: (user) => <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{roleLabel(user.role)}</span> },
    { key: 'created_at', label: 'Terdaftar', sortKey: 'created_at', render: (user) => <time className="text-sm text-slate-600 dark:text-slate-200" dateTime={user.created_at}>{new Date(user.created_at).toLocaleDateString('id-ID')}</time> },
  ], []);

  const pendingUsers = users.filter((user) => pendingDeleteIds.includes(user.id));
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };
  const handleServerSort = (key: UserSortKey) => {
    resetPage();
    handleSort(key);
  };
  const handleRowsChange = (value: number) => {
    resetPage();
    handleChangeRowsPerPage(value);
  };

  return (
    <section aria-labelledby="user-management-title">
      <AdminPageHeader
        eyebrow="Keamanan dan akses"
        title="Manajemen Akun"
        description="Kelola identitas dan peran operator. Hak akses selalu diperiksa kembali pada setiap tindakan."
        actions={<button type="button" onClick={() => openModal()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" /> Tambah pengguna</button>}
      />

      <h2 id="user-management-title" className="sr-only">Daftar pengguna Admin</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200"><UserRoundCheck className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pengguna aktif</p><p className="text-2xl font-black text-slate-950 dark:text-white">{pagination.total}</p></div></div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200"><ShieldCheck className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Peran tersedia</p><p className="text-2xl font-black text-slate-950 dark:text-white">{availableRoles.length}</p></div></div></div>
      </div>

      {operationMessage && <div className="mb-4"><AdminAlert tone="success">{operationMessage}</AdminAlert></div>}
      {operationError && <div className="mb-4"><AdminAlert>{operationError}</AdminAlert></div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700">
          <label className="relative block w-full md:max-w-sm"><span className="sr-only">Cari pengguna</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type="search" value={searchTerm} maxLength={80} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Cari nama, surel, nama pengguna, atau peran" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
          <RowsPerPageSelector rowsPerPage={rowsPerPage} onChange={handleRowsChange} />
        </div>

        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => requestDelete([...selectedIds])} deleting={deleting} itemLabel="pengguna" actionLabel="Nonaktifkan terpilih" loadingLabel="Menonaktifkan..." />

        <AdminDataTable<User, UserSortKey>
          caption="Daftar pengguna Admin PORPROV"
          rows={users}
          columns={columns}
          getRowId={(user) => user.id}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleServerSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          isRowSelectable={(user) => user.keycloak_id !== currentSubject}
          getRowLabel={(user) => user.username}
          selectionLabel="pengguna"
          loadingLabel="Memuat daftar pengguna..."
          loading={loading}
          error={usersError}
          onRetry={fetchUsers}
          emptyTitle={searchTerm ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}
          emptyDescription={searchTerm ? 'Ubah kata pencarian atau hapus filter untuk melihat seluruh pengguna.' : 'Tambahkan pengguna pertama untuk memulai pengelolaan akses.'}
          rowActions={(user) => <><button type="button" onClick={() => openModal(user)} className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200" aria-label={`Edit pengguna ${user.username}`} title="Edit pengguna"><Edit2 className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => requestDelete([user.id])} disabled={user.keycloak_id === currentSubject} className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200" aria-label={user.keycloak_id === currentSubject ? 'Akun aktif tidak dapat dinonaktifkan' : `Nonaktifkan pengguna ${user.username}`} title={user.keycloak_id === currentSubject ? 'Akun aktif dilindungi' : 'Nonaktifkan pengguna'}><Trash2 className="size-4" aria-hidden="true" /></button></>}
        />

        {!loading && !usersError && pagination.total > 0 && <TablePagination currentPage={pagination.page} totalPages={pagination.total_pages} totalItems={pagination.total} startItem={startItem} endItem={endItem} onPageChange={handleChangePage} itemLabel="pengguna" footerNote="Halaman diolah oleh sistem" />}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeEditor} closeDisabled={submitting} title={editingUser ? 'Ubah pengguna' : 'Tambah pengguna'} description="Perubahan identitas dan peran akan diselaraskan serta dicatat pada riwayat aktivitas." maxWidth="lg">
        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6" noValidate>
          {submitError && <AdminAlert>{submitError}</AdminAlert>}
          {availableDraft && (
            <AdminAlert tone="warning">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Draf lokal {new Date(availableDraft.savedAt).toLocaleString('id-ID')} tersedia. Kata sandi tidak pernah disimpan.</span>
                <span className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={restoreDraft} className="min-h-11 rounded-lg bg-yellow-900 px-3 text-xs font-black text-white hover:bg-yellow-950 dark:bg-yellow-200 dark:text-yellow-950">Pulihkan</button>
                  <button type="button" onClick={removeAvailableDraft} className="min-h-11 rounded-lg border border-yellow-700 px-3 text-xs font-black hover:bg-yellow-100 dark:border-yellow-300 dark:hover:bg-yellow-950">Buang draf</button>
                </span>
              </div>
            </AdminAlert>
          )}
          <TextInput label="Nama pengguna" name="username" value={formData.username} onChange={(event) => updateField('username', event.target.value)} error={formErrors.username} autoComplete="username" required />
          <TextInput label="Surel" type="email" name="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} error={formErrors.email} autoComplete="email" required />
          <TextInput label="Nama lengkap" name="full_name" value={formData.full_name} onChange={(event) => updateField('full_name', event.target.value)} error={formErrors.full_name} autoComplete="name" required />
          {rolesLoading ? <div className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-300" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Memuat peran...</div> : <><SelectInput label="Peran" name="role" value={formData.role} onChange={(event) => updateField('role', event.target.value)} options={availableRoles.map((role) => ({ value: role, label: roleLabel(role) }))} error={formErrors.role} required />{rolesError && <AdminAlert tone="warning">{rolesError}</AdminAlert>}</>}
          <div className="relative"><KeyRound className="pointer-events-none absolute right-3 top-10 size-4 text-slate-400" aria-hidden="true" /><TextInput label={editingUser ? 'Kata sandi baru' : 'Kata sandi awal'} type="password" name="password" value={formData.password} onChange={(event) => updateField('password', event.target.value)} error={formErrors.password} helpText={editingUser ? 'Kosongkan jika kata sandi tidak ingin diubah.' : 'Minimal 12 karakter; jangan menggunakan kata sandi sementara yang mudah ditebak.'} autoComplete="new-password" required={!editingUser} /></div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-300" role="status" aria-live="polite">
            {draftStatus === 'saving' && 'Menyimpan draf aman...'}
            {draftStatus === 'saved' && 'Draf lokal tersimpan selama maksimal 7 hari. Kata sandi tidak disimpan.'}
            {draftStatus === 'idle' && 'Perubahan selain kata sandi akan disimpan otomatis di perangkat ini.'}
            {draftStatus === 'error' && 'Draf lokal gagal disimpan. Jangan tutup atau muat ulang halaman sebelum mencoba kembali.'}
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700"><button type="button" onClick={closeEditor} disabled={submitting} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button><button type="submit" disabled={submitting || rolesLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{submitting ? 'Menyimpan...' : 'Simpan pengguna'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={closeConfirmationOpen} onClose={() => setCloseConfirmationOpen(false)} title="Simpan perubahan sebagai draf?" description="Formulir memiliki perubahan yang belum tersimpan." maxWidth="md">
        <div className="space-y-5 p-4 sm:p-6">
          <AdminAlert tone="warning">Nama pengguna, surel, nama lengkap, dan peran dapat dipulihkan hingga 7 hari. Demi keamanan, kata sandi tidak pernah dimasukkan ke draf.</AdminAlert>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button type="button" onClick={discardChangesAndClose} className="min-h-11 rounded-xl border border-red-300 px-4 text-sm font-black text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40">Buang perubahan</button>
            <button type="button" onClick={() => setCloseConfirmationOpen(false)} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Lanjut mengedit</button>
            <button type="button" onClick={saveDraftAndClose} data-autofocus className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700">Simpan draf dan tutup</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={pendingDeleteIds.length > 0} onClose={() => !deleting && setPendingDeleteIds([])} closeDisabled={deleting} title={pendingDeleteIds.length > 1 ? 'Nonaktifkan pengguna terpilih?' : 'Nonaktifkan pengguna?'} description="Akun akan dinonaktifkan, sedangkan riwayat dan relasi datanya tetap dipertahankan." maxWidth="md">
        <div className="space-y-5 p-4 sm:p-6"><AdminAlert tone="warning">Aksi ini menghentikan akses pengguna tetapi mempertahankan relasi dan catatan aktivitas.</AdminAlert><ul className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">{pendingUsers.map((user) => <li key={user.id} className="flex items-center justify-between gap-3"><span className="font-black text-slate-900 dark:text-white">{user.username}</span><span className="truncate text-slate-500 dark:text-slate-300">{user.email}</span></li>)}</ul><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPendingDeleteIds([])} disabled={deleting} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Batal</button><button type="button" onClick={confirmDelete} disabled={deleting} data-autofocus className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50">{deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{deleting ? 'Menonaktifkan...' : 'Ya, nonaktifkan'}</button></div></div>
      </Modal>
    </section>
  );
}
