import { useCallback, useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2, Image as PhotoIcon } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, resolveMediaUrl, unwrapApiData } from '../../lib/api';
import type { Kontingen as KontingenRecord } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

export default function Kontingen() {
  const [kontingens, setKontingens] = useState<KontingenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({ 
    id: '',
    name: '', 
    region_type: 'kota',
    logo_url: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isModalOpen || isMediaSelectorOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isMediaSelectorOpen]);

  const fetchKontingens = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<KontingenRecord[] | { data: KontingenRecord[] }>('/master-data/kontingens', authConfig(auth.user?.access_token));
      setKontingens(unwrapApiData(res.data) || []);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to fetch kontingens:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat data kontingen.'));
    } finally {
      setLoading(false);
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    void fetchKontingens();
  }, [fetchKontingens]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        region_type: formData.region_type,
        logo_url: normalizeStoredMediaUrl(formData.logo_url)
      };

      if (isEditing) {
        await apiClient.put(`/master-data/kontingens/${formData.id}`, payload, authConfig(auth.user?.access_token));
      } else {
        await apiClient.post('/master-data/kontingens', payload, authConfig(auth.user?.access_token));
      }
      setIsModalOpen(false);
      resetForm();
      await fetchKontingens();
    } catch (error) {
      console.error('Failed to save kontingen:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan data kontingen.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = requestSoftDeleteReason('Kontingen ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/master-data/kontingens/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
      await fetchKontingens();
    } catch (error) {
      console.error('Failed to delete kontingen:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data kontingen.'));
    }
  };

  const editKontingen = (item: KontingenRecord) => {
    setFormData({
      id: item.id,
      name: item.name,
      region_type: item.region_type,
      logo_url: normalizeStoredMediaUrl(item.logo_url)
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', region_type: 'kota', logo_url: '' });
    setIsEditing(false);
  };

  const openNewForm = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSelectMedia = (url: string) => {
    setFormData(prev => ({ ...prev, logo_url: url }));
  };

  const filteredKontingens = kontingens.filter((item) =>
    `${item.name} ${item.region_type}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Data Kontingen</h2>
          <p className="text-text-muted text-sm mt-1">Kelola data kontingen / kota kabupaten peserta PORPROV.</p>
        </div>
        <button 
          onClick={openNewForm}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Kontingen
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-md">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kontingen..." 
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {errorMessage && (
            <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredKontingens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Kontingen.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 w-24">Logo</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nama Kontingen</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Tipe Daerah</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredKontingens.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      {item.logo_url ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-1">
                          <img src={resolveMediaUrl(item.logo_url)} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <PhotoIcon className="w-6 h-6" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-sm font-medium text-slate-600 dark:text-slate-400">
                        {item.region_type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => editKontingen(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Arsipkan ${item.name}`}
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
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={isEditing ? 'Edit Kontingen' : 'Tambah Kontingen'}
        onSubmit={handleCreateOrUpdate}
        submitting={submitting}
        submitText="Simpan Kontingen"
      >
        <TextInput 
          label="Nama Kontingen" 
          required 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          placeholder="Contoh: Kota Depok" 
        />
        <SelectInput 
          label="Tipe Daerah" 
          required 
          value={formData.region_type} 
          onChange={(e) => setFormData({...formData, region_type: e.target.value})} 
          options={[
            { value: 'kota', label: 'Kota' },
            { value: 'kabupaten', label: 'Kabupaten' }
          ]} 
        />
        <MediaInput 
          label="Logo Kontingen (Opsional)" 
          value={formData.logo_url} 
          onClear={() => setFormData({...formData, logo_url: ''})} 
          onSelect={() => setIsMediaSelectorOpen(true)} 
          placeholderText="Pilih Logo dari Media Library" 
        />
      </ModalForm>

      {/* Media Selector Modal Rendered within Kontingen but with higher z-index if needed, or we just overlay */}
      {isMediaSelectorOpen && (
        <MediaSelectorModal 
          isOpen={isMediaSelectorOpen}
          onSelect={handleSelectMedia} 
          onClose={() => setIsMediaSelectorOpen(false)} 
        />
      )}
    </div>
  );
}
