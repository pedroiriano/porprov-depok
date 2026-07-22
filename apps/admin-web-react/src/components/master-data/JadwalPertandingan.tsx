import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Edit, Loader2, Plus, Search, Trash, Users } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import SearchableSelect from '../common/SearchableSelect';
import type { SelectOption } from '../common/SearchableSelect';
import ModalForm from '../common/ModalForm';
import { SelectInput, TextInput } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../common/TableControls';
import type {
  Cabor,
  Kontingen,
  MatchParticipant,
  MatchSchedule,
  NomorTanding,
  ParticipantType,
  Venue,
} from '../../types/master-data';
import { requestSoftDeleteReason } from '../../lib/soft-delete';

interface ParticipantDraft {
  participant_type: ParticipantType;
  kontingen_id: string;
  athlete_name: string;
  team_name: string;
  slot: number;
}

interface ScheduleFormState {
  id: string;
  nomor_tanding_id: string;
  venue_id: string;
  match_date: string;
  status: string;
  round: string;
  participants: ParticipantDraft[];
}

const createParticipant = (slot: number): ParticipantDraft => ({
  participant_type: 'contingent',
  kontingen_id: '',
  athlete_name: '',
  team_name: '',
  slot,
});

const createEmptyForm = (): ScheduleFormState => ({
  id: '',
  nomor_tanding_id: '',
  venue_id: '',
  match_date: '',
  status: 'scheduled',
  round: 'penyisihan',
  participants: [createParticipant(1), createParticipant(2)],
});

const participantTypeLabels: Record<ParticipantType, string> = {
  individual: 'Individu / Atlet',
  team: 'Tim',
  contingent: 'Kontingen',
};

type SortKeyType = 'match_date' | 'nomor_tanding' | 'venue' | 'round' | 'status';

export default function JadwalPertandingan() {
  const [matches, setMatches] = useState<MatchSchedule[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cabors, setCabors] = useState<Cabor[]>([]);
  const [nomorTandings, setNomorTandings] = useState<NomorTanding[]>([]);
  const [kontingens, setKontingens] = useState<Kontingen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormState>(createEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const auth = useAuth();

  const getAuthConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<MatchSchedule[] | { data: MatchSchedule[] }>('/schedule/matches/enriched', getAuthConfig());
      setMatches(unwrapApiData(response.data) || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat jadwal pertandingan.'));
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  const fetchReferences = useCallback(async () => {
    try {
      const [venueResponse, caborResponse, nomorResponse, kontingenResponse] = await Promise.all([
        apiClient.get<Venue[] | { data: Venue[] }>('/venues', getAuthConfig()),
        apiClient.get<Cabor[] | { data: Cabor[] }>('/master-data/cabors', getAuthConfig()),
        apiClient.get<NomorTanding[] | { data: NomorTanding[] }>('/master-data/nomor-tandings', getAuthConfig()),
        apiClient.get<Kontingen[] | { data: Kontingen[] }>('/master-data/kontingens', getAuthConfig()),
      ]);
      setVenues(unwrapApiData(venueResponse.data) || []);
      setCabors(unwrapApiData(caborResponse.data) || []);
      setNomorTandings(unwrapApiData(nomorResponse.data) || []);
      setKontingens(unwrapApiData(kontingenResponse.data) || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat referensi jadwal dan peserta.'));
    }
  }, [getAuthConfig]);

  useEffect(() => {
    void fetchMatches();
    void fetchReferences();
  }, [fetchMatches, fetchReferences]);

  const resetForm = () => setFormData(createEmptyForm());
  const getVenueName = (id: string) => venues.find((venue) => venue.id === id)?.name || id;
  const getKontingenName = (id: string) => kontingens.find((kontingen) => kontingen.id === id)?.name || '';
  const getNomorTandingName = (id: string) => {
    const nomor = nomorTandings.find((item) => item.id === id);
    if (!nomor) return id;
    const cabor = cabors.find((item) => item.id === nomor.cabor_id);
    return `${cabor?.name ?? 'Cabor'} — ${nomor.name}`;
  };

  const participantDisplayName = (participant: MatchParticipant | ParticipantDraft) => {
    if ('display_name' in participant && participant.display_name) return participant.display_name;
    if (participant.participant_type === 'individual') return participant.athlete_name || 'Nama atlet belum diisi';
    if (participant.participant_type === 'team') return participant.team_name || 'Nama tim belum diisi';
    return getKontingenName(participant.kontingen_id) || 'Kontingen belum dipilih';
  };

  const participantSummary = (match: MatchSchedule) => {
    const participants = [...(match.participants || [])].sort((a, b) => a.slot - b.slot);
    return participants.length === 2
      ? participants.map(participantDisplayName).join(' vs ')
      : 'Susunan peserta belum lengkap';
  };

  const nomorTandingOptions: SelectOption[] = nomorTandings.map((item) => ({
    value: item.id,
    label: getNomorTandingName(item.id),
    subLabel: `${item.gender_category} • ${item.match_type}`,
  }));
  const venueOptions: SelectOption[] = venues.map((venue) => ({
    value: venue.id,
    label: venue.name,
    subLabel: venue.address || undefined,
  }));
  const kontingenOptions: SelectOption[] = kontingens.map((kontingen) => ({
    value: kontingen.id,
    label: kontingen.name,
    subLabel: kontingen.region_type,
  }));

  // INFO: Setup pagination & sorting
  const table = useTableControls<SortKeyType>({ sortKey: 'match_date', sortDirection: 'asc', rowsPerPage: 10 });

  useEffect(() => {
    table.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filteredMatches = matches.filter((item) =>
    `${getNomorTandingName(item.nomor_tanding_id)} ${getVenueName(item.venue_id)} ${participantSummary(item)} ${item.round} ${item.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const dir = table.sortDirection === 'asc' ? 1 : -1;
    switch (table.sortKey) {
      case 'match_date':
        return (new Date(a.match_date).getTime() - new Date(b.match_date).getTime()) * dir;
      case 'nomor_tanding':
        return getNomorTandingName(a.nomor_tanding_id).localeCompare(getNomorTandingName(b.nomor_tanding_id)) * dir;
      case 'venue':
        return getVenueName(a.venue_id).localeCompare(getVenueName(b.venue_id)) * dir;
      case 'round':
        return (a.round || '').localeCompare(b.round || '') * dir;
      case 'status':
        return (a.status || '').localeCompare(b.status || '') * dir;
      default:
        return 0;
    }
  });

  const {
    paginatedData,
    totalItems,
    totalPages,
    startItem,
    endItem,
  } = usePagination(sortedMatches, table.currentPage, table.rowsPerPage);

  const updateParticipant = (index: number, changes: Partial<ParticipantDraft>) => {
    setFormData((current) => ({
      ...current,
      participants: current.participants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, ...changes } : participant,
      ),
    }));
  };

  const validateForm = () => {
    if (!formData.nomor_tanding_id || !formData.venue_id || !formData.match_date) {
      return 'Cabor/nomor tanding, venue, dan waktu pertandingan wajib diisi.';
    }
    for (const [index, participant] of formData.participants.entries()) {
      const side = index === 0 ? 'A' : 'B';
      if (!participant.kontingen_id) return `Kontingen Peserta ${side} wajib dipilih.`;
      if (participant.participant_type === 'individual' && !participant.athlete_name.trim()) return `Nama atlet Peserta ${side} wajib diisi.`;
      if (participant.participant_type === 'team' && !participant.team_name.trim()) return `Nama tim Peserta ${side} wajib diisi.`;
    }
    const [first, second] = formData.participants;
    if (first.participant_type !== second.participant_type) return 'Peserta A dan Peserta B wajib memakai jenis peserta yang sama.';
    const firstIdentity = `${first.participant_type}|${first.kontingen_id}|${first.athlete_name.trim().toLowerCase()}|${first.team_name.trim().toLowerCase()}`;
    const secondIdentity = `${second.participant_type}|${second.kontingen_id}|${second.athlete_name.trim().toLowerCase()}|${second.team_name.trim().toLowerCase()}`;
    return firstIdentity === secondIdentity ? 'Peserta A dan Peserta B tidak boleh identik.' : '';
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = {
        nomor_tanding_id: formData.nomor_tanding_id,
        venue_id: formData.venue_id,
        match_date: new Date(formData.match_date).toISOString(),
        status: formData.status,
        round: formData.round,
        participants: formData.participants.map((participant, index) => ({
          participant_type: participant.participant_type,
          kontingen_id: participant.kontingen_id,
          athlete_name: participant.participant_type === 'individual' ? participant.athlete_name.trim() : '',
          team_name: participant.participant_type === 'team' ? participant.team_name.trim() : '',
          slot: index + 1,
        })),
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
      setErrorMessage(getApiErrorMessage(error, 'Gagal menyimpan jadwal dan susunan peserta.'));
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
      setErrorMessage(getApiErrorMessage(error, 'Gagal mengarsipkan data jadwal.'));
    }
  };

  const editMatch = (item: MatchSchedule) => {
    const date = new Date(item.match_date);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    const existingParticipants = [...(item.participants || [])].sort((a, b) => a.slot - b.slot);
    const participantType = existingParticipants[0]?.participant_type || 'contingent';
    setFormData({
      id: item.id,
      nomor_tanding_id: item.nomor_tanding_id,
      venue_id: item.venue_id,
      match_date: localDate,
      status: item.status,
      round: item.round,
      participants: [0, 1].map((index) => {
        const participant = existingParticipants[index];
        return participant ? {
          participant_type: participantType,
          kontingen_id: participant.kontingen_id,
          athlete_name: participant.athlete_name || '',
          team_name: participant.team_name || '',
          slot: index + 1,
        } : createParticipant(index + 1);
      }),
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Jadwal Pertandingan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur waktu, venue, dan Peserta A/B yang menjadi sumber resmi LiveScore.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setErrorMessage(''); setIsModalOpen(true); }} className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
          <Plus className="h-5 w-5" /> Tambah Jadwal
        </button>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100">
        <p className="flex items-center gap-2 font-bold"><Users className="h-5 w-5" />Alur input peserta</p>
        <p className="mt-1 text-indigo-800 dark:text-indigo-200">Pilih jenis Individu, Tim, atau Kontingen di jadwal ini. LiveScore Center otomatis membaca Peserta A/B dan hanya digunakan untuk input skor, status, serta koreksi.</p>
      </div>

      {/* CHANGE: Standardized table wrapper */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari jadwal atau peserta..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
            />
          </div>
          <RowsPerPageSelector value={table.rowsPerPage} onChange={table.setRowsPerPage} />
        </div>
        
        <div className="overflow-x-auto">
          {errorMessage && !isModalOpen && (
            <div className="m-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Users className="mb-3 h-9 w-9" />
              <p>Belum ada jadwal dengan susunan peserta.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <SortableHeader sortKey="match_date" currentSort={table.sortKey} direction={table.sortDirection} onSort={table.handleSort}>Waktu</SortableHeader>
                  <SortableHeader sortKey="nomor_tanding" currentSort={table.sortKey} direction={table.sortDirection} onSort={table.handleSort}>Cabor / Nomor</SortableHeader>
                  <th className="p-4 font-medium">Peserta</th>
                  <SortableHeader sortKey="venue" currentSort={table.sortKey} direction={table.sortDirection} onSort={table.handleSort}>Venue</SortableHeader>
                  <SortableHeader sortKey="round" currentSort={table.sortKey} direction={table.sortDirection} onSort={table.handleSort}>Babak</SortableHeader>
                  <SortableHeader sortKey="status" currentSort={table.sortKey} direction={table.sortDirection} onSort={table.handleSort}>Status</SortableHeader>
                  <th className="p-4 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="whitespace-nowrap p-4 font-semibold text-slate-900 dark:text-white">
                      {new Date(item.match_date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {getNomorTandingName(item.nomor_tanding_id)}
                    </td>
                    <td className="min-w-64 p-4">
                      <p className={`text-sm font-bold ${(item.participants?.length || 0) === 2 ? 'text-slate-900 dark:text-white' : 'text-amber-700 dark:text-amber-300'}`}>
                        {participantSummary(item)}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {getVenueName(item.venue_id)}
                    </td>
                    <td className="p-4 text-sm font-medium capitalize text-slate-900 dark:text-white">
                      {item.round?.replaceAll('_', ' ')}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'finished' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : item.status === 'ongoing' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' : item.status === 'delayed' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => editMatch(item)} aria-label="Edit jadwal dan peserta" className="rounded-md p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void handleDelete(item.id)} aria-label="Arsipkan jadwal pertandingan" className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950">
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
        
        {!loading && filteredMatches.length > 0 && (
          <TablePagination
            currentPage={table.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPageChange={table.setPage}
          />
        )}
      </div>

      <ModalForm isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); setErrorMessage(''); }} title={formData.id ? 'Edit Jadwal & Peserta' : 'Tambah Jadwal & Peserta'} onSubmit={handleSave} submitting={submitting} submitText="Simpan Jadwal" size="large">
        {errorMessage && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{errorMessage}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cabor / Nomor Tanding <span className="text-red-500">*</span></label><SearchableSelect options={nomorTandingOptions} value={formData.nomor_tanding_id} onChange={(value) => setFormData((current) => ({ ...current, nomor_tanding_id: value }))} placeholder="Pilih Cabor / Nomor Tanding..." /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lokasi (Venue) <span className="text-red-500">*</span></label><SearchableSelect options={venueOptions} value={formData.venue_id} onChange={(value) => setFormData((current) => ({ ...current, venue_id: value }))} placeholder="Pilih Venue..." /></div>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Susunan peserta resmi</legend>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Kontingen wajib dipilih sebagai afiliasi. Nama atlet hanya untuk Individu; nama tim hanya untuk Tim.</p>
          <div className="mb-4 max-w-sm"><SelectInput label="Jenis Peserta Pertandingan" required value={formData.participants[0].participant_type} onChange={(event) => { const participantType = event.target.value as ParticipantType; setFormData((current) => ({ ...current, participants: current.participants.map((participant) => ({ ...participant, participant_type: participantType, athlete_name: '', team_name: '' })) })); }} options={Object.entries(participantTypeLabels).map(([value, label]) => ({ value, label }))} /></div>
          <div className="grid gap-4 lg:grid-cols-2">{formData.participants.map((participant, index) => (
            <section key={participant.slot} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center justify-between"><h4 className="font-black text-slate-900 dark:text-white">Peserta {index === 0 ? 'A' : 'B'}</h4><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">Slot {index + 1}</span></div>
              <div className="space-y-4">
                <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Kontingen / Afiliasi <span className="text-red-500">*</span></label><SearchableSelect options={kontingenOptions} value={participant.kontingen_id} onChange={(value) => updateParticipant(index, { kontingen_id: value })} placeholder="Pilih Kontingen..." /></div>
                {participant.participant_type === 'individual' && <TextInput label="Nama Atlet" required maxLength={100} value={participant.athlete_name} onChange={(event) => updateParticipant(index, { athlete_name: event.target.value })} placeholder="Nama lengkap atlet" />}
                {participant.participant_type === 'team' && <TextInput label="Nama Tim" required maxLength={150} value={participant.team_name} onChange={(event) => updateParticipant(index, { team_name: event.target.value })} placeholder="Contoh: Kota Depok Putri" />}
                <div className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-900"><span className="text-slate-500">Tampil di LiveScore:</span> <strong className="text-slate-900 dark:text-white">{participantDisplayName(participant)}</strong></div>
              </div>
            </section>
          ))}</div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Waktu Pertandingan" type="datetime-local" required value={formData.match_date} onChange={(event) => setFormData((current) => ({ ...current, match_date: event.target.value }))} />
          <SelectInput label="Babak" value={formData.round} onChange={(event) => setFormData((current) => ({ ...current, round: event.target.value }))} options={[{ value: 'penyisihan', label: 'Penyisihan' }, { value: 'perempat_final', label: 'Perempat Final' }, { value: 'semifinal', label: 'Semifinal' }, { value: 'final', label: 'Final' }]} />
          <SelectInput label="Status" value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))} options={[{ value: 'scheduled', label: 'Terjadwal' }, { value: 'ongoing', label: 'Berlangsung' }, { value: 'finished', label: 'Selesai' }, { value: 'delayed', label: 'Ditunda' }]} />
        </div>
      </ModalForm>
    </div>
  );
}
