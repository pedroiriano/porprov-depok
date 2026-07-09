import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function VenueDepok() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', image_url: '', address: '', 
    latitude: -6.4025, longitude: 106.7942, map_route_url: '', 
    capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchVenues();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/venues`, getAuthConfig());
      setVenues(res.data || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity.toString(), 10) || 0,
        city_guide_ids: [],
        cabor_ids: []
      };
      await axios.post(`${API_BASE_URL}/venues`, payload, getAuthConfig());
      setIsModalOpen(false);
      setFormData({ name: '', image_url: '', address: '', latitude: -6.4025, longitude: 106.7942, map_route_url: '', capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '' });
      fetchVenues();
    } catch (error) {
      console.error('Failed to create venue:', error);
      alert('Gagal menyimpan data venue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus venue ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/venues/${id}`, getAuthConfig());
      fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Data Venue Khusus Kota Depok</h2>
          <p className="text-text-muted text-sm mt-1">Kelola data lokasi pertandingan di area Depok.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Venue
        </button>
      </div>

      <div className="card">
        {/* Table */}
        <div className="table-container border-none rounded-none min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : venues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Venue.</p>
            </div>
          ) : (
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Nama Venue</th>
                  <th className="table-cell">Alamat</th>
                  <th className="table-cell">Kapasitas</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((item, i) => (
                  <tr key={item.id || i} className="table-row">
                    <td className="table-cell font-semibold text-text-primary">
                      {item.name}
                    </td>
                    <td className="table-cell text-sm text-text-secondary">
                      {item.address?.String || '-'}
                    </td>
                    <td className="table-cell">
                      {item.capacity?.Int32 || 0}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.readiness_status?.String === 'Siap' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                        {item.readiness_status?.String || 'Persiapan'}
                      </span>
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg">Tambah Venue Depok</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Venue</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Kesiapan</label>
                  <select 
                    value={formData.readiness_status}
                    onChange={(e) => setFormData({...formData, readiness_status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Persiapan">Persiapan</option>
                    <option value="Siap">Siap</option>
                    <option value="Sedang Digunakan">Sedang Digunakan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas</label>
                  <input 
                    type="number" required value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar (Foto)</label>
                <input 
                  type="text" value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="/assets/images/venue/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea 
                  rows={2} value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input 
                    type="text" value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fasilitas Utama</label>
                  <input 
                    type="text" value={formData.facilities}
                    onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Toilet, Parkir, Ruang Medis"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >Batal</button>
                <button 
                  type="submit" disabled={submitting}
                  className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
