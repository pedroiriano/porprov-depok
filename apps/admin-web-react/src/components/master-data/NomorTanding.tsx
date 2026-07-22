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
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../common/TableControls';
import { useTableControls, usePagination } from '../../hooks/useTableControls';

const emptyForm = {
  id: '',
  cabor_id: '',
  name: '',
  gender_category: 'putra',
  match_type: 'tanding',
};

type SortKeyType = 'cabor' | 'name' | 'gender_category' | 'match_type';

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

  const table = useTableControls<SortKeyType>({ sortKey: 'cabor', sortDirection: 'asc', rowsPerPage: 10 });

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
  
  // INFO: Filters data based on search input
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      `${item.name} ${caborById.get(item.cabor_id) ?? ''} ${item.gender_category} ${item.match_type}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search, caborById]);

  // INFO: Reset page to 1 when search changes
  useEffect(() => {
    table.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // INFO: Sorts the filtered data
  const sortedItems = useMemo(() => {
    if (!table.sortKey) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      
      if (table.sortKey === 'cabor') {
        aVal = caborById.get(a.cabor_id) || a.cabor_id;
        bVal = caborById.get(b.cabor_id) || b.cabor_id;
      } else {
        aVal = String(a[table.sortKey as keyof NomorTandingRecord] || '');
        bVal = String(b[table.sortKey as keyof NomorTandingRecord] || '');
      }

      if (aVal === bVal) return 0;
      const aString = aVal.toLowerCase();
      const bString = bVal.toLowerCase();
      
      if (table.sortDirection === 'asc') return aString > bString ? 1 : -1;
      return aString < bString ? 1 : -1;
    });
  }, [filteredItems, table.sortKey, table.sortDirection, caborById]);

  // INFO: Pagination hook
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedItems,
    table.currentPage,
    table.rowsPerPage
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Cari nomor atau cabang olahraga..." 
            />
          </div>
          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.handleRowsPerPageChange}
          />
        </div>
        
        {/* Table Content */}
        <div className="min-h-64 overflow-x-auto">
          {errorMessage && <div role="alert" className="m-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</div>}
          
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : paginatedData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-slate-500 dark:text-slate-400">Belum ada nomor pertandingan.</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <SortableHeader
                    field="cabor"
                    label="Cabang Olahraga"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="name"
                    label="Nomor"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="gender_category"
                    label="Kategori"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="match_type"
                    label="Tipe"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {caborById.get(item.cabor_id) ?? item.cabor_id}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 capitalize">
                      {item.gender_category}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 capitalize">
                      {item.match_type}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => editItem(item)} 
                          aria-label={`Edit ${item.name}`} 
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => void handleDelete(item)} 
                          aria-label={`Arsipkan ${item.name}`} 
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.handlePageChange}
          />
        )}
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
          { value: 'putra', label: 'Putra' }, 
          { value: 'putri', label: 'Putri' }, 
          { value: 'campuran', label: 'Campuran' }, 
          { value: 'terbuka', label: 'Terbuka' },
        ]} />
        <SelectInput label="Tipe Pertandingan" required value={formData.match_type} onChange={(event) => setFormData({ ...formData, match_type: event.target.value })} options={[
          { value: 'tanding', label: 'Tanding' }, 
          { value: 'seni', label: 'Seni' }, 
          { value: 'terukur', label: 'Terukur' }, 
          { value: 'beregu', label: 'Beregu' },
        ]} />
      </ModalForm>
    </div>
  );
}
