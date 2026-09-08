import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Medal, Plus, RefreshCw, Search, Send, ShieldCheck, Trophy, XCircle } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from '../lib/router';
import Modal from '../components/Modal';
import ModalForm from '../components/common/ModalForm';
import { AdminAlert, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { AdminDataTable, type AdminDataTableColumn } from '../components/cuba/AdminDataTable';
import { AdminWorkspaceTabs } from '../components/cuba/AdminWorkspaceTabs';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import { getRealmRoles } from '../lib/auth';
// INFO: Import table controls
import { useTableControls, usePagination } from '../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector } from '../components/common/TableControls';

interface Kontingen { id: string; name: string }
interface Standing { id: string; kontingen_id: string; gold: number; silver: number; bronze: number; updated_at: string }
interface Submission {
  id: string; kontingen_id: string; gold: number; silver: number; bronze: number; evidence_url?: string; notes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'OFFICIAL'; submitted_by: string; verified_by?: string; rejected_by?: string; published_by?: string; verification_notes?: string; submitted_at: string;
}

type SubmissionSortKey = 'kontingen' | 'status' | 'submitted_at';
type StandingSortKey = 'kontingen' | 'gold' | 'silver' | 'bronze' | 'total';
type MedalWorkspace = 'standings' | 'verification';
type TransitionAction = 'verify' | 'reject' | 'publish';

const submissionStatusLabels: Record<Submission['status'], string> = {
  PENDING: 'Menunggu', VERIFIED: 'Terverifikasi', REJECTED: 'Ditolak', OFFICIAL: 'Resmi',
};

export default function Medals() {
  const auth = useAuth();
  const location = useLocation();
  const verificationRoute = location.pathname.endsWith('/verifikasi');
  const token = auth.user?.access_token;
  const roles = getRealmRoles(auth.user);
  const canSubmit = roles.includes('super_admin') || roles.includes('koresponden');
  const canVerify = roles.includes('super_admin') || roles.includes('verifikator');
  const canPublish = roles.includes('super_admin');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [kontingens, setKontingens] = useState<Kontingen[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ kontingen_id: '', gold: 0, silver: 0, bronze: 0, evidence_url: '', notes: '' });
  const [activeWorkspace, setActiveWorkspace] = useState<MedalWorkspace>(verificationRoute ? 'verification' : 'standings');
  const [submissionQuery, setSubmissionQuery] = useState('');
  const [standingQuery, setStandingQuery] = useState('');
  const [pendingTransition, setPendingTransition] = useState<{ submission: Submission; action: TransitionAction } | null>(null);
  const [transitionReason, setTransitionReason] = useState('');

  useEffect(() => {
    setActiveWorkspace(verificationRoute ? 'verification' : 'standings');
  }, [verificationRoute]);

  // INFO: Initialize table controls for Submissions
  const subTable = useTableControls<SubmissionSortKey>({ sortKey: 'submitted_at', sortDirection: 'desc', rowsPerPage: 10 });
  const { resetPage: resetSubmissionPage } = subTable;
  
  // INFO: Initialize table controls for Standings
  const stdTable = useTableControls<StandingSortKey>({ sortKey: 'gold', sortDirection: 'desc', rowsPerPage: 10 });
  const { resetPage: resetStandingPage } = stdTable;

  // CHANGE: Reset submissions page when filter changes
  useEffect(() => {
    resetSubmissionPage();
  }, [statusFilter, resetSubmissionPage]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [standingResponse, submissionResponse, kontingenResponse] = await Promise.all([
        apiClient.get<Standing[]>('/medals/standings'),
        apiClient.get<Submission[]>(`/medals/submissions${statusFilter ? `?status=${statusFilter}` : ''}`, authConfig(token)),
        apiClient.get<Kontingen[]>('/master-data/kontingens', authConfig(token)),
      ]);
      setStandings(unwrapApiData<Standing[]>(standingResponse.data) || []);
      setSubmissions(unwrapApiData<Submission[]>(submissionResponse.data) || []);
      setKontingens(unwrapApiData<Kontingen[]>(kontingenResponse.data) || []);
      setFeedback(null);
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal memuat alur perolehan medali.') });
    } finally { setLoading(false); }
  }, [statusFilter, token]);

  useEffect(() => { void loadData(); }, [loadData]);
  const kontingenMap = useMemo(() => new Map(kontingens.map((item) => [item.id, item.name])), [kontingens]);

  useEffect(() => { resetSubmissionPage(); }, [submissionQuery, resetSubmissionPage]);
  useEffect(() => { resetStandingPage(); }, [standingQuery, resetStandingPage]);

  const filteredSubmissions = useMemo(() => {
    const query = submissionQuery.trim().toLocaleLowerCase('id-ID');
    if (!query) return submissions;
    return submissions.filter((item) => [kontingenMap.get(item.kontingen_id), item.submitted_by, item.status, item.notes]
      .some((value) => value?.toLocaleLowerCase('id-ID').includes(query)));
  }, [kontingenMap, submissionQuery, submissions]);

  const filteredStandings = useMemo(() => {
    const query = standingQuery.trim().toLocaleLowerCase('id-ID');
    if (!query) return standings;
    return standings.filter((item) => (kontingenMap.get(item.kontingen_id) || item.kontingen_id).toLocaleLowerCase('id-ID').includes(query));
  }, [kontingenMap, standingQuery, standings]);

  // PERFORMANCE: Sort submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      if (subTable.sortKey === 'kontingen') {
        const nameA = kontingenMap.get(a.kontingen_id) || a.kontingen_id;
        const nameB = kontingenMap.get(b.kontingen_id) || b.kontingen_id;
        return subTable.sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (subTable.sortKey === 'status') {
        return subTable.sortDirection === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      if (subTable.sortKey === 'submitted_at') {
        const timeA = new Date(a.submitted_at).getTime();
        const timeB = new Date(b.submitted_at).getTime();
        return subTable.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredSubmissions, subTable.sortKey, subTable.sortDirection, kontingenMap]);

  const subPagination = usePagination(sortedSubmissions, subTable.currentPage, subTable.rowsPerPage);

  // PERFORMANCE: Sort standings
  const sortedStandings = useMemo(() => {
    return [...filteredStandings].sort((a, b) => {
      if (stdTable.sortKey === 'kontingen') {
        const nameA = kontingenMap.get(a.kontingen_id) || a.kontingen_id;
        const nameB = kontingenMap.get(b.kontingen_id) || b.kontingen_id;
        return stdTable.sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (stdTable.sortKey === 'gold') {
        return stdTable.sortDirection === 'asc' ? a.gold - b.gold : b.gold - a.gold;
      }
      if (stdTable.sortKey === 'silver') {
        return stdTable.sortDirection === 'asc' ? a.silver - b.silver : b.silver - a.silver;
      }
      if (stdTable.sortKey === 'bronze') {
        return stdTable.sortDirection === 'asc' ? a.bronze - b.bronze : b.bronze - a.bronze;
      }
      if (stdTable.sortKey === 'total') {
        const totalA = a.gold + a.silver + a.bronze;
        const totalB = b.gold + b.silver + b.bronze;
        return stdTable.sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });
  }, [filteredStandings, stdTable.sortKey, stdTable.sortDirection, kontingenMap]);

  const stdPagination = usePagination(sortedStandings, stdTable.currentPage, stdTable.rowsPerPage);

  const submissionColumns = useMemo<Array<AdminDataTableColumn<Submission, SubmissionSortKey>>>(() => [
    {
      key: 'kontingen',
      label: 'Kontingen',
      sortKey: 'kontingen',
      className: 'min-w-64',
      render: (item) => (
        <div>
          <p className="font-black text-slate-950 dark:text-white">{kontingenMap.get(item.kontingen_id) || item.kontingen_id}</p>
          {item.notes && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.notes}</p>}
        </div>
      ),
    },
    {
      key: 'medals',
      label: 'Medali',
      className: 'whitespace-nowrap text-center font-bold',
      headerClassName: 'text-center',
      render: (item) => <><span className="text-yellow-700 dark:text-yellow-300">{item.gold} E</span> · <span className="text-slate-500 dark:text-slate-400">{item.silver} P</span> · <span className="text-yellow-900 dark:text-yellow-500">{item.bronze} B</span></>,
    },
    { key: 'submitter', label: 'Pengaju', render: (item) => <span className="text-sm text-slate-700 dark:text-slate-200">{item.submitted_by}</span> },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (item) => <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${item.status === 'OFFICIAL' ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : item.status === 'REJECTED' ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200' : item.status === 'VERIFIED' ? 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200' : 'border-yellow-200 bg-yellow-100 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200'}`}>{submissionStatusLabels[item.status]}</span>,
    },
    { key: 'submitted_at', label: 'Tanggal', sortKey: 'submitted_at', className: 'whitespace-nowrap', render: (item) => <time className="text-sm text-slate-600 dark:text-slate-300" dateTime={item.submitted_at}>{new Date(item.submitted_at).toLocaleString('id-ID')}</time> },
  ], [kontingenMap]);

  const standingColumns = useMemo<Array<AdminDataTableColumn<Standing, StandingSortKey>>>(() => [
    { key: 'kontingen', label: 'Kontingen', sortKey: 'kontingen', className: 'min-w-64', render: (item) => <span className="font-black text-slate-950 dark:text-white">{kontingenMap.get(item.kontingen_id) || item.kontingen_id}</span> },
    { key: 'gold', label: 'Emas', sortKey: 'gold', className: 'text-center font-black text-yellow-700 dark:text-yellow-300', headerClassName: 'text-center', render: (item) => item.gold },
    { key: 'silver', label: 'Perak', sortKey: 'silver', className: 'text-center font-bold text-slate-500 dark:text-slate-300', headerClassName: 'text-center', render: (item) => item.silver },
    { key: 'bronze', label: 'Perunggu', sortKey: 'bronze', className: 'text-center font-bold text-yellow-900 dark:text-yellow-500', headerClassName: 'text-center', render: (item) => item.bronze },
    { key: 'total', label: 'Total', sortKey: 'total', className: 'text-center text-xl font-black text-blue-700 dark:text-blue-200', headerClassName: 'text-center', render: (item) => item.gold + item.silver + item.bronze },
  ], [kontingenMap]);

  const createSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await apiClient.post('/medals/submissions', form, authConfig(token));
      setModalOpen(false);
      setForm({ kontingen_id: '', gold: 0, silver: 0, bronze: 0, evidence_url: '', notes: '' });
      setFeedback({ type: 'success', message: 'Pengajuan medali masuk antrean verifikasi.' });
      await loadData();
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal membuat pengajuan medali.') });
    } finally { setSubmitting(false); }
  };

  const requestTransition = (submission: Submission, action: TransitionAction) => {
    setTransitionReason('');
    setPendingTransition({ submission, action });
  };

  const transition = async () => {
    if (!token || !pendingTransition) return;
    const { submission, action } = pendingTransition;
    const reason = transitionReason.trim();
    if (action === 'reject' && reason.length < 5) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/medals/submissions/${submission.id}/${action}`, { reason }, authConfig(token));
      setFeedback({ type: 'success', message: action === 'publish' ? 'Perolehan medali resmi telah dipublikasikan.' : action === 'verify' ? 'Pengajuan berhasil diverifikasi.' : 'Pengajuan berhasil ditolak.' });
      setPendingTransition(null);
      setTransitionReason('');
      await loadData();
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Perubahan status pengajuan gagal.') });
    } finally { setSubmitting(false); }
  };

  const pendingCount = submissions.filter((item) => item.status === 'PENDING').length;
  const verifiedCount = submissions.filter((item) => item.status === 'VERIFIED').length;
  const officialTotal = standings.reduce((total, item) => total + item.gold + item.silver + item.bronze, 0);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow={verificationRoute ? 'Alur persetujuan terkendali' : 'Pencatatan medali resmi'}
        title={verificationRoute ? 'Verifikasi Perolehan Medali' : 'Perolehan Medali'}
        description={verificationRoute ? 'Tinjau pengajuan sesuai kewenangan. Verifikasi dan publikasi dipisahkan agar klasemen resmi mudah diaudit.' : 'Pantau klasemen resmi dan ajukan perubahan medali. Pengajuan baru tidak mengubah publikasi sebelum melewati verifikasi.'}
        actions={<><button type="button" onClick={() => void loadData()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className="size-4" aria-hidden="true" />Perbarui</button>{canSubmit && <button type="button" onClick={() => setModalOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"><Plus className="size-4" aria-hidden="true" />Ajukan medali</button>}</>}
      />

      {feedback && <AdminAlert tone={feedback.type === 'error' ? 'danger' : 'success'}>{feedback.message}</AdminAlert>}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan alur medali">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Menunggu verifikasi</p><p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-200">{pendingCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Siap publikasi</p><p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-200">{verifiedCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Medali resmi</p><p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-200">{officialTotal}</p></div>
      </section>

      <AdminWorkspaceTabs activeTab={activeWorkspace} ariaLabel="Bagian perolehan medali" onChange={setActiveWorkspace} tabs={[{ id: 'standings', label: 'Klasemen Resmi', icon: <Trophy className="size-4" aria-hidden="true" /> }, { id: 'verification', label: 'Antrean Verifikasi', icon: <ShieldCheck className="size-4" aria-hidden="true" /> }]} />

      {/* CHANGE: route /verifikasi dan /medals berbagi kontrak data, tetapi membuka workspace yang sesuai tugas. */}
      {activeWorkspace === 'verification' && <section id="panel-verification" role="tabpanel" aria-labelledby="tab-verification" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
            <ShieldCheck className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Antrean verifikasi
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative min-w-0 flex-1 sm:min-w-64">
              <span className="sr-only">Cari pengajuan</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input type="search" value={submissionQuery} onChange={(event) => setSubmissionQuery(event.target.value)} placeholder="Cari kontingen atau pengaju..." className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              Status 
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="">Semua</option>
                {(['PENDING','VERIFIED','REJECTED','OFFICIAL'] as Submission['status'][]).map((value) => (
                  <option key={value} value={value}>{submissionStatusLabels[value]}</option>
                ))}
              </select>
            </label>
            <RowsPerPageSelector
              rowsPerPage={subTable.rowsPerPage}
              onChange={subTable.handleChangeRowsPerPage}
            />
          </div>
        </div>

        <AdminDataTable<Submission, SubmissionSortKey>
          caption="Antrean verifikasi perolehan medali"
          rows={subPagination.paginatedData}
          columns={submissionColumns}
          getRowId={(item) => item.id}
          sortKey={subTable.sortKey}
          sortDirection={subTable.sortDirection}
          onSort={subTable.handleSort}
          selectionEnabled={false}
          loading={loading}
          loadingLabel="Memuat antrean verifikasi..."
          emptyTitle="Tidak ada pengajuan"
          emptyDescription="Tidak ada pengajuan yang cocok dengan pencarian dan filter status ini."
          minWidthClassName="min-w-[900px]"
          rowActions={(item) => (
            <>
              {item.status === 'PENDING' && canVerify && (
                <>
                  <button type="button" disabled={submitting} onClick={() => requestTransition(item, 'verify')} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"><CheckCircle2 className="mr-1 size-4" aria-hidden="true" />Verifikasi</button>
                  <button type="button" disabled={submitting} onClick={() => requestTransition(item, 'reject')} className="inline-flex min-h-11 items-center rounded-xl border border-red-300 px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"><XCircle className="mr-1 size-4" aria-hidden="true" />Tolak</button>
                </>
              )}
              {item.status === 'VERIFIED' && canPublish && <button type="button" disabled={submitting} onClick={() => requestTransition(item, 'publish')} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"><Send className="mr-1 size-4" aria-hidden="true" />Publikasikan</button>}
            </>
          )}
        />
        {!loading && sortedSubmissions.length > 0 && <TablePagination currentPage={subTable.currentPage} totalPages={subPagination.totalPages} totalItems={subPagination.totalItems} startItem={subPagination.startItem} endItem={subPagination.endItem} onPageChange={subTable.handleChangePage} itemLabel="pengajuan" />}
      </section>}

      {/* Standings Section */}
      {activeWorkspace === 'standings' && <section id="panel-standings" role="tabpanel" aria-labelledby="tab-standings" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
            <Medal className="h-5 w-5 text-amber-500" />Klasemen resmi
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1 sm:min-w-64"><span className="sr-only">Cari kontingen</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type="search" value={standingQuery} onChange={(event) => setStandingQuery(event.target.value)} placeholder="Cari kontingen..." className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
            <RowsPerPageSelector rowsPerPage={stdTable.rowsPerPage} onChange={stdTable.handleChangeRowsPerPage} />
          </div>
        </div>
        
        <AdminDataTable<Standing, StandingSortKey>
          caption="Klasemen medali resmi"
          rows={stdPagination.paginatedData}
          columns={standingColumns}
          getRowId={(item) => item.id}
          sortKey={stdTable.sortKey}
          sortDirection={stdTable.sortDirection}
          onSort={stdTable.handleSort}
          selectionEnabled={false}
          loading={loading}
          loadingLabel="Memuat klasemen resmi..."
          emptyTitle="Belum ada klasemen"
          emptyDescription={standingQuery ? 'Tidak ada kontingen yang cocok dengan pencarian.' : 'Belum ada medali berstatus Resmi.'}
          minWidthClassName="min-w-[650px]"
        />
        {!loading && sortedStandings.length > 0 && <TablePagination currentPage={stdTable.currentPage} totalPages={stdPagination.totalPages} totalItems={stdPagination.totalItems} startItem={stdPagination.startItem} endItem={stdPagination.endItem} onPageChange={stdTable.handleChangePage} itemLabel="kontingen" />}
      </section>}

      <ModalForm 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Ajukan Perolehan Medali" 
        onSubmit={createSubmission} 
        submitting={submitting} 
        submitText="Kirim untuk verifikasi"
        draft={{ entityId: 'new-medal-submission', version: 'medal-submission-v1', value: form, onRestore: setForm }}
      >
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Kontingen
          <select 
            required 
            value={form.kontingen_id} 
            onChange={(event) => setForm({ ...form, kontingen_id: event.target.value })} 
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Pilih kontingen</option>
            {kontingens.map((item) => (
              <option key={item.id} value={item.id} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">{item.name}</option>
            ))}
          </select>
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {([['gold', 'Emas'], ['silver', 'Perak'], ['bronze', 'Perunggu']] as const).map(([field, label]) => (
            <label key={field} className="text-sm font-bold text-slate-900 dark:text-white">
              {label}
              <input 
                type="number" 
                min="0" 
                value={form[field]} 
                onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} 
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          ))}
        </div>
        
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          URL bukti
          <input 
            type="url" 
            value={form.evidence_url} 
            onChange={(event) => setForm({ ...form, evidence_url: event.target.value })} 
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="https://..." 
          />
        </label>
        
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Catatan
          <textarea 
            value={form.notes} 
            onChange={(event) => setForm({ ...form, notes: event.target.value })} 
            className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </label>
      </ModalForm>

      <Modal
        isOpen={Boolean(pendingTransition)}
        onClose={() => { setPendingTransition(null); setTransitionReason(''); }}
        closeDisabled={submitting}
        title={pendingTransition?.action === 'publish' ? 'Publikasikan perolehan medali?' : pendingTransition?.action === 'reject' ? 'Tolak pengajuan medali?' : 'Verifikasi pengajuan medali?'}
        description="Tindakan ini tercatat pada riwayat aktivitas sesuai identitas dan peran Anda."
      >
        <div className="space-y-4 p-4 sm:p-6">
          {pendingTransition && <AdminAlert tone={pendingTransition.action === 'reject' ? 'warning' : 'success'}><strong>{kontingenMap.get(pendingTransition.submission.kontingen_id) || pendingTransition.submission.kontingen_id}</strong> · {pendingTransition.submission.gold} emas, {pendingTransition.submission.silver} perak, {pendingTransition.submission.bronze} perunggu.</AdminAlert>}
          {pendingTransition?.action === 'reject' && <label htmlFor="medal-rejection-reason" className="block text-sm font-bold text-slate-700 dark:text-slate-200">Alasan penolakan <span className="text-red-500" aria-hidden="true">*</span><textarea id="medal-rejection-reason" required minLength={5} value={transitionReason} onChange={(event) => setTransitionReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Jelaskan alasan penolakan (minimal 5 karakter)" /></label>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
            <button type="button" disabled={submitting} onClick={() => { setPendingTransition(null); setTransitionReason(''); }} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Batal</button>
            <button type="button" disabled={submitting || (pendingTransition?.action === 'reject' && transitionReason.trim().length < 5)} onClick={() => void transition()} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${pendingTransition?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : pendingTransition?.action === 'publish' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{pendingTransition?.action === 'publish' ? <Send className="size-4" aria-hidden="true" /> : pendingTransition?.action === 'reject' ? <XCircle className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}{submitting ? 'Memproses...' : pendingTransition?.action === 'publish' ? 'Publikasikan' : pendingTransition?.action === 'reject' ? 'Tolak pengajuan' : 'Verifikasi'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
