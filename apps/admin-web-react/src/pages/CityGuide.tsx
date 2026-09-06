import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Edit, ExternalLink, Loader2, LocateFixed, MapPinned, Plus, Search, Trash, X } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { MediaInput, SelectInput, TextArea, TextInput } from '../components/common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage } from '../lib/api';
import { requestSoftDeleteReason } from '../lib/soft-delete';
import MediaSelectorModal from '../components/media/MediaSelectorModal';
// INFO: Import table controls
import { useTableControls } from '../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../components/common/TableControls';

interface CityGuideRecord {
  id: string;
  title: string;
  category: string;
  description: string | null;
  address: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  map_route_url: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  service_types: string[];
  service_area: string | null;
  operating_hours: string | null;
  price_range: string | null;
  fleet_types: string[];
  fleet_count: number | null;
}

interface CityGuideListResponse {
  data: CityGuideRecord[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

interface CityGuideFormState {
  id: string;
  title: string;
  category: string;
  description: string;
  address: string;
  image_url: string;
  latitude: string;
  longitude: string;
  map_route_url: string;
  contact_phone: string;
  whatsapp: string;
  email: string;
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  service_types: string;
  service_area: string;
  operating_hours: string;
  price_range: string;
  fleet_types: string;
  fleet_count: string;
}

const createEmptyForm = (): CityGuideFormState => ({
  id: '',
  title: '',
  category: 'Coffee Shop',
  description: '',
  address: '',
  image_url: '',
  latitude: '',
  longitude: '',
  map_route_url: '',
  contact_phone: '',
  whatsapp: '',
  email: '',
  website_url: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  service_types: '',
  service_area: '',
  operating_hours: '',
  price_range: '',
  fleet_types: '',
  fleet_count: '',
});

const categories = [
  'Coffee Shop',
  'Catering',
  'Info Travel',
  'Wisata Kuliner',
  'Tempat Menginap',
  'Wisata Buatan',
  'Wisata Situ',
  'Pusat Perbelanjaan',
  'Rumah Sakit',
  'Lainnya',
];

type CityGuideSortKey = 'title' | 'category' | 'address' | 'map_route_url';

const allowedGoogleMapsHosts = new Set([
  'google.com',
  'google.co.id',
  'goo.gl',
  'maps.app.goo.gl',
  'maps.google.co.id',
  'maps.google.com',
  'www.google.co.id',
  'www.google.com',
]);

const isValidGoogleMapsURL = (value: string) => {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();
    const standardMapsPath = parsed.pathname === '/maps' || parsed.pathname.startsWith('/maps/');
    return parsed.protocol === 'https:'
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && allowedGoogleMapsHosts.has(hostname)
      && ((hostname === 'maps.app.goo.gl' && parsed.pathname.length > 1)
        || hostname === 'maps.google.com'
        || hostname === 'maps.google.co.id'
        || standardMapsPath);
  } catch {
    return false;
  }
};

const googleMapsURL = (latitude: number | string, longitude: number | string, title?: string) => {
  const base = `https://www.google.com/maps?q=${latitude},${longitude}`;
  return title ? `${base}+(${encodeURIComponent(title)})` : base;
};

const cityGuideRouteURL = (item: Pick<CityGuideRecord, 'title' | 'latitude' | 'longitude' | 'map_route_url'>) => {
  const configuredURL = item.map_route_url?.trim();
  if (configuredURL && isValidGoogleMapsURL(configuredURL)) return configuredURL;
  if (item.latitude === null || item.longitude === null) return '';
  return googleMapsURL(item.latitude, item.longitude, item.title);
};

export default function CityGuide() {
  const [guides, setGuides] = useState<CityGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [formData, setFormData] = useState<CityGuideFormState>(createEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const auth = useAuth();

  // INFO: State pencarian dan kategori filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // INFO: Hook controls
  const table = useTableControls<CityGuideSortKey>({ sortKey: 'title', sortDirection: 'asc', rowsPerPage: 10 });
  const { currentPage, resetPage, rowsPerPage, setCurrentPage } = table;

  const getAuthConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(rowsPerPage),
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (categoryFilter) params.set('category', categoryFilter);
      const response = await apiClient.get<CityGuideListResponse>(`/master-data/city-guides?${params.toString()}`, getAuthConfig());
      setGuides(response.data.data || []);
      setTotalItems(response.data.total_items || 0);
      setTotalPages(response.data.total_pages || 0);
      if (response.data.total_pages > 0 && currentPage > response.data.total_pages) {
        setCurrentPage(response.data.total_pages);
      }
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat data City Guide.'));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentPage, getAuthConfig, rowsPerPage, searchQuery, setCurrentPage]);

  useEffect(() => {
    void fetchGuides();
  }, [fetchGuides]);

  // CHANGE: Reset ke halaman 1 saat filter/search/rowsPerPage berubah
  useEffect(() => {
    resetPage();
  }, [searchQuery, categoryFilter, table.rowsPerPage, resetPage]);

  // PERFORMANCE: Halaman difilter server-side; sorting lokal hanya mengurutkan halaman aktif.
  const sortedGuides = useMemo(() => {
    const result = [...guides];
    result.sort((a, b) => {
      let comparison = 0;
      switch (table.sortKey) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'id');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category, 'id');
          break;
        case 'address':
          comparison = (a.address || '').localeCompare(b.address || '', 'id');
          break;
        case 'map_route_url': {
          const sourceA = a.map_route_url?.trim() ? 'URL' : 'Koordinat';
          const sourceB = b.map_route_url?.trim() ? 'URL' : 'Koordinat';
          comparison = sourceA.localeCompare(sourceB, 'id');
          break;
        }
      }
      return table.sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [guides, table.sortKey, table.sortDirection]);

  const startItem = totalItems === 0 ? 0 : (table.currentPage - 1) * table.rowsPerPage + 1;
  const endItem = Math.min(table.currentPage * table.rowsPerPage, totalItems);

  const resetForm = () => setFormData(createEmptyForm());

  const openCreateForm = () => {
    resetForm();
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditForm = (item: CityGuideRecord) => {
    setFormData({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description || '',
      address: item.address || '',
      image_url: item.image_url || '',
      latitude: item.latitude === null ? '' : String(item.latitude),
      longitude: item.longitude === null ? '' : String(item.longitude),
      map_route_url: item.map_route_url || '',
      contact_phone: item.contact_phone || '',
      whatsapp: item.whatsapp || '',
      email: item.email || '',
      website_url: item.website_url || '',
      instagram_url: item.instagram_url || '',
      facebook_url: item.facebook_url || '',
      tiktok_url: item.tiktok_url || '',
      service_types: (item.service_types || []).join(', '),
      service_area: item.service_area || '',
      operating_hours: item.operating_hours || '',
      price_range: item.price_range || '',
      fleet_types: (item.fleet_types || []).join(', '),
      fleet_count: item.fleet_count === null ? '' : String(item.fleet_count),
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      setErrorMessage('Latitude dan longitude wajib diisi berpasangan.');
      return;
    }
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setErrorMessage('Latitude harus berupa angka antara -90 sampai 90.');
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setErrorMessage('Longitude harus berupa angka antara -180 sampai 180.');
      return;
    }
    if (formData.map_route_url.trim().length > 2048 || !isValidGoogleMapsURL(formData.map_route_url)) {
      setErrorMessage('URL Google Maps harus berupa tautan HTTPS resmi Google Maps dengan panjang maksimal 2048 karakter.');
      return;
    }
    if ((formData.category === 'Catering' || formData.category === 'Info Travel') && !formData.address.trim()) {
      setErrorMessage('Alamat wajib diisi untuk usaha Catering dan Info Travel.');
      return;
    }
    const hasOfficialContact = [formData.contact_phone, formData.whatsapp, formData.email, formData.website_url, formData.instagram_url, formData.facebook_url, formData.tiktok_url]
      .some((value) => value.trim().length > 0);
    if ((formData.category === 'Catering' || formData.category === 'Info Travel') && !hasOfficialContact) {
      setErrorMessage('Isi minimal satu kontak resmi: telepon, WhatsApp, email, website, atau media sosial.');
      return;
    }
    const fleetTypes = formData.fleet_types.split(',').map((value) => value.trim()).filter(Boolean);
    const fleetCount = formData.fleet_count.trim() ? Number(formData.fleet_count) : null;
    if (formData.category === 'Info Travel' && fleetTypes.length === 0) {
      setErrorMessage('Jenis armada wajib diisi untuk kategori Info Travel. Pisahkan beberapa jenis dengan koma.');
      return;
    }
    if (formData.category === 'Info Travel' && (!Number.isInteger(fleetCount) || Number(fleetCount) < 1)) {
      setErrorMessage('Jumlah armada untuk kategori Info Travel harus berupa bilangan bulat minimal 1.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        address: formData.address.trim(),
        image_url: formData.image_url,
        latitude,
        longitude,
        map_route_url: formData.map_route_url.trim(),
        contact_phone: formData.contact_phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        email: formData.email.trim(),
        website_url: formData.website_url.trim(),
        instagram_url: formData.instagram_url.trim(),
        facebook_url: formData.facebook_url.trim(),
        tiktok_url: formData.tiktok_url.trim(),
        service_types: formData.service_types.split(',').map((value) => value.trim()).filter(Boolean),
        service_area: formData.service_area.trim(),
        operating_hours: formData.operating_hours.trim(),
        price_range: formData.price_range.trim(),
        fleet_types: formData.category === 'Info Travel' ? fleetTypes : [],
        fleet_count: formData.category === 'Info Travel' ? fleetCount : null,
      };
      if (formData.id) {
        await apiClient.put(`/master-data/city-guides/${formData.id}`, payload, getAuthConfig());
      } else {
        await apiClient.post('/master-data/city-guides', payload, getAuthConfig());
      }
      setIsModalOpen(false);
      resetForm();
      await fetchGuides();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan data City Guide.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = requestSoftDeleteReason('City Guide ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/master-data/city-guides/${id}`, { ...getAuthConfig(), data: { reason } });
      await fetchGuides();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data City Guide.'));
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Peramban ini tidak mendukung pengambilan lokasi perangkat.');
      return;
    }
    setLocating(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));
        setLocating(false);
      },
      () => {
        setErrorMessage('Lokasi perangkat tidak dapat diakses. Periksa izin lokasi atau isi koordinat secara manual.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  };

  const coordinatePreviewReady = formData.latitude !== '' && formData.longitude !== '';
  const configuredMapURL = formData.map_route_url.trim();
  const formMapPreviewURL = configuredMapURL && isValidGoogleMapsURL(configuredMapURL)
    ? configuredMapURL
    : coordinatePreviewReady
      ? googleMapsURL(formData.latitude, formData.longitude, formData.title.trim() || 'City Guide Kota Depok')
      : '';
  const categoryOptions = formData.category && !categories.includes(formData.category)
    ? [formData.category, ...categories]
    : categories;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">City Guide Kota Depok</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola panduan kota, URL rute Google Maps, dan koordinat fallback yang terverifikasi.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
          <Plus className="h-5 w-5" /> Tambah Panduan
        </button>
      </div>

      {errorMessage && !isModalOpen && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}

      <div className="min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar — pencarian, filter kategori, rows per page */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, alamat, deskripsi..."
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter kategori */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-h-11 appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{cat}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <RowsPerPageSelector
            value={table.rowsPerPage}
            onChange={table.setRowsPerPage}
          />
        </div>

        {/* Active filters badge */}
        {(searchQuery || categoryFilter) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter aktif:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Pencarian: &quot;{searchQuery}&quot;
                <button type="button" onClick={() => setSearchQuery('')} className="rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800" aria-label="Hapus filter pencarian"><X className="h-3 w-3" /></button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Kategori: {categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('')} className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800" aria-label="Hapus filter kategori"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Hapus semua filter
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /><span className="sr-only">Memuat City Guide</span></div>
          ) : sortedGuides.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <MapPinned className="mb-3 h-10 w-10" />
              {guides.length === 0 ? (
                <p>Belum ada data City Guide.</p>
              ) : (
                <>
                  <p className="font-medium">Tidak ada data yang sesuai filter.</p>
                  <p className="mt-1 text-sm">Coba ubah kata kunci pencarian atau filter kategori.</p>
                </>
              )}
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <th className="p-4">
                    <SortableHeader<CityGuideSortKey>
                      label="Judul"
                      columnKey="title"
                      activeSortKey={table.sortKey}
                      sortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  </th>
                  <th className="p-4">
                    <SortableHeader<CityGuideSortKey>
                      label="Kategori"
                      columnKey="category"
                      activeSortKey={table.sortKey}
                      sortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  </th>
                  <th className="p-4">
                    <SortableHeader<CityGuideSortKey>
                      label="Alamat"
                      columnKey="address"
                      activeSortKey={table.sortKey}
                      sortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  </th>
                  <th className="p-4">
                    <SortableHeader<CityGuideSortKey>
                      label="URL Google Maps (Rute)"
                      columnKey="map_route_url"
                      activeSortKey={table.sortKey}
                      sortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  </th>
                  <th className="p-4 font-medium">Kontak / Armada</th>
                  <th className="p-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{sortedGuides.map((item) => {
                const routeURL = cityGuideRouteURL(item);
                const usesConfiguredURL = Boolean(item.map_route_url?.trim() && isValidGoogleMapsURL(item.map_route_url));
                return <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{item.title}</td>
                  <td className="p-4 text-sm">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item.category}</span>
                  </td>
                  <td className="max-w-80 p-4 text-sm text-slate-600 dark:text-slate-300">{item.address || '-'}</td>
                  <td className="p-4">{routeURL ? <div className="flex flex-col items-start gap-1"><a href={routeURL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/50"><MapPinned className="h-4 w-4" /><span>Rute ke {item.title}</span><ExternalLink className="h-3.5 w-3.5" /></a><span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${usesConfiguredURL ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>{usesConfiguredURL ? 'URL tersimpan' : 'Fallback koordinat'}</span></div> : <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Belum ditentukan</span>}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex flex-col gap-1">
                      <span>{item.whatsapp ? `WA ${item.whatsapp}` : item.contact_phone || item.email || '-'}</span>
                      {item.category === 'Info Travel' && <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{item.fleet_count || 0} armada · {(item.fleet_types || []).join(', ') || '-'}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEditForm(item)} aria-label={`Edit ${item.title}`} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950"><Edit className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void handleDelete(item.id)} aria-label={`Arsipkan ${item.title}`} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"><Trash className="h-4 w-4" /></button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && totalItems > 0 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.setCurrentPage}
            totalAll={totalItems}
            itemLabel="panduan"
          />
        )}
      </div>

      <ModalForm isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); setErrorMessage(''); }} title={formData.id ? 'Edit City Guide' : 'Tambah City Guide'} onSubmit={handleSave} submitting={submitting} submitText={formData.id ? 'Simpan Perubahan' : 'Simpan Data'} size="large">
        {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}
        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Identitas usaha atau lokasi</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label={formData.category === 'Catering' || formData.category === 'Info Travel' ? 'Nama Usaha' : 'Judul'} required maxLength={255} value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} />
          <SelectInput label="Kategori" required value={formData.category} onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))} options={categoryOptions.map((category) => ({ value: category, label: category }))} />
        </div>
          <div className="mt-4 grid gap-4">
            <TextArea label="Deskripsi" rows={3} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Ringkasan usaha, layanan utama, keunggulan, atau informasi pengunjung" />
            <TextArea label="Alamat" required rows={2} value={formData.address} onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))} />
          </div>
        </fieldset>

        {(formData.category === 'Catering' || formData.category === 'Info Travel') && (
          <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Kontak resmi</legend>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Isi minimal satu kontak yang dapat digunakan pengunjung. Field Screenshot tidak digunakan; gambar dipilih dari Media Library.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Nomor Telepon" inputMode="tel" maxLength={32} value={formData.contact_phone} onChange={(event) => setFormData((current) => ({ ...current, contact_phone: event.target.value }))} placeholder="Contoh: 021 1234567" />
              <TextInput label="Nomor WhatsApp" inputMode="tel" maxLength={32} value={formData.whatsapp} onChange={(event) => setFormData((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="Contoh: +62 812 3456 7890" />
              <TextInput label="Email" type="email" maxLength={254} value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
              <TextInput label="Website" type="url" maxLength={2048} value={formData.website_url} onChange={(event) => setFormData((current) => ({ ...current, website_url: event.target.value }))} placeholder="https://contoh.id" />
              <TextInput label="Instagram" type="url" maxLength={2048} value={formData.instagram_url} onChange={(event) => setFormData((current) => ({ ...current, instagram_url: event.target.value }))} placeholder="https://www.instagram.com/namausaha" />
              <TextInput label="Facebook" type="url" maxLength={2048} value={formData.facebook_url} onChange={(event) => setFormData((current) => ({ ...current, facebook_url: event.target.value }))} placeholder="https://www.facebook.com/namausaha" />
              <TextInput label="TikTok" type="url" maxLength={2048} value={formData.tiktok_url} onChange={(event) => setFormData((current) => ({ ...current, tiktok_url: event.target.value }))} placeholder="https://www.tiktok.com/@namausaha" />
            </div>
          </fieldset>
        )}

        {(formData.category === 'Catering' || formData.category === 'Info Travel') && (
          <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Informasi layanan</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Jenis Layanan" value={formData.service_types} onChange={(event) => setFormData((current) => ({ ...current, service_types: event.target.value }))} placeholder={formData.category === 'Catering' ? 'Nasi kotak, prasmanan, snack box' : 'Sewa kendaraan, antar-jemput, perjalanan wisata'} />
              <TextInput label="Area Layanan" value={formData.service_area} onChange={(event) => setFormData((current) => ({ ...current, service_area: event.target.value }))} placeholder="Depok dan Jabodetabek" />
              <TextInput label="Jam Operasional" value={formData.operating_hours} onChange={(event) => setFormData((current) => ({ ...current, operating_hours: event.target.value }))} placeholder="Senin–Minggu, 06.00–22.00" />
              <TextInput label="Kisaran Harga" value={formData.price_range} onChange={(event) => setFormData((current) => ({ ...current, price_range: event.target.value }))} placeholder="Contoh: mulai Rp25.000" />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Pisahkan beberapa jenis layanan dengan koma.</p>
          </fieldset>
        )}

        {formData.category === 'Info Travel' && (
          <fieldset className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
            <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Armada Travel / Jasa Transportasi</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Jenis Armada" required value={formData.fleet_types} onChange={(event) => setFormData((current) => ({ ...current, fleet_types: event.target.value }))} placeholder="HiAce, minibus, bus medium" />
              <TextInput label="Jumlah Armada" required type="number" inputMode="numeric" min={1} step={1} value={formData.fleet_count} onChange={(event) => setFormData((current) => ({ ...current, fleet_count: event.target.value }))} placeholder="Contoh: 12" />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Jumlah armada adalah total unit aktif. Pisahkan beberapa jenis armada dengan koma.</p>
          </fieldset>
        )}

        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Lokasi dan rute</legend>
        <div>
          <TextInput label="URL Google Maps (Rute)" type="url" maxLength={2048} value={formData.map_route_url} onChange={(event) => setFormData((current) => ({ ...current, map_route_url: event.target.value }))} placeholder="https://www.google.com/maps/dir/?api=1&destination=..." />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Opsional. Jika kosong, sistem otomatis menggunakan latitude dan longitude di bawah sebagai tujuan peta.</p>
        </div>

        <div className="mt-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-slate-500 dark:text-slate-400">Gunakan koordinat desimal agar lokasi dapat dibuka tepat di aplikasi peta.</p><button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-300 px-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"><LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />{locating ? 'Mengambil lokasi...' : 'Gunakan Lokasi Saat Ini'}</button></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput label="Latitude" type="number" inputMode="decimal" step="any" min={-90} max={90} required value={formData.latitude} onChange={(event) => setFormData((current) => ({ ...current, latitude: event.target.value }))} placeholder="Contoh: -6.402484" />
            <TextInput label="Longitude" type="number" inputMode="decimal" step="any" min={-180} max={180} required value={formData.longitude} onChange={(event) => setFormData((current) => ({ ...current, longitude: event.target.value }))} placeholder="Contoh: 106.742061" />
          </div>
          {formMapPreviewURL && <a href={formMapPreviewURL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-50 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-950"><MapPinned className="h-4 w-4" />{configuredMapURL ? 'Pratinjau URL Google Maps' : 'Pratinjau rute dari koordinat'}<ExternalLink className="h-3.5 w-3.5" /></a>}
        </div>
        </fieldset>

        <MediaInput label="Gambar City Guide dari Media Library" value={formData.image_url} onClear={() => setFormData((current) => ({ ...current, image_url: '' }))} onSelect={() => setIsMediaSelectorOpen(true)} />
      </ModalForm>

      <MediaSelectorModal isOpen={isMediaSelectorOpen} onClose={() => setIsMediaSelectorOpen(false)} onSelect={(url) => { setFormData((current) => ({ ...current, image_url: url })); setIsMediaSelectorOpen(false); }} />
    </div>
  );
}
