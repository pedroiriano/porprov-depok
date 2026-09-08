import { useCallback, useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash, Image as PhotoIcon } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, resolveMediaUrl, type PaginatedApiResponse } from '../../lib/api';
import type { Kontingen as KontingenRecord } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
import { useTableControls } from '../../hooks/useTableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';
import RevisionHistory from '../common/RevisionHistory';
import { applyRevisionFields } from '../../lib/revision';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuthorization } from '../../contexts/authorization';

type SortKeyType = 'name' | 'region_type';

export default function Kontingen() {
  const [kontingens, setKontingens] = useState<KontingenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const authorization = useAuthorization();
  const canCreate = authorization.hasPermission('master_data.create');
  const canUpdate = authorization.hasPermission('master_data.update');
  const canArchive = authorization.hasPermission('master_data.archive');

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
  const deferredSearch = useDebouncedValue(search);
  const [totalItems, setTotalItems] = useState(0);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const fetchKontingens = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await apiClient.get<PaginatedApiResponse<KontingenRecord>>('/master-data/kontingens', {
        ...authConfig(auth.user?.access_token),
        signal,
        params: { page: table.currentPage, per_page: table.rowsPerPage, q: deferredSearch.trim(), sort: table.sortKey || 'name', direction: table.sortDirection },
      });
      setKontingens(res.data.data || []);
      setTotalItems(res.data.total || 0);
      setListError('');
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Failed to fetch kontingens:', error);
      setListError(getApiErrorMessage(error, 'Gagal memuat data kontingen.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [auth.user?.access_token, deferredSearch, table.currentPage, table.rowsPerPage, table.sortDirection, table.sortKey]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchKontingens(controller.signal);
    return () => controller.abort();
  }, [fetchKontingens]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      setOperationMessage('');
      const wasEditing = isEditing;
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
      setOperationMessage(wasEditing ? 'Kontingen berhasil diperbarui.' : 'Kontingen berhasil ditambahkan.');
    } catch (error) {
      console.error('Failed to save kontingen:', error);
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan data kontingen.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (ids: string[]) => {
    const reason = requestSoftDeleteReason(ids.length > 1 ? `${ids.length} kontingen ini` : 'Kontingen ini');
    if (reason === null) return;
    try {
      setArchiving(true);
      setListError('');
      setOperationMessage('');
      const results = await Promise.allSettled(ids.map((id) => apiClient.delete(`/master-data/kontingens/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } })));
      const failedIds = ids.filter((_, index) => results[index].status === 'rejected');
      const succeeded = ids.length - failedIds.length;
      setSelectedIds(new Set(failedIds));
      await fetchKontingens();
      if (failedIds.length > 0) {
        setListError(`${succeeded} kontingen berhasil diarsipkan, tetapi ${failedIds.length} lainnya gagal. Data yang gagal tetap dipilih agar dapat dicoba lagi.`);
      } else {
        setOperationMessage(`${succeeded} kontingen berhasil diarsipkan dan dapat dipulihkan dari Arsip Terhapus.`);
      }
    } catch (error) {
      console.error('Failed to delete kontingen:', error);
      setListError(getApiErrorMessage(error, 'Gagal mengarsipkan data kontingen.'));
    } finally {
      setArchiving(false);
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
    setFormError('');
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', region_type: 'kota', logo_url: '' });
    setIsEditing(false);
  };

  const openNewForm = () => {
    resetForm();
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSelectMedia = (url: string) => {
    setFormData(prev => ({ ...prev, logo_url: url }));
    setIsMediaSelectorOpen(false);
  };

  // INFO: Pencarian baru selalu dimulai dari halaman pertama.
  useEffect(() => {
    table.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const totalPages = Math.max(1, Math.ceil(totalItems / table.rowsPerPage));
  const startItem = totalItems === 0 ? 0 : (table.currentPage - 1) * table.rowsPerPage + 1;
  const endItem = Math.min(table.currentPage * table.rowsPerPage, totalItems);

  const columns = useMemo<Array<AdminDataTableColumn<KontingenRecord, SortKeyType>>>(() => [
    {
      key: 'logo',
      label: 'Logo',
      headerClassName: 'w-24',
      render: (item) => item.logo_url ? (
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700">
          <img src={resolveMediaUrl(item.logo_url)} alt={`Logo ${item.name}`} className="size-full object-contain" />
        </div>
      ) : (
        <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><PhotoIcon className="size-6" aria-hidden="true" /></div>
      ),
    },
    { key: 'name', label: 'Nama Kontingen', sortKey: 'name', render: (item) => <span className="font-black text-slate-950 dark:text-white">{item.name}</span> },
    { key: 'region', label: 'Tipe Daerah', sortKey: 'region_type', render: (item) => <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black capitalize text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{item.region_type}</span> },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Peserta PORPROV"
        title="Data Kontingen"
        description="Kelola referensi kota dan kabupaten yang menjadi afiliasi peserta pertandingan."
        actions={canCreate ? <button type="button" onClick={openNewForm} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" />Tambah kontingen</button> : undefined}
      />

      {operationMessage && <AdminAlert tone="success">{operationMessage}</AdminAlert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari kontingen</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input 
              type="search"
              maxLength={80}
              placeholder="Cari kontingen..." 
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </label>
          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.handleRowsPerPageChange}
          />
        </div>

        {canArchive && <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => void handleArchive([...selectedIds])} deleting={archiving} itemLabel="kontingen" />}

        <AdminDataTable<KontingenRecord, SortKeyType>
          caption="Daftar kontingen PORPROV"
          rows={kontingens}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => item.name}
          selectionLabel="kontingen"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          selectionEnabled={canArchive}
          loading={loading}
          loadingLabel="Memuat kontingen..."
          error={listError}
          onRetry={fetchKontingens}
          emptyTitle={search ? 'Kontingen tidak ditemukan' : 'Belum ada kontingen'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan kontingen sebelum menyusun peserta pertandingan.'}
          rowActions={(item) => <>{canUpdate && <button type="button" onClick={() => editKontingen(item)} aria-label={`Ubah ${item.name}`} title="Ubah kontingen" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"><Edit className="size-4" aria-hidden="true" /></button>}{canArchive && <button type="button" onClick={() => void handleArchive([item.id])} disabled={archiving} aria-label={`Arsipkan ${item.name}`} title="Arsipkan kontingen" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"><Trash className="size-4" aria-hidden="true" /></button>}</>}
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
        title={isEditing ? 'Edit Kontingen' : 'Tambah Kontingen'}
        onSubmit={handleCreateOrUpdate}
        submitting={submitting}
        submitText={isEditing ? 'Simpan perubahan' : 'Simpan kontingen'}
        size="large"
        draft={{ entityId: formData.id || 'new-kontingen', version: 'kontingen-v1', value: formData, onRestore: setFormData }}
      >
        {formError && <AdminAlert>{formError}</AdminAlert>}
        <RevisionHistory entityName="Kontingen" entityId={formData.id} onRestore={(payload) => setFormData((current) => applyRevisionFields(current, payload))} />
        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Identitas kontingen</legend>
        <div className="grid gap-4 md:grid-cols-2">
        <TextInput 
          label="Nama Kontingen" 
          required 
          maxLength={160}
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
        </div>
        <MediaInput 
          label="Logo Kontingen (Opsional)" 
          value={formData.logo_url} 
          onClear={() => setFormData({...formData, logo_url: ''})} 
          onSelect={() => setIsMediaSelectorOpen(true)} 
          placeholderText="Pilih logo dari Pustaka Media"
        />
        </fieldset>
      </ModalForm>

      {/* Media Selector Modal */}
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
