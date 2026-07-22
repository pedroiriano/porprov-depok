import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Edit, ExternalLink, Loader2, LocateFixed, MapPinned, Plus, Trash } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { MediaInput, SelectInput, TextArea, TextInput } from '../components/common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import { requestSoftDeleteReason } from '../lib/soft-delete';
import MediaSelectorModal from '../components/media/MediaSelectorModal';

interface CityGuideRecord {
  id: string;
  title: string;
  category: string;
  description: string | null;
  address: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
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
});

const categories = [
  'Coffee Shop',
  'Wisata Kuliner',
  'Tempat Menginap',
  'Wisata Buatan',
  'Wisata Situ',
  'Pusat Perbelanjaan',
  'Rumah Sakit',
  'Lainnya',
];

const googleMapsURL = (latitude: number | string, longitude: number | string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

export default function CityGuide() {
  const [guides, setGuides] = useState<CityGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [formData, setFormData] = useState<CityGuideFormState>(createEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const auth = useAuth();

  const getAuthConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<CityGuideRecord[] | { data: CityGuideRecord[] }>('/master-data/city-guides', getAuthConfig());
      setGuides(unwrapApiData(response.data) || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat data City Guide.'));
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  useEffect(() => {
    void fetchGuides();
  }, [fetchGuides]);

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
  const categoryOptions = formData.category && !categories.includes(formData.category)
    ? [formData.category, ...categories]
    : categories;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">City Guide Kota Depok</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola panduan kota beserta titik koordinat peta yang terverifikasi.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
          <Plus className="h-5 w-5" /> Tambah Panduan
        </button>
      </div>

      {errorMessage && !isModalOpen && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}

      <div className="min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /><span className="sr-only">Memuat City Guide</span></div>
          ) : guides.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-500 dark:text-slate-400"><MapPinned className="mb-3 h-10 w-10" /><p>Belum ada data City Guide.</p></div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead><tr className="bg-slate-50 text-sm uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                <th className="p-4 font-medium">Judul</th><th className="p-4 font-medium">Kategori</th><th className="p-4 font-medium">Alamat</th><th className="p-4 font-medium">Titik Peta</th><th className="p-4 text-right font-medium">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{guides.map((item) => {
                const hasCoordinates = item.latitude !== null && item.longitude !== null;
                return <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{item.title}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.category}</td>
                  <td className="max-w-80 p-4 text-sm text-slate-600 dark:text-slate-300">{item.address || '-'}</td>
                  <td className="p-4">{hasCoordinates ? <a href={googleMapsURL(item.latitude as number, item.longitude as number)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/50"><MapPinned className="h-4 w-4" /><span>{Number(item.latitude).toFixed(6)}, {Number(item.longitude).toFixed(6)}</span><ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Belum ditentukan</span>}</td>
                  <td className="p-4 text-right"><div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEditForm(item)} aria-label={`Edit ${item.title}`} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950"><Edit className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void handleDelete(item.id)} aria-label={`Arsipkan ${item.title}`} className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"><Trash className="h-4 w-4" /></button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          )}
        </div>
      </div>

      <ModalForm isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); setErrorMessage(''); }} title={formData.id ? 'Edit City Guide' : 'Tambah City Guide'} onSubmit={handleSave} submitting={submitting} submitText={formData.id ? 'Simpan Perubahan' : 'Simpan Data'} size="large">
        {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Judul" required maxLength={255} value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} />
          <SelectInput label="Kategori" required value={formData.category} onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))} options={categoryOptions.map((category) => ({ value: category, label: category }))} />
        </div>
        <TextArea label="Deskripsi" rows={3} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Ringkasan lokasi, layanan, jam operasional, atau informasi pengunjung" />
        <TextArea label="Alamat" rows={2} value={formData.address} onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))} />

        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Titik koordinat peta</legend>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-slate-500 dark:text-slate-400">Gunakan koordinat desimal agar lokasi dapat dibuka tepat di aplikasi peta.</p><button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-300 px-3 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"><LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />{locating ? 'Mengambil lokasi...' : 'Gunakan Lokasi Saat Ini'}</button></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput label="Latitude" type="number" inputMode="decimal" step="any" min={-90} max={90} required value={formData.latitude} onChange={(event) => setFormData((current) => ({ ...current, latitude: event.target.value }))} placeholder="Contoh: -6.402484" />
            <TextInput label="Longitude" type="number" inputMode="decimal" step="any" min={-180} max={180} required value={formData.longitude} onChange={(event) => setFormData((current) => ({ ...current, longitude: event.target.value }))} placeholder="Contoh: 106.742061" />
          </div>
          {coordinatePreviewReady && <a href={googleMapsURL(formData.latitude, formData.longitude)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-50 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-950"><MapPinned className="h-4 w-4" />Pratinjau titik di Google Maps<ExternalLink className="h-3.5 w-3.5" /></a>}
        </fieldset>

        <MediaInput label="Gambar City Guide" value={formData.image_url} onClear={() => setFormData((current) => ({ ...current, image_url: '' }))} onSelect={() => setIsMediaSelectorOpen(true)} />
      </ModalForm>

      <MediaSelectorModal isOpen={isMediaSelectorOpen} onClose={() => setIsMediaSelectorOpen(false)} onSelect={(url) => { setFormData((current) => ({ ...current, image_url: url })); setIsMediaSelectorOpen(false); }} />
    </div>
  );
}
