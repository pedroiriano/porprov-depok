import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function JadwalPertandingan() {
  const [matches, setMatches] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [cabors, setCabors] = useState<any[]>([]);
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
    fetchVenues();
    fetchCabors();
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

  const fetchVenues = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/venues`, getAuthConfig());
      setVenues(res.data || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    }
  };

  const fetchCabors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/master-data/cabors`, getAuthConfig());
      setCabors(res.data || []);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
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

  // Helper to find names
  const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || id;
  const getCaborName = (id: string) => cabors.find(c => c.id === id)?.name || id;

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
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari jadwal..." 
              className="form-input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Jadwal.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Waktu</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Cabor / Nomor</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Venue</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Babak</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {new Date(item.match_date).toLocaleString('id-ID', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {getCaborName(item.nomor_tanding_id)}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {getVenueName(item.venue_id)}
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.round?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'finished' ? 'bg-success-100 text-success-700' :
                        item.status === 'ongoing' ? 'bg-primary-100 text-primary-700' :
                        item.status === 'delayed' ? 'bg-danger-100 text-danger-700' :
                        'bg-warning-100 text-warning-700'
                      }`}>
                        {item.status}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tambah Jadwal Pertandingan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="jadwal-form" onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cabor / Nomor Tanding</label>
                  <select 
                    required 
                    value={formData.nomor_tanding_id}
                    onChange={(e) => setFormData({...formData, nomor_tanding_id: e.target.value})}
                    className="form-input"
                  >
                    <option value="" disabled>Pilih Cabor / Nomor Tanding...</option>
                    {cabors.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.kategori?.String || '-'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasi (Venue)</label>
                  <select 
                    required 
                    value={formData.venue_id}
                    onChange={(e) => setFormData({...formData, venue_id: e.target.value})}
                    className="form-input"
                  >
                    <option value="" disabled>Pilih Lokasi Venue...</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Waktu Pertandingan</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={formData.match_date}
                    onChange={(e) => setFormData({...formData, match_date: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Babak</label>
                    <select 
                      value={formData.round}
                      onChange={(e) => setFormData({...formData, round: e.target.value})}
                      className="form-input"
                    >
                      <option value="penyisihan">Penyisihan</option>
                      <option value="perempat_final">Perempat Final</option>
                      <option value="semifinal">Semifinal</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="form-input"
                    >
                      <option value="scheduled">Terjadwal</option>
                      <option value="ongoing">Berlangsung</option>
                      <option value="finished">Selesai</option>
                      <option value="delayed">Ditunda</option>
                    </select>
                  </div>
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
                form="jadwal-form"
                disabled={submitting}
                className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
