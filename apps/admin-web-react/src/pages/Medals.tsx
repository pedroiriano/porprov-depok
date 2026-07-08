import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function Medals() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ kontingen_id: '', gold: 0, silver: 0, bronze: 0 });
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchStandings();
  }, []);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    }
  }

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/medals/standings`, getAuthConfig());
      setStandings(res.data || []);
    } catch (error) {
      console.error('Failed to fetch medal standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/medals/add`, formData, getAuthConfig());
      setIsModalOpen(false);
      setFormData({ kontingen_id: '', gold: 0, silver: 0, bronze: 0 });
      fetchStandings();
    } catch (error) {
      console.error('Failed to add medals:', error);
      alert('Gagal menambah perolehan medali.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Perolehan Medali (Kota Depok & Lainnya)</h2>
          <p className="text-text-muted text-sm mt-1">Pantau dan kelola klasemen perolehan medali PORPROV.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Update Medali
        </button>
      </div>

      <div className="card">
        <div className="table-container border-none rounded-none min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : standings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Klasemen Medali.</p>
            </div>
          ) : (
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Kontingen ID</th>
                  <th className="table-cell text-center">Emas (Gold)</th>
                  <th className="table-cell text-center">Perak (Silver)</th>
                  <th className="table-cell text-center">Perunggu (Bronze)</th>
                  <th className="table-cell text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((item, i) => (
                  <tr key={item.id || i} className="table-row">
                    <td className="table-cell font-semibold text-text-primary">
                      {item.kontingen_id}
                    </td>
                    <td className="table-cell text-center font-bold text-yellow-600">
                      {item.gold}
                    </td>
                    <td className="table-cell text-center font-bold text-slate-400">
                      {item.silver}
                    </td>
                    <td className="table-cell text-center font-bold text-amber-700">
                      {item.bronze}
                    </td>
                    <td className="table-cell text-center font-bold">
                      {item.gold + item.silver + item.bronze}
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
              <h3 className="font-bold text-lg">Update Medali Kontingen</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kontingen ID (UUID)</label>
                <input 
                  type="text" required value={formData.kontingen_id}
                  onChange={(e) => setFormData({...formData, kontingen_id: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emas</label>
                  <input 
                    type="number" required value={formData.gold}
                    onChange={(e) => setFormData({...formData, gold: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Perak</label>
                  <input 
                    type="number" required value={formData.silver}
                    onChange={(e) => setFormData({...formData, silver: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Perunggu</label>
                  <input 
                    type="number" required value={formData.bronze}
                    onChange={(e) => setFormData({...formData, bronze: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  className="px-4 py-2 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
