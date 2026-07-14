import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { TextInput } from '../components/common/FormInputs';

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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Perolehan Medali (Kota Depok & Lainnya)</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau dan kelola klasemen perolehan medali PORPROV.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Update Medali
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : standings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
              <p>Belum ada data Klasemen Medali.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Kontingen ID</th>
                  <th className="p-4 font-medium text-center">Emas (Gold)</th>
                  <th className="p-4 font-medium text-center">Perak (Silver)</th>
                  <th className="p-4 font-medium text-center">Perunggu (Bronze)</th>
                  <th className="p-4 font-medium text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {standings.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.kontingen_id}
                    </td>
                    <td className="p-4 text-center font-bold text-yellow-600 dark:text-yellow-500">
                      {item.gold}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-400 dark:text-slate-300">
                      {item.silver}
                    </td>
                    <td className="p-4 text-center font-bold text-amber-700 dark:text-amber-600">
                      {item.bronze}
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {item.gold + item.silver + item.bronze}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Medali Kontingen"
        onSubmit={handleAdd}
        submitting={submitting}
        submitText="Update"
      >
        <TextInput
          label="Kontingen ID (UUID)"
          required
          value={formData.kontingen_id}
          onChange={(e: any) => setFormData({...formData, kontingen_id: e.target.value})}
        />
        <div className="grid grid-cols-3 gap-4">
          <TextInput
            label="Emas"
            type="number"
            required
            value={formData.gold}
            onChange={(e: any) => setFormData({...formData, gold: parseInt(e.target.value) || 0})}
          />
          <TextInput
            label="Perak"
            type="number"
            required
            value={formData.silver}
            onChange={(e: any) => setFormData({...formData, silver: parseInt(e.target.value) || 0})}
          />
          <TextInput
            label="Perunggu"
            type="number"
            required
            value={formData.bronze}
            onChange={(e: any) => setFormData({...formData, bronze: parseInt(e.target.value) || 0})}
          />
        </div>
      </ModalForm>
    </div>
  );
}
