import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function CityGuide() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'Wisata', description: '', address: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchGuides();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/master-data/city-guides`, getAuthConfig());
      setGuides(res.data || []);
    } catch (error) {
      console.error('Failed to fetch city guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/master-data/city-guides`, formData, getAuthConfig());
      setIsModalOpen(false);
      setFormData({ title: '', category: 'Wisata', description: '', address: '', image_url: '' });
      fetchGuides();
    } catch (error) {
      console.error('Failed to create city guide:', error);
      alert('Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus panduan ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/master-data/city-guides/${id}`, getAuthConfig());
      fetchGuides();
    } catch (error) {
      console.error('Failed to delete city guide:', error);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">City Guide Kota Depok</h2>
          <p className="text-text-muted text-sm mt-1">Kelola panduan wisata, kuliner, dan lokasi penting di Depok.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Panduan
        </button>
      </div>

      <div className="card">
        <div className="table-container border-none rounded-none min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : guides.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data City Guide.</p>
            </div>
          ) : (
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Judul</th>
                  <th className="table-cell">Kategori</th>
                  <th className="table-cell">Alamat</th>
                  <th className="table-cell text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((item, i) => (
                  <tr key={item.id || i} className="table-row">
                    <td className="table-cell font-semibold text-text-primary">
                      {item.title}
                    </td>
                    <td className="table-cell text-sm text-text-secondary">
                      {item.category}
                    </td>
                    <td className="table-cell">
                      {item.address?.String || '-'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-red-50 rounded-md transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg">Tambah City Guide</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
                <input 
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Coffee Shop">Coffee Shop</option>
                  <option value="Wisata Kuliner">Wisata Kuliner</option>
                  <option value="Tempat Menginap">Tempat Menginap</option>
                  <option value="Wisata Buatan">Wisata Buatan</option>
                  <option value="Wisata Situ">Wisata Situ</option>
                  <option value="Pusat Perbelanjaan">Pusat Perbelanjaan</option>
                  <option value="Rumah Sakit">Rumah Sakit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea 
                  rows={2} value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar</label>
                <input 
                  type="url" value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >Batal</button>
                <button 
                  type="submit" disabled={submitting}
                  className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
