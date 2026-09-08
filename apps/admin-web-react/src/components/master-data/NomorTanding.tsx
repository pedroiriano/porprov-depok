import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, Trash } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { apiClient, authConfig, getApiErrorMessage, type PaginatedApiResponse, unwrapApiData } from '../../lib/api';
import type { Cabor, NomorTanding as NomorTandingRecord } from '../../types/master-data';
import ModalForm from '../common/ModalForm';
import SearchableSelect from '../common/SearchableSelect';
import type { SelectOption } from '../common/SearchableSelect';
import { SelectInput, TextInput } from '../common/FormInputs';
import { requestSoftDeleteReason } from '../../lib/soft-delete';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
import { useTableControls } from '../../hooks/useTableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';
import RevisionHistory from '../common/RevisionHistory';
import { applyRevisionFields } from '../../lib/revision';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const emptyForm = {
  id: '',
  cabor_id: '',
  name: '',
  gender_category: 'putra',
  match_type: 'tanding',
};

type SortKeyType = 'name' | 'gender_category' | 'match_type';

export default function NomorTanding() {
  const auth = useAuth();
  const [items, setItems] = useState<NomorTandingRecord[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const deferredSearch = useDebouncedValue(search);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const table = useTableControls<SortKeyType>({ sortKey: 'name', sortDirection: 'asc', rowsPerPage: 10 });

  const requestConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [itemsResponse, caborsResponse] = await Promise.all([
        apiClient.get<PaginatedApiResponse<NomorTandingRecord>>('/master-data/nomor-tandings', {
          ...requestConfig(),
          signal,
          params: { page: table.currentPage, per_page: table.rowsPerPage, q: deferredSearch.trim(), sort: table.sortKey || 'name', direction: table.sortDirection },
        }),
        apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', requestConfig()),
      ]);
      setItems(itemsResponse.data.data || []);
      setTotalItems(itemsResponse.data.total || 0);
      setCabors(unwrapApiData(caborsResponse.data) || []);
      setListError('');
    } catch (error) {
      if (signal?.aborted) return;
      setListError(getApiErrorMessage(error, 'Gagal memuat nomor pertandingan.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [deferredSearch, requestConfig, table.currentPage, table.rowsPerPage, table.sortDirection, table.sortKey]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const caborById = useMemo(() => new Map(cabors.map((item) => [item.id, item.name])), [cabors]);
  const caborOptions: SelectOption[] = cabors.map((item) => ({ value: item.id, label: item.name, subLabel: item.kategori || undefined }));
  
  // INFO: Pencarian baru selalu dimulai dari halaman pertama.
  useEffect(() => {
    table.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const totalPages = Math.max(1, Math.ceil(totalItems / table.rowsPerPage));
  const startItem = totalItems === 0 ? 0 : (table.currentPage - 1) * table.rowsPerPage + 1;
  const endItem = Math.min(table.currentPage * table.rowsPerPage, totalItems);

  const resetForm = () => setFormData(emptyForm);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.cabor_id) {
      setFormError('Cabang olahraga wajib dipilih.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      setOperationMessage('');
      const wasEditing = Boolean(formData.id);
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
      setOperationMessage(wasEditing ? 'Nomor pertandingan berhasil diperbarui.' : 'Nomor pertandingan berhasil ditambahkan.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan nomor pertandingan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (ids: string[]) => {
    const reason = requestSoftDeleteReason(ids.length > 1 ? `${ids.length} nomor pertandingan ini` : 'Nomor pertandingan ini');
    if (reason === null) return;
    try {
      setArchiving(true);
      setListError('');
      setOperationMessage('');
      const results = await Promise.allSettled(ids.map((id) => apiClient.delete(`/master-data/nomor-tandings/${id}`, { ...requestConfig(), data: { reason } })));
      const failedIds = ids.filter((_, index) => results[index].status === 'rejected');
      const succeeded = ids.length - failedIds.length;
      setSelectedIds(new Set(failedIds));
      await fetchData();
      if (failedIds.length > 0) {
        setListError(`${succeeded} nomor pertandingan berhasil diarsipkan, tetapi ${failedIds.length} lainnya gagal. Data yang gagal tetap dipilih agar dapat dicoba lagi.`);
      } else {
        setOperationMessage(`${succeeded} nomor pertandingan berhasil diarsipkan dan dapat dipulihkan dari Arsip Terhapus.`);
      }
    } catch (error) {
      setListError(getApiErrorMessage(error, 'Gagal mengarsipkan nomor pertandingan.'));
    } finally {
      setArchiving(false);
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
    setFormError('');
    setIsModalOpen(true);
  };

  const columns = useMemo<Array<AdminDataTableColumn<NomorTandingRecord, SortKeyType>>>(() => [
    { key: 'cabor', label: 'Cabang Olahraga', render: (item) => <span className="font-black text-slate-950 dark:text-white">{caborById.get(item.cabor_id) ?? item.cabor_id}</span> },
    { key: 'name', label: 'Nomor', sortKey: 'name', render: (item) => <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span> },
    { key: 'gender', label: 'Kategori', sortKey: 'gender_category', render: (item) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black capitalize text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{item.gender_category}</span> },
    { key: 'type', label: 'Tipe', sortKey: 'match_type', render: (item) => <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.match_type}</span> },
  ], [caborById]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Struktur pertandingan"
        title="Nomor Pertandingan"
        description="Kelola nomor dan klasifikasi yang menjadi dasar penyusunan jadwal pertandingan."
        actions={<button type="button" onClick={() => { resetForm(); setFormError(''); setIsModalOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" />Tambah nomor</button>}
      />

      {operationMessage && <AdminAlert tone="success">{operationMessage}</AdminAlert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari nomor pertandingan</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              maxLength={80}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Cari nomor, kategori, atau tipe pertandingan..."
            />
          </label>
          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.handleRowsPerPageChange}
          />
        </div>
        
        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => void handleArchive([...selectedIds])} deleting={archiving} itemLabel="nomor" />

        <AdminDataTable<NomorTandingRecord, SortKeyType>
          caption="Daftar nomor pertandingan PORPROV"
          rows={items}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => item.name}
          selectionLabel="nomor"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          loading={loading}
          loadingLabel="Memuat nomor pertandingan..."
          error={listError}
          onRetry={fetchData}
          emptyTitle={search ? 'Nomor pertandingan tidak ditemukan' : 'Belum ada nomor pertandingan'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan nomor pertandingan setelah cabang olahraga tersedia.'}
          rowActions={(item) => <><button type="button" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`} title="Edit nomor" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"><Edit className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => void handleArchive([item.id])} disabled={archiving} aria-label={`Arsipkan ${item.name}`} title="Arsipkan nomor" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"><Trash className="size-4" aria-hidden="true" /></button></>}
        />

        {/* Footer Pagination */}
        {!loading && !listError && totalItems > 0 && (
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
        onClose={() => { setIsModalOpen(false); resetForm(); setFormError(''); }}
        title={formData.id ? 'Edit Nomor Pertandingan' : 'Tambah Nomor Pertandingan'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText={formData.id ? 'Simpan perubahan' : 'Simpan nomor'}
        size="large"
        draft={{ entityId: formData.id || 'new-nomor-tanding', version: 'nomor-tanding-v1', value: formData, onRestore: setFormData }}
      >
        {formError && <AdminAlert>{formError}</AdminAlert>}
        <RevisionHistory entityName="NomorTanding" displayName="Nomor pertandingan" entityId={formData.id} onRestore={(payload) => setFormData((current) => applyRevisionFields(current, payload))} />
        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Klasifikasi nomor pertandingan</legend>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cabang Olahraga <span className="text-red-500">*</span></label>
          <SearchableSelect options={caborOptions} value={formData.cabor_id} onChange={(value) => setFormData({ ...formData, cabor_id: value })} placeholder="Pilih cabang olahraga..." ariaLabel="Cabang Olahraga" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Nama Nomor" required maxLength={160} value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Contoh: Tunggal Putra" />
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
        </div>
        </fieldset>
      </ModalForm>
    </div>
  );
}
