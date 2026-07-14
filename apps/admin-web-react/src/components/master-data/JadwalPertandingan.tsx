import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Loader2 } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import SearchableSelect from '../common/SearchableSelect';
import type { SelectOption } from '../common/SearchableSelect';
import ModalForm from '../common/ModalForm';
import { SelectInput } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import type { Cabor, MatchSchedule, NomorTanding, Venue } from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

export default function JadwalPertandingan() {
  const [matches, setMatches] = useState<MatchSchedule[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [nomorTandings, setNomorTandings] = useState<NomorTanding[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nomor_tanding_id: '',
    venue_id: '',
    match_date: '',
    status: 'scheduled',
    round: 'penyisihan'
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchMatches();
    fetchVenues();
    fetchCabors();
    fetchNomorTandings();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const getAuthConfig = () => authConfig(auth.user?.access_token);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<MatchSchedule[] | { data: MatchSchedule[] }>('/schedule/matches', getAuthConfig());
      setMatches(unwrapApiData(res.data) || []);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat jadwal pertandingan.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await apiClient.get<Venue[] | { data: Venue[] }>('/venues', getAuthConfig());
      setVenues(unwrapApiData(res.data) || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat referensi venue.'));
    }
  };

  const fetchCabors = async () => {
    try {
      const res = await apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', getAuthConfig());
      setCabors(unwrapApiData(res.data) || []);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
    }
  };

  const fetchNomorTandings = async () => {
    try {
      const res = await apiClient.get<NomorTanding[] | { data: NomorTanding[] }>('/master-data/nomor-tandings', getAuthConfig());
      setNomorTandings(unwrapApiData(res.data) || []);
    } catch (error) {
      console.error('Failed to fetch nomor tanding:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat referensi nomor pertandingan.'));
    }
  };

  const resetForm = () => setFormData({ id: '', nomor_tanding_id: '', venue_id: '', match_date: '', status: 'scheduled', round: 'penyisihan' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Backend expects RFC3339 for match_date
      let match_date = formData.match_date;
      if (match_date) {
        match_date = new Date(match_date).toISOString();
      }
      const payload = {
        nomor_tanding_id: formData.nomor_tanding_id,
        venue_id: formData.venue_id,
        match_date,
        status: formData.status,
        round: formData.round,
      };
      if (formData.id) {
        await apiClient.put(`/schedule/matches/${formData.id}`, payload, getAuthConfig());
      } else {
        await apiClient.post('/schedule/matches', payload, getAuthConfig());
      }
      setIsModalOpen(false);
      resetForm();
      await fetchMatches();
    } catch (error) {
      console.error('Failed to create match:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan data jadwal.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const reason = requestSoftDeleteReason('Jadwal pertandingan ini');
    if (reason === null) return;
    try {
      await apiClient.delete(`/schedule/matches/${id}`, { ...getAuthConfig(), data: { reason } });
      await fetchMatches();
    } catch (error) {
      console.error('Failed to delete match:', error);
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data jadwal.'));
    }
  };

  // Helper to find names
  const getVenueName = (id: string) => venues.find(v => v.id === id)?.name || id;
  const getNomorTandingName = (id: string) => {
    const nomor = nomorTandings.find((item) => item.id === id);
    if (!nomor) return id;
    const cabor = cabors.find((item) => item.id === nomor.cabor_id);
    return `${cabor?.name ?? 'Cabor'} — ${nomor.name}`;
  };

  // Prepare options for SearchableSelect
  const nomorTandingOptions: SelectOption[] = nomorTandings.map((item) => ({
    value: item.id,
    label: getNomorTandingName(item.id),
    subLabel: `${item.gender_category} • ${item.match_type}`,
  }));

  const venueOptions: SelectOption[] = venues.map(v => ({
    value: v.id,
    label: v.name,
    subLabel: v.address || undefined
  }));

  const filteredMatches = matches.filter((item) =>
    `${getNomorTandingName(item.nomor_tanding_id)} ${getVenueName(item.venue_id)} ${item.round} ${item.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const editMatch = (item: MatchSchedule) => {
    const date = new Date(item.match_date);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    setFormData({
      id: item.id,
      nomor_tanding_id: item.nomor_tanding_id,
      venue_id: item.venue_id,
      match_date: localDate,
      status: item.status,
      round: item.round,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Jadwal Pertandingan</h2>
          <p className="text-text-muted text-sm mt-1">Kelola jadwal seluruh pertandingan.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Jadwal
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-slate-800/50 rounded-t-md">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari jadwal..."
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
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>Belum ada data Jadwal.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Waktu</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Cabor / Nomor</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Venue</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Babak</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {new Date(item.match_date).toLocaleString('id-ID', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {getNomorTandingName(item.nomor_tanding_id)}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {getVenueName(item.venue_id)}
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.round?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'finished' ? 'bg-success-100 text-success-700' :
                        item.status === 'ongoing' ? 'bg-indigo-100 text-indigo-700' :
                        item.status === 'delayed' ? 'bg-danger-100 text-danger-700' :
                        'bg-warning-100 text-warning-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editMatch(item)} aria-label="Edit jadwal" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label="Arsipkan jadwal pertandingan"
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
        title={formData.id ? 'Edit Jadwal Pertandingan' : 'Tambah Jadwal Pertandingan'}
        onSubmit={handleSave}
        submitting={submitting}
        submitText="Simpan Jadwal"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cabor / Nomor Tanding</label>
          <SearchableSelect
            options={nomorTandingOptions}
            value={formData.nomor_tanding_id}
            onChange={(val) => setFormData({...formData, nomor_tanding_id: val})}
            placeholder="Pilih Cabor / Nomor Tanding..."
          />
          {/* Hidden input to ensure HTML5 required validation still works or we can just rely on form submit validation */}
          <input type="hidden" required value={formData.nomor_tanding_id} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasi (Venue)</label>
          <SearchableSelect
            options={venueOptions}
            value={formData.venue_id}
            onChange={(val) => setFormData({...formData, venue_id: val})}
            placeholder="Pilih Lokasi Venue..."
          />
          <input type="hidden" required value={formData.venue_id} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Waktu Pertandingan</label>
          <input
            type="datetime-local"
            required
            value={formData.match_date}
            onChange={(e) => setFormData({...formData, match_date: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Babak"
            value={formData.round}
            onChange={(e) => setFormData({...formData, round: e.target.value})}
            options={[
              { value: 'penyisihan', label: 'Penyisihan' },
              { value: 'perempat_final', label: 'Perempat Final' },
              { value: 'semifinal', label: 'Semifinal' },
              { value: 'final', label: 'Final' }
            ]}
          />
          <SelectInput
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            options={[
              { value: 'scheduled', label: 'Terjadwal' },
              { value: 'ongoing', label: 'Berlangsung' },
              { value: 'finished', label: 'Selesai' },
              { value: 'delayed', label: 'Ditunda' }
            ]}
          />
        </div>
      </ModalForm>
    </div>
  );
}
