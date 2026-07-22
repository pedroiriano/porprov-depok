import { useCallback, useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput, TextArea } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, unwrapApiData } from '../../lib/api';
import type { Cabor } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../common/TableControls';
import { useTableControls, usePagination } from '../../hooks/useTableControls';

type SortKeyType = 'name' | 'kategori' | 'total_medali' | 'technical_delegate' | 'status';

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

  const table = useTableControls<SortKeyType>({ sortKey: 'name', sortDirection: 'asc', rowsPerPage: 10 });

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

  const fetchCabors = useCallback(async () => {
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
  }, [auth.user?.access_token]);

  useEffect(() => {
    void fetchCabors();
  }, [fetchCabors]);

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

  // INFO: Filters data based on search input
  const filteredCabors = useMemo(() => {
    return cabors.filter((item) =>
      [item.name, item.kategori, item.technical_delegate]
        .some((value) => value?.toLowerCase().includes(search.toLowerCase())),
    );
  }, [cabors, search]);

  // INFO: Reset page to 1 when search changes
  useEffect(() => {
    table.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // INFO: Sorts the filtered data
  const sortedCabors = useMemo(() => {
    if (!table.sortKey) return filteredCabors;
    return [...filteredCabors].sort((a, b) => {
      const aVal = a[table.sortKey as keyof Cabor];
      const bVal = b[table.sortKey as keyof Cabor];
      if (aVal === bVal) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return table.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aString = String(aVal || '').toLowerCase();
      const bString = String(bVal || '').toLowerCase();
      if (table.sortDirection === 'asc') return aString > bString ? 1 : -1;
      return aString < bString ? 1 : -1;
    });
  }, [filteredCabors, table.sortKey, table.sortDirection]);

  // INFO: Pagination hook
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedCabors,
    table.currentPage,
    table.rowsPerPage
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Master Data: Cabang Olahraga</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola data seluruh cabang olahraga PORPROV.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Cabor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama cabor, kategori, TD..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.handleRowsPerPageChange}
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[300px]">
          {errorMessage && (
            <div role="alert" className="m-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</div>
          )}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
              <p>Belum ada data Cabang Olahraga.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <SortableHeader
                    field="name"
                    label="Nama Cabor"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="kategori"
                    label="Kategori"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="total_medali"
                    label="Medali"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="technical_delegate"
                    label="Technical Delegate"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <SortableHeader
                    field="status"
                    label="Status"
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.handleSort}
                    className="p-4 font-medium"
                  />
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, i) => (
                  <tr key={item.id || i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {item.kategori || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {item.total_medali || 0}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {item.technical_delegate || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === 'Aktif' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'Eksibisi' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editCabor(item)} aria-label={`Edit ${item.name}`} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Arsipkan ${item.name}`}
                          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
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
