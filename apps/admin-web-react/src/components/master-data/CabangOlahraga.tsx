import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function CabangOlahraga() {
  const [cabors, setCabors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    icon_url: '',
    kategori: 'Tanding',
    total_medali: 0,
    technical_delegate: '',
    status: 'Aktif'
  });
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchCabors();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchCabors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/master-data/cabors`, getAuthConfig());
      setCabors(res.data || []);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/master-data/cabors`, {
        ...formData,
        total_medali: parseInt(formData.total_medali.toString(), 10) || 0
      }, getAuthConfig());
      setIsModalOpen(false);
      setFormData({ name: '', description: '', icon_url: '', kategori: 'Tanding', total_medali: 0, technical_delegate: '', status: 'Aktif' });
      fetchCabors();
    } catch (error) {
      console.error('Failed to create cabor:', error);
      alert('Gagal menyimpan data cabang olahraga.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus cabor ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/master-data/cabors/${id}`, getAuthConfig());
      fetchCabors();
    } catch (error) {
      console.error('Failed to delete cabor:', error);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Master Data: Cabang Olahraga</h2>
          <p className="text-text-muted text-sm mt-1">Kelola data seluruh cabang olahraga PORPROV.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Cabor
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama cabor atau kode..." 
              className="form-input pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : cabors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Cabang Olahraga.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">ID (UUID)</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nama Cabor</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Kategori</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Medali</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Technical Delegate</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cabors.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {(item.id || '').substring(0, 8)}...
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.kategori?.String || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.total_medali?.Int32 || 0}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.technical_delegate?.String || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status?.String === 'Aktif' ? 'bg-success-100 text-success-700' : 
                        item.status?.String === 'Eksibisi' ? 'bg-warning-100 text-warning-700' : 
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.status?.String || 'Aktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tambah Cabang Olahraga</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="cabor-form" onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Cabor</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="Misal: Sepak Bola"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Ikon (Logo Cabor)</label>
                  <input 
                    type="text" 
                    value={formData.icon_url}
                    onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                    className="form-input"
                    placeholder="/assets/images/cabor/sepak-bola.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                    <select 
                      value={formData.kategori}
                      onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                      className="form-input"
                    >
                      <option value="Tanding">Tanding</option>
                      <option value="Seni/Terukur">Seni/Terukur</option>
                      <option value="E-Sports">E-Sports</option>
                      <option value="Eksibisi">Eksibisi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="form-input"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Eksibisi">Eksibisi</option>
                      <option value="Non-Aktif">Non-Aktif</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Medali</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.total_medali}
                      onChange={(e) => setFormData({...formData, total_medali: parseInt(e.target.value) || 0})}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Technical Delegate</label>
                    <input 
                      type="text" 
                      value={formData.technical_delegate}
                      onChange={(e) => setFormData({...formData, technical_delegate: e.target.value})}
                      className="form-input"
                      placeholder="Nama TD"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deskripsi/Keterangan</label>
                  <textarea 
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    placeholder="Keterangan tambahan..."
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-slate-800/50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="cabor-form"
                disabled={submitting}
                className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
