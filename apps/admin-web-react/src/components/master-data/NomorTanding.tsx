import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import type { Cabor, NomorTanding as NomorTandingRecord } from '../../types/master-data';
import ModalForm from '../common/ModalForm';
import SearchableSelect from '../common/SearchableSelect';
import type { SelectOption } from '../common/SearchableSelect';
import { SelectInput, TextInput } from '../common/FormInputs';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

const emptyForm = {
  id: '',
  cabor_id: '',
  name: '',
  gender_category: 'putra',
  match_type: 'tanding',
};

export default function NomorTanding() {
  const auth = useAuth();
  const [items, setItems] = useState<NomorTandingRecord[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const requestConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsResponse, caborsResponse] = await Promise.all([
        apiClient.get<NomorTandingRecord[] | { data: NomorTandingRecord[] }>('/master-data/nomor-tandings', requestConfig()),
        apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', requestConfig()),
      ]);
      setItems(unwrapApiData(itemsResponse.data) || []);
      setCabors(unwrapApiData(caborsResponse.data) || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat nomor pertandingan.'));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const caborById = useMemo(() => new Map(cabors.map((item) => [item.id, item.name])), [cabors]);
  const caborOptions: SelectOption[] = cabors.map((item) => ({ value: item.id, label: item.name, subLabel: item.kategori || undefined }));
  const filteredItems = items.filter((item) =>
    `${item.name} ${caborById.get(item.cabor_id) ?? ''} ${item.gender_category} ${item.match_type}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const resetForm = () => setFormData(emptyForm);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.cabor_id) {
      setErrorMessage('Cabang olahraga wajib dipilih.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cabor_id: formData.cabor_id,
        name: formData.name.trim(),
        gender_category: formData.gender_category,
        match_type: formData.match_type,
      };
      if (formData.id) {
        await apiClient.put(`/master-data/nomor-tandings/${formData.id}`, payload, requestConfig());
      } else {
        await apiClient.post('/master-data/nomor-tandings', payload, requestConfig());
      }
      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan nomor pertandingan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: NomorTandingRecord) => {
    const reason = requestSoftDeleteReason(`Nomor pertandingan ${item.name}`);
    if (reason === null) return;
    try {
      await apiClient.delete(`/master-data/nomor-tandings/${item.id}`, { ...requestConfig(), data: { reason } });
      await fetchData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan nomor pertandingan.'));
    }
  };

  const editItem = (item: NomorTandingRecord) => {
    setFormData({
      id: item.id,
      cabor_id: item.cabor_id,
      name: item.name,
      gender_category: item.gender_category,
      match_type: item.match_type,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nomor Pertandingan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola nomor yang dipakai saat menyusun jadwal pertandingan.</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex min-h-11 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" /> Tambah Nomor
        </button>
      </div>

      <div className="card">
        <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="form-input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor atau cabang olahraga..." />
          </div>
        </div>
        {errorMessage && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
        <div className="min-h-64 overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-slate-500">Belum ada nomor pertandingan.</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="p-4 text-sm font-semibold">Cabang Olahraga</th><th className="p-4 text-sm font-semibold">Nomor</th>
                <th className="p-4 text-sm font-semibold">Kategori</th><th className="p-4 text-sm font-semibold">Tipe</th>
                <th className="p-4 text-right text-sm font-semibold">Aksi</th>
              </tr></thead>
              <tbody>{filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="p-4 font-medium">{caborById.get(item.cabor_id) ?? item.cabor_id}</td>
                  <td className="p-4">{item.name}</td><td className="p-4 capitalize">{item.gender_category}</td><td className="p-4 capitalize">{item.match_type}</td>
                  <td className="p-4"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`} className="p-2 text-slate-400 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void handleDelete(item)} aria-label={`Arsipkan ${item.name}`} className="p-2 text-slate-400 hover:text-red-600"><Trash className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={formData.id ? 'Edit Nomor Pertandingan' : 'Tambah Nomor Pertandingan'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText="Simpan Nomor"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cabang Olahraga <span className="text-red-500">*</span></label>
          <SearchableSelect options={caborOptions} value={formData.cabor_id} onChange={(value) => setFormData({ ...formData, cabor_id: value })} placeholder="Pilih cabang olahraga..." />
        </div>
        <TextInput label="Nama Nomor" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Contoh: Tunggal Putra" />
        <SelectInput label="Kategori Gender" required value={formData.gender_category} onChange={(event) => setFormData({ ...formData, gender_category: event.target.value })} options={[
          { value: 'putra', label: 'Putra' }, { value: 'putri', label: 'Putri' }, { value: 'campuran', label: 'Campuran' }, { value: 'terbuka', label: 'Terbuka' },
        ]} />
        <SelectInput label="Tipe Pertandingan" required value={formData.match_type} onChange={(event) => setFormData({ ...formData, match_type: event.target.value })} options={[
          { value: 'tanding', label: 'Tanding' }, { value: 'seni', label: 'Seni' }, { value: 'terukur', label: 'Terukur' }, { value: 'beregu', label: 'Beregu' },
        ]} />
      </ModalForm>
    </div>
  );
}
