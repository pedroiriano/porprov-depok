import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import Modal from '../components/Modal';
import { apiClient, authConfig, unwrapApiData, getApiErrorMessage } from '../lib/api';

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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex justify-between mb-4">
          <div className="relative w-72">
            <input 
              type="text" 
              placeholder="Cari pengguna..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Username</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Nama Lengkap</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Email</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Role</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Terdaftar</th>
                <th className="p-4 font-semibold text-sm text-gray-600 dark:text-gray-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{user.username}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{user.full_name}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openModal(user)}
                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 mx-1 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 mx-1 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input 
                type="text" 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              {/* CHANGE: Tambah indikator loading dan error untuk roles */}
              {rolesLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Memuat daftar role...</p>
              ) : (
                <>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                <span>Password {editingUser && '(Kosongkan jika tidak ingin diubah)'}</span>
                <KeyRound className="w-3 h-3 text-gray-400" />
              </label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              {editingUser && <p className="text-xs text-gray-500 mt-1">Admin dapat melakukan reset password pengguna melalui form ini.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors"
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
