import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function JadwalPertandingan() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

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
    </div>
  );
}
