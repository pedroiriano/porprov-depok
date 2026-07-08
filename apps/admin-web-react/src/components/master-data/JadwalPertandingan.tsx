import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function JadwalPertandingan() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    nomor_tanding_id: '', 
    venue_id: '', 
    match_date: '', 
    status: 'scheduled', 
    round: 'penyisihan' 
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/schedule/matches`, getAuthConfig());
      setMatches(res.data || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Backend expects RFC3339 for match_date
      let match_date = formData.match_date;
      if (match_date) {
        match_date = new Date(match_date).toISOString();
      }
      const payload = {
        ...formData,
        match_date
      };
      await axios.post(`${API_BASE_URL}/schedule/matches`, payload, getAuthConfig());
      setIsModalOpen(false);
      setFormData({ nomor_tanding_id: '', venue_id: '', match_date: '', status: 'scheduled', round: 'penyisihan' });
      fetchMatches();
    } catch (error) {
      console.error('Failed to create match:', error);
      alert('Gagal menyimpan data jadwal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/schedule/matches/${id}`, getAuthConfig());
      fetchMatches();
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Jadwal Pertandingan</h2>
          <p className="text-text-muted text-sm mt-1">Kelola jadwal seluruh pertandingan.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Jadwal
        </button>
      </div>

      <div className="card">
        <div className="table-container border-none rounded-none min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Jadwal.</p>
            </div>
          ) : (
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Waktu</th>
                  <th className="table-cell">ID Venue</th>
                  <th className="table-cell">Babak</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item, i) => (
                  <tr key={item.id || i} className="table-row">
                    <td className="table-cell font-semibold text-text-primary">
                      {new Date(item.match_date).toLocaleString('id-ID')}
                    </td>
                    <td className="table-cell text-sm text-text-secondary">
                      {item.venue_id}
                    </td>
                    <td className="table-cell">
                      {item.round}
                    </td>
                    <td className="table-cell">
                      {item.status}
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
              <h3 className="font-bold text-lg">Tambah Jadwal Pertandingan</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Nomor Tanding (UUID)</label>
                <input 
                  type="text" required value={formData.nomor_tanding_id}
                  onChange={(e) => setFormData({...formData, nomor_tanding_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Venue (UUID)</label>
                <input 
                  type="text" required value={formData.venue_id}
                  onChange={(e) => setFormData({...formData, venue_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Pertandingan</label>
                <input 
                  type="datetime-local" required value={formData.match_date}
                  onChange={(e) => setFormData({...formData, match_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Babak</label>
                <select 
                  value={formData.round}
                  onChange={(e) => setFormData({...formData, round: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="penyisihan">Penyisihan</option>
                  <option value="perempat_final">Perempat Final</option>
                  <option value="semifinal">Semifinal</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="scheduled">Terjadwal</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="finished">Selesai</option>
                  <option value="delayed">Ditunda</option>
                </select>
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
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
