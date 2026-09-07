import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Edit, Trash, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput, TextArea } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, unwrapApiData } from '../../lib/api';
import type { Cabor, Venue } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';
// INFO: Import table controls
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';

type VenueSortKey = 'name' | 'address' | 'capacity';

export default function VenueDepok() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '', image_url: '', address: '',
    latitude: -6.4025, longitude: 106.7942, map_route_url: '',
    capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '',
    cabor_ids: [] as string[], city_guide_ids: [] as string[]
  });

  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const auth = useAuth();

  // Multi-select Dropdown State
  const [isCaborDropdownOpen, setIsCaborDropdownOpen] = useState(false);
  const [caborSearch, setCaborSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // INFO: Initialize table controls
  const table = useTableControls<VenueSortKey>({ sortKey: 'name', sortDirection: 'asc', rowsPerPage: 10 });
  const { resetPage } = table;

  // CHANGE: Reset page when search changes
  useEffect(() => {
    resetPage();
  }, [search, resetPage]);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCaborDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Venue[] | { data: Venue[] }>('/venues', authConfig(auth.user?.access_token));
      setVenues(unwrapApiData(res.data) || []);
      setListError('');
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      setListError(getApiErrorMessage(error, 'Gagal memuat data venue.'));
    } finally {
      setLoading(false);
    }
  }, [auth.user?.access_token]);

  const fetchCabors = useCallback(async () => {
    try {
      const res = await apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', authConfig(auth.user?.access_token));
      setCabors(unwrapApiData(res.data) || []);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
      setListError(getApiErrorMessage(error, 'Gagal memuat referensi cabang olahraga.'));
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    void fetchVenues();
    void fetchCabors();
  }, [fetchCabors, fetchVenues]);

  const toggleCaborSelection = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.cabor_ids.includes(id);
      if (isSelected) {
        return { ...prev, cabor_ids: prev.cabor_ids.filter(c => c !== id) };
      } else {
        return { ...prev, cabor_ids: [...prev.cabor_ids, id] };
      }
    });
  };

  const removeCabor = (id: string) => {
    setFormData(prev => ({ ...prev, cabor_ids: prev.cabor_ids.filter(c => c !== id) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      setOperationMessage('');
      const payload = {
        name: formData.name.trim(),
        image_url: normalizeStoredMediaUrl(formData.image_url),
        address: formData.address.trim(),
        map_route_url: formData.map_route_url.trim(),
        facilities: formData.facilities.trim(),
        readiness_status: formData.readiness_status,
        contact_person: formData.contact_person.trim(),
        cabor_ids: formData.cabor_ids,
        city_guide_ids: formData.city_guide_ids,
        capacity: parseInt(formData.capacity.toString(), 10) || 0,
        latitude: parseFloat(formData.latitude.toString()) || 0,
        longitude: parseFloat(formData.longitude.toString()) || 0,
      };
      if (formData.id) {
        await apiClient.put(`/venues/${formData.id}`, payload, authConfig(auth.user?.access_token));
      } else {
        await apiClient.post('/venues', payload, authConfig(auth.user?.access_token));
      }
      setIsModalOpen(false);
      resetForm();
      await fetchVenues();
      setOperationMessage(formData.id ? 'Venue berhasil diperbarui.' : 'Venue berhasil ditambahkan.');
    } catch (error) {
      console.error('Failed to create venue:', error);
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan data venue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (ids: string[]) => {
    const reason = requestSoftDeleteReason(ids.length > 1 ? `${ids.length} venue ini` : 'Venue ini');
    if (reason === null) return;
    try {
      setArchiving(true);
      setListError('');
      setOperationMessage('');
      for (const id of ids) {
        await apiClient.delete(`/venues/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
      }
      setSelectedIds(new Set());
      await fetchVenues();
      setOperationMessage(`${ids.length} venue berhasil diarsipkan.`);
    } catch (error) {
      console.error('Failed to delete venue:', error);
      setListError(getApiErrorMessage(error, 'Gagal mengarsipkan data venue.'));
    } finally {
      setArchiving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '', image_url: '', address: '',
      latitude: -6.4025, longitude: 106.7942, map_route_url: '',
      capacity: 0, facilities: '', readiness_status: 'Persiapan', contact_person: '',
      cabor_ids: [], city_guide_ids: []
    });
    setCaborSearch('');
    setIsCaborDropdownOpen(false);
  };

  const filteredCabors = cabors.filter(c => c.name.toLowerCase().includes(caborSearch.toLowerCase()));
  
  // PERFORMANCE: Use useMemo for sorting and filtering
  const filteredVenues = useMemo(() => {
    return venues.filter((item) =>
      `${item.name} ${item.address ?? ''}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [venues, search]);

  const sortedVenues = useMemo(() => {
    return [...filteredVenues].sort((a, b) => {
      let valA = a[table.sortKey as keyof Venue] ?? '';
      let valB = b[table.sortKey as keyof Venue] ?? '';
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return table.sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return table.sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredVenues, table.sortKey, table.sortDirection]);

  // INFO: Use usePagination hook
  const { paginatedData, totalItems, totalPages, startItem, endItem } = usePagination(
    sortedVenues,
    table.currentPage,
    table.rowsPerPage
  );

  const columns = useMemo<Array<AdminDataTableColumn<Venue, VenueSortKey>>>(() => [
    {
      key: 'name',
      label: 'Nama Venue',
      sortKey: 'name',
      render: (item) => <span className="font-black text-slate-950 dark:text-white">{item.name}</span>,
    },
    {
      key: 'address',
      label: 'Alamat Lengkap',
      sortKey: 'address',
      className: 'max-w-96',
      render: (item) => <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{item.address || '-'}</span>,
    },
    {
      key: 'capacity',
      label: 'Kapasitas',
      sortKey: 'capacity',
      render: (item) => <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Number(item.capacity || 0).toLocaleString('id-ID')} penonton</span>,
    },
    {
      key: 'readiness',
      label: 'Kesiapan',
      render: (item) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${item.readiness_status === 'Siap' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200' : item.readiness_status === 'Sedang Digunakan' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'}`}>{item.readiness_status || 'Persiapan'}</span>,
    },
  ], []);

  const editVenue = (item: Venue) => {
    setFormData({
      id: item.id,
      name: item.name,
      image_url: normalizeStoredMediaUrl(item.image_url),
      address: item.address ?? '',
      latitude: Number(item.latitude ?? -6.4025),
      longitude: Number(item.longitude ?? 106.7942),
      map_route_url: item.map_route_url ?? '',
      capacity: item.capacity ?? 0,
      facilities: item.facilities ?? '',
      readiness_status: item.readiness_status ?? 'Persiapan',
      contact_person: item.contact_person ?? '',
      cabor_ids: item.cabor_ids ?? [],
      city_guide_ids: item.city_guide_ids ?? [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Lokasi pertandingan"
        title="Venue Depok"
        description="Kelola lokasi, kapasitas, kesiapan, cabang olahraga, dan informasi operasional Venue."
        actions={<button type="button" onClick={() => { resetForm(); setFormError(''); setIsModalOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" />Tambah venue</button>}
      />

      {operationMessage && <AdminAlert tone="success">{operationMessage}</AdminAlert>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari venue</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" maxLength={80} placeholder="Cari nama atau alamat venue" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </label>
          <RowsPerPageSelector rowsPerPage={table.rowsPerPage} onChange={table.handleChangeRowsPerPage} />
        </div>

        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => void handleArchive([...selectedIds])} deleting={archiving} itemLabel="venue" />

        <AdminDataTable<Venue, VenueSortKey>
          caption="Daftar Venue PORPROV Kota Depok"
          rows={paginatedData}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => item.name}
          selectionLabel="venue"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          loading={loading}
          loadingLabel="Memuat venue..."
          error={listError}
          onRetry={fetchVenues}
          emptyTitle={search ? 'Venue tidak ditemukan' : 'Belum ada venue'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan Venue sebelum menyusun Jadwal Pertandingan.'}
          minWidthClassName="min-w-[760px]"
          rowActions={(item) => <><button type="button" onClick={() => editVenue(item)} aria-label={`Edit ${item.name}`} title="Edit venue" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"><Edit className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => void handleArchive([item.id])} disabled={archiving} aria-label={`Arsipkan ${item.name}`} title="Arsipkan venue" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"><Trash className="size-4" aria-hidden="true" /></button></>}
        />

        {!loading && !listError && totalItems > 0 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.handleChangePage}
            itemLabel="venue"
          />
        )}
      </div>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); setFormError(''); }}
        title={formData.id ? 'Edit Venue Pertandingan' : 'Tambah Venue Pertandingan'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText={formData.id ? 'Simpan perubahan' : 'Simpan venue'}
        size="large"
      >
        {formError && <AdminAlert>{formError}</AdminAlert>}
        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">1. Informasi dasar</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <TextInput
                label="Nama Venue"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Misal: GOR Kartika Kostrad"
              />
            </div>
            <div>
              <SelectInput
                label="Status Kesiapan"
                value={formData.readiness_status}
                onChange={(e) => setFormData({...formData, readiness_status: e.target.value})}
                options={[
                  { value: 'Persiapan', label: 'Persiapan' },
                  { value: 'Siap', label: 'Siap' },
                  { value: 'Sedang Digunakan', label: 'Sedang Digunakan' }
                ]}
              />
            </div>
            <div>
              <TextInput
                label="Kapasitas (Penonton)"
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">2. Cabang olahraga</legend>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Cabor yang Dipertandingkan</label>

            {/* Selected Badges */}
            <div
              className="flex min-h-11 w-full cursor-text flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              onClick={() => setIsCaborDropdownOpen(true)}
            >
              {formData.cabor_ids.map(id => {
                const cabor = cabors.find(c => c.id === id);
                return cabor ? (
                  <span key={id} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    {cabor.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeCabor(id); }} className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}

              <div className="flex-1 min-w-[150px] flex items-center">
                <input
                  type="text"
                  value={caborSearch}
                  onChange={(e) => { setCaborSearch(e.target.value); setIsCaborDropdownOpen(true); }}
                  onFocus={() => setIsCaborDropdownOpen(true)}
                  className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white px-2 placeholder:text-slate-400"
                  placeholder={formData.cabor_ids.length === 0 ? "Ketik untuk mencari Cabor..." : ""}
                />
                <ChevronDown className="w-4 h-4 text-slate-400 mr-2" />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isCaborDropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {filteredCabors.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center">Cabor tidak ditemukan</div>
                ) : (
                  <ul className="py-1">
                    {filteredCabors.map(cabor => {
                      const isSelected = formData.cabor_ids.includes(cabor.id);
                      return (
                        <li
                          key={cabor.id}
                          onClick={() => toggleCaborSelection(cabor.id)}
                          className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-3"
                        >
                      <div className={`flex size-5 items-center justify-center rounded border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{cabor.name}</p>
                            <p className="text-xs text-slate-500">{cabor.kategori || 'Tidak ada kategori'}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">3. Lokasi dan navigasi</legend>
          <div>
            <TextArea
              label="Alamat Lengkap"
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="Latitude (Koordinat Peta)"
                type="number"
                step="any"
                min={-90}
                max={90}
                required
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                placeholder="-6.4025"
              />
            </div>
            <div>
              <TextInput
                label="Longitude (Koordinat Peta)"
                type="number"
                step="any"
                min={-180}
                max={180}
                required
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                placeholder="106.7942"
              />
            </div>
            <div className="md:col-span-2">
              <TextInput
                label="URL Google Maps (Rute)"
                type="url"
                maxLength={2048}
                value={formData.map_route_url}
                onChange={(e) => setFormData({...formData, map_route_url: e.target.value})}
                placeholder="https://goo.gl/maps/..."
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">4. Media dan informasi operasional</legend>
          <div>
            <MediaInput
              label="Gambar/Foto Venue"
              value={formData.image_url}
              onClear={() => setFormData({...formData, image_url: ''})}
              onSelect={() => setIsMediaSelectorOpen(true)}
              placeholderText="Pilih Foto dari Media Library"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                placeholder="Nama / No HP"
              />
            </div>
            <div>
              <TextInput
                label="Fasilitas Utama"
                value={formData.facilities}
                onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                placeholder="Toilet, Parkir, Ruang Medis"
              />
            </div>
          </div>
        </fieldset>
      </ModalForm>

      {/* Media Selector */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={(url) => { setFormData({...formData, image_url: url}); setIsMediaSelectorOpen(false); }}
      />
    </div>
  );
}
