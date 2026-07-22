import { useCallback, useState, useEffect } from 'react';
import { Plus, Trash, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { TextInput, SelectInput, TextArea, MediaInput } from '../components/common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import { requestSoftDeleteReason } from '../lib/soft-delete';
import MediaSelectorModal from '../components/media/MediaSelectorModal';

interface CityGuideRecord {
  id: string;
  title: string;
  category: string;
  description: string | null;
  address: string | null;
  image_url: string | null;
}

export default function CityGuide() {
  const [guides, setGuides] = useState<CityGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'Wisata', description: '', address: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  const getAuthConfig = () => authConfig(auth.user?.access_token);

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<CityGuideRecord[] | { data: CityGuideRecord[] }>('/master-data/city-guides', authConfig(auth.user?.access_token));
      setGuides(unwrapApiData(res.data) || []);
    } catch (error) {
      console.error('Failed to fetch city guides:', error);
    } finally {
      setLoading(false);
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    void fetchGuides();
  }, [fetchGuides]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.post('/master-data/city-guides', formData, getAuthConfig());
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
    const reason = requestSoftDeleteReason('City Guide ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/master-data/city-guides/${id}`, { ...getAuthConfig(), data: { reason } });
      fetchGuides();
    } catch (error) {
      console.error('Failed to delete city guide:', error);
      alert(getApiErrorMessage(error, 'Gagal mengarsipkan data.'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">City Guide Kota Depok</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola panduan wisata, kuliner, dan lokasi penting di Depok.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Panduan
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : guides.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
              <p>Belum ada data City Guide.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Judul</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Alamat</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {guides.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {item.address || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Arsipkan ${item.title}`}
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

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah City Guide"
        onSubmit={handleCreate}
        submitting={submitting}
        submitText="Simpan Data"
      >
        <TextInput
          label="Judul"
          required
          value={formData.title}
          onChange={(e: any) => setFormData({...formData, title: e.target.value})}
        />
        <SelectInput
          label="Kategori"
          value={formData.category}
          onChange={(e: any) => setFormData({...formData, category: e.target.value})}
          options={[
            { value: 'Coffee Shop', label: 'Coffee Shop' },
            { value: 'Wisata Kuliner', label: 'Wisata Kuliner' },
            { value: 'Tempat Menginap', label: 'Tempat Menginap' },
            { value: 'Wisata Buatan', label: 'Wisata Buatan' },
            { value: 'Wisata Situ', label: 'Wisata Situ' },
            { value: 'Pusat Perbelanjaan', label: 'Pusat Perbelanjaan' },
            { value: 'Rumah Sakit', label: 'Rumah Sakit' }
          ]}
        />
        <TextArea
          label="Alamat"
          rows={2}
          value={formData.address}
          onChange={(e: any) => setFormData({...formData, address: e.target.value})}
        />
        <MediaInput
          label="Gambar City Guide"
          value={formData.image_url}
          onClear={() => setFormData({...formData, image_url: ''})}
          onSelect={() => setIsMediaSelectorOpen(true)}
        />
      </ModalForm>
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, image_url: url });
          setIsMediaSelectorOpen(false);
        }}
      />
    </div>
  );
}
