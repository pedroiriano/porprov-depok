import { useCallback, useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput, TextArea } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, unwrapApiData } from '../../lib/api';
import type { Cabor } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';

type SortKeyType = 'name' | 'kategori' | 'total_medali' | 'technical_delegate' | 'status';

export default function CabangOlahraga() {
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'icon' | 'hero'>('icon');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon_url: '',
    hero_image_url: '',
    kategori: 'Tanding',
    total_medali: 0,
    technical_delegate: '',
    status: 'Aktif'
  });
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
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
      setListError('');
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
      setListError(getApiErrorMessage(error, 'Gagal memuat data cabang olahraga.'));
    } finally {
      setLoading(false);
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    void fetchCabors();
  }, [fetchCabors]);

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', icon_url: '', hero_image_url: '', kategori: 'Tanding', total_medali: 0, technical_delegate: '', status: 'Aktif' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      setOperationMessage('');
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon_url: normalizeStoredMediaUrl(formData.icon_url),
        hero_image_url: normalizeStoredMediaUrl(formData.hero_image_url),
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
      setOperationMessage(formData.id ? 'Cabang olahraga berhasil diperbarui.' : 'Cabang olahraga berhasil ditambahkan.');
    } catch (error) {
      console.error('Failed to create cabor:', error);
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan data cabang olahraga.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (ids: string[]) => {
    const reason = requestSoftDeleteReason(ids.length > 1 ? `${ids.length} cabang olahraga ini` : 'Cabang olahraga ini');
    if (reason === null) return;
    try {
      setArchiving(true);
      setListError('');
      setOperationMessage('');
      for (const id of ids) {
        await apiClient.delete(`/master-data/cabors/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
      }
      setSelectedIds(new Set());
      await fetchCabors();
      setOperationMessage(`${ids.length} cabang olahraga berhasil diarsipkan.`);
    } catch (error) {
      console.error('Failed to delete cabor:', error);
      setListError(getApiErrorMessage(error, 'Gagal mengarsipkan data cabang olahraga.'));
    } finally {
      setArchiving(false);
    }
  };

  const editCabor = (item: Cabor) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      icon_url: normalizeStoredMediaUrl(item.icon_url),
      hero_image_url: normalizeStoredMediaUrl(item.hero_image_url),
      kategori: item.kategori || 'Tanding',
      total_medali: item.total_medali ?? 0,
      technical_delegate: item.technical_delegate ?? '',
      status: item.status || 'Aktif',
    });
    setFormError('');
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

  const columns = useMemo<Array<AdminDataTableColumn<Cabor, SortKeyType>>>(() => [
    {
      key: 'name',
      label: 'Nama Cabor',
      sortKey: 'name',
      render: (item) => <span className="font-black text-slate-950 dark:text-white">{item.name}</span>,
    },
    {
      key: 'kategori',
      label: 'Kategori',
      sortKey: 'kategori',
      render: (item) => <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.kategori || '-'}</span>,
    },
    {
      key: 'total_medali',
      label: 'Medali',
      sortKey: 'total_medali',
      render: (item) => <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.total_medali || 0}</span>,
    },
    {
      key: 'technical_delegate',
      label: 'Technical Delegate',
      sortKey: 'technical_delegate',
      className: 'max-w-72',
      render: (item) => <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{item.technical_delegate || '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (item) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : item.status === 'Eksibisi' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{item.status || 'Aktif'}</span>,
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Referensi pertandingan"
        title="Cabang Olahraga"
        description="Kelola identitas, klasifikasi, delegasi teknis, dan status cabang olahraga PORPROV."
        actions={<button type="button" onClick={() => { resetForm(); setFormError(''); setIsModalOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" />Tambah cabor</button>}
      />

      {operationMessage && <AdminAlert tone="success">{operationMessage}</AdminAlert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari cabang olahraga</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" maxLength={80} placeholder="Cari nama, kategori, atau technical delegate" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <RowsPerPageSelector value={table.rowsPerPage} onChange={table.handleRowsPerPageChange} />
        </div>

        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => void handleArchive([...selectedIds])} deleting={archiving} itemLabel="cabor" />

        <AdminDataTable<Cabor, SortKeyType>
          caption="Daftar cabang olahraga PORPROV"
          rows={paginatedData}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => item.name}
          selectionLabel="cabor"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          loading={loading}
          loadingLabel="Memuat cabang olahraga..."
          error={listError}
          onRetry={fetchCabors}
          emptyTitle={search ? 'Cabang olahraga tidak ditemukan' : 'Belum ada cabang olahraga'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan cabang olahraga pertama sebagai dasar nomor pertandingan.'}
          rowActions={(item) => <><button type="button" onClick={() => editCabor(item)} aria-label={`Edit ${item.name}`} title="Edit cabor" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"><Edit className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => void handleArchive([item.id])} disabled={archiving} aria-label={`Arsipkan ${item.name}`} title="Arsipkan cabor" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"><Trash className="size-4" aria-hidden="true" /></button></>}
        />

        {!loading && !listError && totalItems > 0 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.handlePageChange}
            itemLabel="cabor"
          />
        )}
      </div>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); setFormError(''); }}
        title={formData.id ? 'Edit Cabang Olahraga' : 'Tambah Cabang Olahraga'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText={formData.id ? 'Simpan perubahan' : 'Simpan cabor'}
        size="large"
      >
        {formError && <AdminAlert>{formError}</AdminAlert>}
        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Identitas cabang olahraga</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><TextInput label="Nama Cabor" required maxLength={160} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Misal: Sepak Bola" /></div>
            <SelectInput label="Kategori" required value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} options={[{ value: 'Tanding', label: 'Tanding' }, { value: 'Seni/Terukur', label: 'Seni/Terukur' }, { value: 'E-Sports', label: 'E-Sports' }, { value: 'Eksibisi', label: 'Eksibisi' }]} />
            <SelectInput label="Status" required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'Eksibisi', label: 'Eksibisi' }, { value: 'Non-Aktif', label: 'Non-Aktif' }]} />
            <TextInput label="Total Medali" type="number" min="0" value={formData.total_medali} onChange={(e) => setFormData({...formData, total_medali: parseInt(e.target.value) || 0})} />
            <TextInput label="Technical Delegate" maxLength={160} value={formData.technical_delegate} onChange={(e) => setFormData({...formData, technical_delegate: e.target.value})} placeholder="Nama technical delegate" />
            <div className="md:col-span-2"><TextArea label="Deskripsi/Keterangan" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Keterangan tambahan..." /></div>
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Media publik</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <MediaInput label="Logo Cabor" value={formData.icon_url} onClear={() => setFormData({...formData, icon_url: ''})} onSelect={() => { setMediaTarget('icon'); setIsMediaSelectorOpen(true); }} />
            <MediaInput label="Hero Image Cabor" value={formData.hero_image_url} onClear={() => setFormData({...formData, hero_image_url: ''})} onSelect={() => { setMediaTarget('hero'); setIsMediaSelectorOpen(true); }} previewVariant="landscape" placeholderText="Pilih Hero Image dari Media Library" helpText="Opsional. Rekomendasi rasio 16:9 untuk header detail Cabor." />
          </div>
        </fieldset>
      </ModalForm>
      {/* Media Selector */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={(url) => {
          setFormData((current) => mediaTarget === 'hero'
            ? { ...current, hero_image_url: url }
            : { ...current, icon_url: url });
          setIsMediaSelectorOpen(false);
        }}
      />
    </div>
  );
}
