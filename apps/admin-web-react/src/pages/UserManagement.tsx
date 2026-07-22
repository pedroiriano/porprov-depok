import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import { apiClient, authConfig, unwrapApiData, getApiErrorMessage } from '../lib/api';
// INFO: Import table controls
import { useTableControls, usePagination } from '../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../components/common/TableControls';

interface User {
  id: string;
  keycloak_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

// INFO: Hardcoded fallback roles jika Keycloak API gagal
const FALLBACK_ROLES = ['super_admin', 'admin', 'operator', 'reporter', 'viewer'];

type UserSortKey = 'username' | 'full_name' | 'email' | 'role' | 'created_at';

export default function UserManagement() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitError, setSubmitError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: '',
    password: ''
  });

  // INFO: Initialize table controls
  const table = useTableControls<UserSortKey>({ sortKey: 'created_at', sortDirection: 'desc', rowsPerPage: 10 });

  // CHANGE: Reset page when search changes
  useEffect(() => {
    table.resetPage();
  }, [searchTerm, table.resetPage]);

  // INFO: Menggunakan apiClient dari lib/api.ts untuk konsistensi envelope unwrapping
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiClient.get<User[]>('/users', authConfig(token));
      setUsers(unwrapApiData<User[]>(response.data) || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // CHANGE: Menggunakan apiClient + unwrapApiData untuk menangani envelope {data: [...]} dari API Gateway
  const fetchRoles = useCallback(async () => {
    if (!token) return;
    setRolesLoading(true);
    setRolesError('');
    try {
      const response = await apiClient.get<string[]>('/roles', authConfig(token));
      const rawData = response.data;
      // INFO: Handle baik response langsung (array) maupun envelope {data: [...]}
      let roleList: string[];
      if (Array.isArray(rawData)) {
        roleList = rawData;
      } else {
        roleList = unwrapApiData<string[]>(rawData) || [];
      }
      if (roleList.length > 0) {
        setRoles(roleList);
      } else {
        // INFO: Fallback jika API mengembalikan array kosong
        setRoles(FALLBACK_ROLES);
        setRolesError('API mengembalikan daftar role kosong, menggunakan fallback.');
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      // CHANGE: Gunakan fallback roles agar pengguna tetap bisa memilih role
      setRoles(FALLBACK_ROLES);
      setRolesError(getApiErrorMessage(error, 'Gagal memuat role dari Keycloak, menggunakan daftar fallback.'));
    } finally {
      setRolesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!token) return;
    try {
      const url = editingUser ? `/users/${editingUser.id}` : '/users';
      const method = editingUser ? 'put' : 'post';
      
      await apiClient[method](url, formData, authConfig(token));
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Gagal menyimpan pengguna.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;
    if (!token) return;
    
    try {
      await apiClient.delete(`/users/${id}`, authConfig(token));
      fetchUsers();
    } catch (error) {
      alert(getApiErrorMessage(error, 'Gagal menghapus pengguna.'));
    }
  };

  const openModal = (user?: User) => {
    setSubmitError('');
    // INFO: Gunakan roles yang sudah di-fetch, atau fallback jika masih kosong
    const availableRoles = roles.length > 0 ? roles : FALLBACK_ROLES;
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: availableRoles[0] || '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  // PERFORMANCE: Use useMemo for sorting and filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA = a[table.sortKey as keyof User] ?? '';
      let valB = b[table.sortKey as keyof User] ?? '';
      
      if (table.sortKey === 'created_at') {
        const timeA = new Date(valA as string).getTime();
        const timeB = new Date(valB as string).getTime();
        return table.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return table.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [filteredUsers, table.sortKey, table.sortDirection]);

  // INFO: Use usePagination hook
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedUsers,
    table.currentPage,
    table.rowsPerPage
  );

  // INFO: Gabungkan roles dari API + fallback untuk tampilan yang konsisten
  const availableRoles = roles.length > 0 ? roles : FALLBACK_ROLES;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Akun</h1>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari pengguna..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <RowsPerPageSelector
            rowsPerPage={table.rowsPerPage}
            onChange={table.handleChangeRowsPerPage}
          />
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
              <p>Tidak ada pengguna ditemukan.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <SortableHeader<UserSortKey> sortKey="username" currentSortKey={table.sortKey} direction={table.sortDirection} onSort={table.handleSort} className="p-4 font-medium">Username</SortableHeader>
                  <SortableHeader<UserSortKey> sortKey="full_name" currentSortKey={table.sortKey} direction={table.sortDirection} onSort={table.handleSort} className="p-4 font-medium">Nama Lengkap</SortableHeader>
                  <SortableHeader<UserSortKey> sortKey="email" currentSortKey={table.sortKey} direction={table.sortDirection} onSort={table.handleSort} className="p-4 font-medium">Email</SortableHeader>
                  <SortableHeader<UserSortKey> sortKey="role" currentSortKey={table.sortKey} direction={table.sortDirection} onSort={table.handleSort} className="p-4 font-medium">Role</SortableHeader>
                  <SortableHeader<UserSortKey> sortKey="created_at" currentSortKey={table.sortKey} direction={table.sortDirection} onSort={table.handleSort} className="p-4 font-medium">Terdaftar</SortableHeader>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {user.username}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.full_name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(user)}
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* INFO: Table Footer for Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.handleChangePage}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="p-6">
          {/* INFO: Tampilkan error submit jika ada */}
          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
              <input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
              {/* CHANGE: Tambah indikator loading dan error untuk roles */}
              {rolesLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Memuat daftar role...</p>
              ) : (
                <>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Pilih Role</option>
                    {availableRoles.map(r => (
                      <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{r}</option>
                    ))}
                  </select>
                  {rolesError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{rolesError}</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Password {editingUser && '(Kosongkan jika tidak ingin diubah)'}</span>
                <KeyRound className="w-3 h-3 text-slate-400" />
              </label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              {editingUser && <p className="text-xs text-slate-500 mt-1">Admin dapat melakukan reset password pengguna melalui form ini.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
