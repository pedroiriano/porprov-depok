import { useCallback, useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash, Loader2, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import MediaSelectorModal from '../media/MediaSelectorModal';
import ModalForm from '../common/ModalForm';
import { TextInput, SelectInput, MediaInput, TextArea } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, normalizeStoredMediaUrl, unwrapApiData } from '../../lib/api';
import type { Cabor, Venue } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

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
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const auth = useAuth();

  // Multi-select Dropdown State
  const [isCaborDropdownOpen, setIsCaborDropdownOpen] = useState(false);
  const [caborSearch, setCaborSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat data venue.'));
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
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat referensi cabang olahraga.'));
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
    } catch (error) {
      console.error('Failed to create venue:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan data venue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = requestSoftDeleteReason('Venue ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/venues/${id}`, { ...authConfig(auth.user?.access_token), data: { reason } });
      await fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data venue.'));
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
  const filteredVenues = venues.filter((item) =>
    `${item.name} ${item.address ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

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
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Master Data: Venue Depok</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data seluruh lokasi pertandingan di Kota Depok.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Venue
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-md">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama venue..."
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
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Venue.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">ID (UUID)</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nama Venue</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Alamat Lengkap</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Kapasitas</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-text-muted">
                      {(item.id || '').substring(0, 8)}...
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {item.address}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.capacity}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editVenue(item)} aria-label={`Edit ${item.name}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors">
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
        title={formData.id ? 'Edit Venue Pertandingan' : 'Tambah Venue Pertandingan'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText="Simpan Venue"
      >
        {/* 1. Informasi Dasar */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">1. Informasi Dasar</h4>
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
        </div>

        {/* 2. Cabang Olahraga */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">2. Cabang Olahraga (Cabor)</h4>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Cabor yang Dipertandingkan</label>

            {/* Selected Badges */}
            <div
              className="min-h-[42px] w-full p-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-indigo-500 items-center transition-colors"
              onClick={() => setIsCaborDropdownOpen(true)}
            >
              {formData.cabor_ids.map(id => {
                const cabor = cabors.find(c => c.id === id);
                return cabor ? (
                  <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {cabor.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeCabor(id); }} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5">
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
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
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
        </div>

        {/* 3. Lokasi & Navigasi */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">3. Lokasi & Navigasi</h4>
          <div>
            <TextArea
              label="Alamat Lengkap"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="Latitude (Kordinat Map)"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                placeholder="-6.4025"
              />
            </div>
            <div>
              <TextInput
                label="Longitude (Kordinat Map)"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                placeholder="106.7942"
              />
            </div>
            <div className="md:col-span-2">
              <TextInput
                label="URL Google Maps (Rute)"
                value={formData.map_route_url}
                onChange={(e) => setFormData({...formData, map_route_url: e.target.value})}
                placeholder="https://goo.gl/maps/..."
              />
            </div>
          </div>
        </div>

        {/* 4. Media & Info Lainnya */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">4. Media & Info Lainnya</h4>
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
        </div>
      </ModalForm>


      {/* Media Selector */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelect={(url) => setFormData({...formData, image_url: url})}
      />
    </div>
  );
}
