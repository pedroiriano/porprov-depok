import { useCallback, useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash, Users } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import SearchableSelect from '../common/SearchableSelect';
import type { SelectOption } from '../common/SearchableSelect';
import ModalForm from '../common/ModalForm';
import { SelectInput, TextInput } from '../common/FormInputs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../../lib/api';
import { useTableControls, usePagination } from '../../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector } from '../common/TableControls';
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
import { AdminDataTable, type AdminDataTableColumn } from '../cuba/AdminDataTable';
import { AdminAlert, AdminPageHeader, BulkActionBar } from '../cuba/AdminPrimitives';
import RevisionHistory from '../common/RevisionHistory';
import { applyRevisionFields } from '../../lib/revision';

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
  const [listError, setListError] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [formError, setFormError] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const auth = useAuth();

  const getAuthConfig = useCallback(() => authConfig(auth.user?.access_token), [auth.user?.access_token]);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<MatchSchedule[] | { data: MatchSchedule[] }>('/schedule/matches/enriched', getAuthConfig());
      setMatches(unwrapApiData(response.data) || []);
      setListError('');
    } catch (error) {
      setListError(getApiErrorMessage(error, 'Gagal memuat jadwal pertandingan.'));
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
      setReferenceError('');
    } catch (error) {
      setReferenceError(getApiErrorMessage(error, 'Gagal memuat referensi jadwal dan peserta.'));
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
      setFormError(validationError);
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      setOperationMessage('');
      const wasEditing = Boolean(formData.id);
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
      setOperationMessage(wasEditing ? 'Jadwal dan peserta berhasil diperbarui.' : 'Jadwal dan peserta berhasil ditambahkan.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan jadwal dan susunan peserta.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (ids: string[]) => {
    const reason = requestSoftDeleteReason(ids.length > 1 ? `${ids.length} jadwal pertandingan ini` : 'Jadwal pertandingan ini');
    if (reason === null) return;
    try {
      setArchiving(true);
      setListError('');
      setOperationMessage('');
      for (const id of ids) {
        await apiClient.delete(`/schedule/matches/${id}`, { ...getAuthConfig(), data: { reason } });
      }
      setSelectedIds(new Set());
      await fetchMatches();
      setOperationMessage(`${ids.length} jadwal pertandingan berhasil diarsipkan.`);
    } catch (error) {
      setListError(getApiErrorMessage(error, 'Gagal mengarsipkan data jadwal.'));
    } finally {
      setArchiving(false);
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
    setFormError('');
    setIsModalOpen(true);
  };

  const columns: Array<AdminDataTableColumn<MatchSchedule, SortKeyType>> = [
    {
      key: 'match_date',
      label: 'Waktu',
      sortKey: 'match_date',
      className: 'whitespace-nowrap',
      render: (item) => <span className="font-black text-slate-950 dark:text-white">{new Date(item.match_date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>,
    },
    { key: 'nomor', label: 'Cabor / Nomor', sortKey: 'nomor_tanding', className: 'min-w-56', render: (item) => <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getNomorTandingName(item.nomor_tanding_id)}</span> },
    { key: 'participants', label: 'Peserta', className: 'min-w-64', render: (item) => <span className={`text-sm font-black ${(item.participants?.length || 0) === 2 ? 'text-slate-950 dark:text-white' : 'text-amber-700 dark:text-amber-300'}`}>{participantSummary(item)}</span> },
    { key: 'venue', label: 'Venue', sortKey: 'venue', className: 'min-w-48', render: (item) => <span className="text-sm text-slate-600 dark:text-slate-300">{getVenueName(item.venue_id)}</span> },
    { key: 'round', label: 'Babak', sortKey: 'round', render: (item) => <span className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">{item.round?.replaceAll('_', ' ')}</span> },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (item) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${item.status === 'finished' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : item.status === 'ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : item.status === 'delayed' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{item.status}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Operasional pertandingan"
        title="Jadwal Pertandingan"
        description="Atur waktu, venue, dan Peserta A/B yang menjadi sumber resmi LiveScore."
        actions={<button type="button" onClick={() => { resetForm(); setFormError(''); setIsModalOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" aria-hidden="true" />Tambah jadwal</button>}
      />

      {operationMessage && <AdminAlert tone="success">{operationMessage}</AdminAlert>}
      {referenceError && <AdminAlert tone="warning"><div className="flex flex-wrap items-center gap-3"><span>{referenceError}</span><button type="button" onClick={() => void fetchReferences()} className="min-h-11 rounded-xl border border-yellow-400 bg-white px-3 text-xs font-black text-yellow-900 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-slate-900 dark:text-yellow-100 dark:hover:bg-yellow-950">Muat ulang referensi</button></div></AdminAlert>}

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
        <p className="flex items-center gap-2 font-black"><Users className="size-5" aria-hidden="true" />Alur input peserta</p>
        <p className="mt-1 text-blue-800 dark:text-blue-200">Pilih jenis Individu, Tim, atau Kontingen di jadwal ini. LiveScore Center otomatis membaca Peserta A/B dan hanya digunakan untuk input skor, status, serta koreksi.</p>
      </div>

      {/* CHANGE: Standardized table wrapper */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <span className="sr-only">Cari jadwal atau peserta</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input 
              type="search"
              maxLength={80}
              placeholder="Cari jadwal atau peserta..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </label>
          <RowsPerPageSelector value={table.rowsPerPage} onChange={table.setRowsPerPage} />
        </div>
        
        <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => void handleArchive([...selectedIds])} deleting={archiving} itemLabel="jadwal" />

        <AdminDataTable<MatchSchedule, SortKeyType>
          caption="Daftar jadwal dan peserta pertandingan PORPROV"
          rows={paginatedData}
          columns={columns}
          getRowId={(item) => item.id}
          getRowLabel={(item) => `${getNomorTandingName(item.nomor_tanding_id)} ${participantSummary(item)}`}
          selectionLabel="jadwal"
          sortKey={table.sortKey}
          sortDirection={table.sortDirection}
          onSort={table.handleSort}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          loading={loading}
          loadingLabel="Memuat jadwal pertandingan..."
          error={listError}
          onRetry={fetchMatches}
          emptyTitle={search ? 'Jadwal pertandingan tidak ditemukan' : 'Belum ada jadwal dengan susunan peserta'}
          emptyDescription={search ? 'Ubah kata pencarian untuk memperluas hasil.' : 'Tambahkan jadwal setelah nomor, venue, dan kontingen tersedia.'}
          minWidthClassName="min-w-[1180px]"
          rowActions={(item) => <><button type="button" onClick={() => editMatch(item)} aria-label={`Edit jadwal ${getNomorTandingName(item.nomor_tanding_id)}`} title="Edit jadwal dan peserta" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"><Edit className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => void handleArchive([item.id])} disabled={archiving} aria-label={`Arsipkan jadwal ${getNomorTandingName(item.nomor_tanding_id)}`} title="Arsipkan jadwal" className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"><Trash className="size-4" aria-hidden="true" /></button></>}
        />
        
        {!loading && !listError && totalItems > 0 && (
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

      <ModalForm isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); setFormError(''); }} title={formData.id ? 'Edit Jadwal & Peserta' : 'Tambah Jadwal & Peserta'} onSubmit={handleSave} submitting={submitting} submitText={formData.id ? 'Simpan perubahan' : 'Simpan jadwal'} size="large" draft={{ entityId: formData.id || 'new-jadwal', version: 'jadwal-v1', value: formData, onRestore: setFormData }}>
        {formError && <AdminAlert>{formError}</AdminAlert>}
        {referenceError && <AdminAlert tone="warning">{referenceError}</AdminAlert>}
        <RevisionHistory entityName="Match" entityId={formData.id} onRestore={(payload) => { const historical = payload.match; if (historical && typeof historical === 'object' && !Array.isArray(historical)) setFormData((current) => applyRevisionFields(current, historical as Record<string, unknown>)); }} />
        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Konteks pertandingan</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cabor / Nomor Tanding <span className="text-red-500" aria-hidden="true">*</span></p><SearchableSelect options={nomorTandingOptions} value={formData.nomor_tanding_id} onChange={(value) => setFormData((current) => ({ ...current, nomor_tanding_id: value }))} placeholder="Pilih Cabor / Nomor Tanding..." ariaLabel="Cabor atau Nomor Tanding" /></div>
          <div><p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lokasi (Venue) <span className="text-red-500" aria-hidden="true">*</span></p><SearchableSelect options={venueOptions} value={formData.venue_id} onChange={(value) => setFormData((current) => ({ ...current, venue_id: value }))} placeholder="Pilih Venue..." ariaLabel="Lokasi Venue" /></div>
        </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-900 dark:text-white">Susunan peserta resmi</legend>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Kontingen wajib dipilih sebagai afiliasi. Nama atlet hanya untuk Individu; nama tim hanya untuk Tim.</p>
          <div className="mb-4 max-w-sm"><SelectInput label="Jenis Peserta Pertandingan" required value={formData.participants[0].participant_type} onChange={(event) => { const participantType = event.target.value as ParticipantType; setFormData((current) => ({ ...current, participants: current.participants.map((participant) => ({ ...participant, participant_type: participantType, athlete_name: '', team_name: '' })) })); }} options={Object.entries(participantTypeLabels).map(([value, label]) => ({ value, label }))} /></div>
          <div className="grid gap-4 lg:grid-cols-2">{formData.participants.map((participant, index) => (
            <section key={participant.slot} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center justify-between"><h4 className="font-black text-slate-900 dark:text-white">Peserta {index === 0 ? 'A' : 'B'}</h4><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">Slot {index + 1}</span></div>
              <div className="space-y-4">
                <div><p className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Kontingen / Afiliasi <span className="text-red-500" aria-hidden="true">*</span></p><SearchableSelect options={kontingenOptions} value={participant.kontingen_id} onChange={(value) => updateParticipant(index, { kontingen_id: value })} placeholder="Pilih Kontingen..." ariaLabel={`Kontingen atau afiliasi Peserta ${index === 0 ? 'A' : 'B'}`} /></div>
                {participant.participant_type === 'individual' && <TextInput label="Nama Atlet" required maxLength={100} value={participant.athlete_name} onChange={(event) => updateParticipant(index, { athlete_name: event.target.value })} placeholder="Nama lengkap atlet" />}
                {participant.participant_type === 'team' && <TextInput label="Nama Tim" required maxLength={150} value={participant.team_name} onChange={(event) => updateParticipant(index, { team_name: event.target.value })} placeholder="Contoh: Kota Depok Putri" />}
                <div className="rounded-xl bg-white px-3 py-2 text-sm dark:bg-slate-900"><span className="text-slate-500">Tampil di LiveScore:</span> <strong className="text-slate-900 dark:text-white">{participantDisplayName(participant)}</strong></div>
              </div>
            </section>
          ))}</div>
        </fieldset>

        <fieldset className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-black text-slate-950 dark:text-white">Waktu dan status</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Waktu Pertandingan" type="datetime-local" required value={formData.match_date} onChange={(event) => setFormData((current) => ({ ...current, match_date: event.target.value }))} />
          <SelectInput label="Babak" value={formData.round} onChange={(event) => setFormData((current) => ({ ...current, round: event.target.value }))} options={[{ value: 'penyisihan', label: 'Penyisihan' }, { value: 'perempat_final', label: 'Perempat Final' }, { value: 'semifinal', label: 'Semifinal' }, { value: 'final', label: 'Final' }]} />
          <SelectInput label="Status" value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))} options={[{ value: 'scheduled', label: 'Terjadwal' }, { value: 'ongoing', label: 'Berlangsung' }, { value: 'finished', label: 'Selesai' }, { value: 'delayed', label: 'Ditunda' }]} />
        </div>
        </fieldset>
      </ModalForm>
    </div>
  );
}
