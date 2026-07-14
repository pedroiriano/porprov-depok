import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput, TextArea } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, unwrapApiData } from '../../lib/api';
import type { Cabor } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

export default function CabangOlahraga() {
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon_url: '',
    kategori: 'Tanding',
    total_medali: 0,
    technical_delegate: '',
    status: 'Aktif'
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const auth = useAuth();

  useEffect(() => {
    fetchCabors();
  }, []);

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

  const fetchCabors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', authConfig(auth.user?.access_token));
      setCabors(unwrapApiData(res.data) || []);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat data cabang olahraga.'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', icon_url: '', kategori: 'Tanding', total_medali: 0, technical_delegate: '', status: 'Aktif' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon_url: normalizeStoredMediaUrl(formData.icon_url),
        kategori: formData.kategori,
        total_medali: parseInt(formData.total_medali.toString(), 10) || 0,
        technical_delegate: formData.technical_delegate.trim(),
        status: formData.status,
      };
      if (formData.id) {
        await apiClient.put(`/master-data/cabors/${formData.id}`, payload, authConfig(auth.user?.access_token));
      } else {
        await apiClient.post('/master-data/cabors', payload, authConfig(auth.user?.access_token));
      }
      setIsModalOpen(false);
      resetForm();
      await fetchCabors();
    } catch (error) {
      console.error('Failed to create cabor:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan data cabang olahraga.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = requestSoftDeleteReason('Cabang olahraga ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/master-data/cabors/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
      await fetchCabors();
    } catch (error) {
      console.error('Failed to delete cabor:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data cabang olahraga.'));
    }
  };

  const editCabor = (item: Cabor) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      icon_url: normalizeStoredMediaUrl(item.icon_url),
      kategori: item.kategori || 'Tanding',
      total_medali: item.total_medali ?? 0,
      technical_delegate: item.technical_delegate ?? '',
      status: item.status || 'Aktif',
    });
    setIsModalOpen(true);
  };

  const filteredCabors = cabors.filter((item) =>
    [item.name, item.kategori, item.technical_delegate]
      .some((value) => value?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Master Data: Cabang Olahraga</h2>
          <p className="text-text-muted text-sm mt-1">Kelola data seluruh cabang olahraga PORPROV.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {errorMessage && (
            <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filteredCabors.length === 0 ? (
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
                {filteredCabors.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {(item.id || '').substring(0, 8)}...
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.kategori || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.total_medali || 0}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.technical_delegate || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'Aktif' ? 'bg-success-100 text-success-700' :
                        item.status === 'Eksibisi' ? 'bg-warning-100 text-warning-700' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editCabor(item)} aria-label={`Edit ${item.name}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors">
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
        title={formData.id ? 'Edit Cabang Olahraga' : 'Tambah Cabang Olahraga'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText="Simpan Data"
      >
        <TextInput
          label="Nama Cabor"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Misal: Sepak Bola"
        />
        <MediaInput
          label="Logo Cabor"
          value={formData.icon_url}
          onClear={() => setFormData({...formData, icon_url: ''})}
          onSelect={() => setIsMediaSelectorOpen(true)}
        />
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Kategori"
            value={formData.kategori}
            onChange={(e) => setFormData({...formData, kategori: e.target.value})}
            options={[
              { value: 'Tanding', label: 'Tanding' },
              { value: 'Seni/Terukur', label: 'Seni/Terukur' },
              { value: 'E-Sports', label: 'E-Sports' },
              { value: 'Eksibisi', label: 'Eksibisi' }
            ]}
          />
          <SelectInput
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            options={[
              { value: 'Aktif', label: 'Aktif' },
              { value: 'Eksibisi', label: 'Eksibisi' },
              { value: 'Non-Aktif', label: 'Non-Aktif' }
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Total Medali"
            type="number"
            min="0"
            value={formData.total_medali}
            onChange={(e) => setFormData({...formData, total_medali: parseInt(e.target.value) || 0})}
          />
          <TextInput
            label="Technical Delegate"
            value={formData.technical_delegate}
            onChange={(e) => setFormData({...formData, technical_delegate: e.target.value})}
            placeholder="Nama TD"
          />
        </div>
        <TextArea
          label="Deskripsi/Keterangan"
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Keterangan tambahan..."
        />
      </ModalForm>
      {/* Media Selector */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={(url) => setFormData({...formData, icon_url: url})}
      />
    </div>
  );
}
