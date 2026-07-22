import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Medal, Plus, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
// INFO: Import table controls
import { useTableControls, usePagination } from '../hooks/useTableControls';
import { TablePagination, RowsPerPageSelector, SortableHeader } from '../components/common/TableControls';

interface Kontingen { id: string; name: string }
interface Standing { id: string; kontingen_id: string; gold: number; silver: number; bronze: number; updated_at: string }
interface Submission {
  id: string; kontingen_id: string; gold: number; silver: number; bronze: number; evidence_url?: string; notes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'OFFICIAL'; submitted_by: string; verified_by?: string; rejected_by?: string; published_by?: string; verification_notes?: string; submitted_at: string;
}

type SubmissionSortKey = 'kontingen' | 'status' | 'submitted_at';
type StandingSortKey = 'kontingen' | 'gold' | 'silver' | 'bronze' | 'total';

export default function Medals() {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const realmAccess = auth.user?.profile.realm_access as { roles?: string[] } | undefined;
  const roles = realmAccess?.roles || [];
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

  // INFO: Initialize table controls for Submissions
  const subTable = useTableControls<SubmissionSortKey>({ sortKey: 'submitted_at', sortDirection: 'desc', rowsPerPage: 10 });
  
  // INFO: Initialize table controls for Standings
  const stdTable = useTableControls<StandingSortKey>({ sortKey: 'gold', sortDirection: 'desc', rowsPerPage: 10 });

  // CHANGE: Reset submissions page when filter changes
  useEffect(() => {
    subTable.resetPage();
  }, [statusFilter, subTable.resetPage]);

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
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal memuat workflow Medali.') });
    } finally { setLoading(false); }
  }, [statusFilter, token]);

  useEffect(() => { void loadData(); }, [loadData]);
  const kontingenMap = useMemo(() => new Map(kontingens.map((item) => [item.id, item.name])), [kontingens]);

  // PERFORMANCE: Sort submissions
  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
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
  }, [submissions, subTable.sortKey, subTable.sortDirection, kontingenMap]);

  const subPagination = usePagination(sortedSubmissions, subTable.currentPage, subTable.rowsPerPage);

  // PERFORMANCE: Sort standings
  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => {
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
  }, [standings, stdTable.sortKey, stdTable.sortDirection, kontingenMap]);

  const stdPagination = usePagination(sortedStandings, stdTable.currentPage, stdTable.rowsPerPage);

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

  const transition = async (submission: Submission, action: 'verify' | 'reject' | 'publish') => {
    if (!token) return;
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Masukkan alasan penolakan (minimal 5 karakter):')?.trim() || '';
      if (reason.length < 5) return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/medals/submissions/${submission.id}/${action}`, { reason }, authConfig(token));
      setFeedback({ type: 'success', message: action === 'publish' ? 'Perolehan medali resmi telah dipublikasikan.' : `Pengajuan berhasil di-${action}.` });
      await loadData();
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Transisi workflow gagal.') });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Verification Workflow</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Perolehan Medali</h1>
          <p className="mt-1 text-sm text-slate-500">Pengajuan tidak mengubah klasemen sampai diverifikasi dan dipublikasikan.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => void loadData()} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <RefreshCw className="mr-2 h-4 w-4" />Perbarui
          </button>
          {canSubmit && (
            <button type="button" onClick={() => setModalOpen(true)} className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-bold text-white transition-colors hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />Ajukan medali
            </button>
          )}
        </div>
      </header>
      
      {feedback && (
        <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>
          {feedback.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {/* Submissions Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />Antrean verifikasi
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              Status 
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Semua</option>
                {['PENDING','VERIFIED','REJECTED','OFFICIAL'].map((value) => (
                  <option key={value} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">{value}</option>
                ))}
              </select>
            </label>
            <RowsPerPageSelector
              rowsPerPage={subTable.rowsPerPage}
              onChange={subTable.handleChangeRowsPerPage}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center p-10 text-slate-500 dark:text-slate-400">
            <p>Tidak ada pengajuan pada filter ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full border-collapse text-left min-w-[900px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <tr>
                    <SortableHeader<SubmissionSortKey> sortKey="kontingen" currentSortKey={subTable.sortKey} direction={subTable.sortDirection} onSort={subTable.handleSort} className="p-4 font-medium">Kontingen</SortableHeader>
                    <th className="p-4 font-medium text-center">Medali</th>
                    <th className="p-4 font-medium">Pengaju</th>
                    <SortableHeader<SubmissionSortKey> sortKey="status" currentSortKey={subTable.sortKey} direction={subTable.sortDirection} onSort={subTable.handleSort} className="p-4 font-medium">Status</SortableHeader>
                    <SortableHeader<SubmissionSortKey> sortKey="submitted_at" currentSortKey={subTable.sortKey} direction={subTable.sortDirection} onSort={subTable.handleSort} className="p-4 font-medium">Tanggal</SortableHeader>
                    <th className="p-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {subPagination.paginatedData.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{kontingenMap.get(item.kontingen_id) || item.kontingen_id}</p>
                        {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span className="text-amber-500">{item.gold} E</span> · <span className="text-slate-500 dark:text-slate-400">{item.silver} P</span> · <span className="text-amber-700">{item.bronze} B</span>
                      </td>
                      <td className="p-4 text-sm text-slate-900 dark:text-white">{item.submitted_by}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'OFFICIAL' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : item.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' : item.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(item.submitted_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {item.status === 'PENDING' && canVerify && (
                            <>
                              <button type="button" disabled={submitting} onClick={() => void transition(item, 'verify')} className="inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                                <CheckCircle2 className="mr-1 h-4 w-4" />Verifikasi
                              </button>
                              <button type="button" disabled={submitting} onClick={() => void transition(item, 'reject')} className="inline-flex min-h-9 items-center rounded-lg border border-red-300 px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50">
                                <XCircle className="mr-1 h-4 w-4" />Tolak
                              </button>
                            </>
                          )}
                          {item.status === 'VERIFIED' && canPublish && (
                            <button type="button" disabled={submitting} onClick={() => void transition(item, 'publish')} className="inline-flex min-h-9 items-center rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                              <Send className="mr-1 h-4 w-4" />Publikasikan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <TablePagination
              currentPage={subTable.currentPage}
              totalPages={subPagination.totalPages}
              totalItems={subPagination.totalItems}
              startItem={subPagination.startItem}
              endItem={subPagination.endItem}
              onPageChange={subTable.handleChangePage}
            />
          </>
        )}
      </section>

      {/* Standings Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
            <Medal className="h-5 w-5 text-amber-500" />Klasemen resmi
          </h2>
          <RowsPerPageSelector
            rowsPerPage={stdTable.rowsPerPage}
            onChange={stdTable.handleChangeRowsPerPage}
          />
        </div>
        
        {standings.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center p-10 text-slate-500 dark:text-slate-400">
            <p>Belum ada medali yang berstatus OFFICIAL.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full border-collapse text-left min-w-[650px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  <tr>
                    <SortableHeader<StandingSortKey> sortKey="kontingen" currentSortKey={stdTable.sortKey} direction={stdTable.sortDirection} onSort={stdTable.handleSort} className="p-4 font-medium">Kontingen</SortableHeader>
                    <SortableHeader<StandingSortKey> sortKey="gold" currentSortKey={stdTable.sortKey} direction={stdTable.sortDirection} onSort={stdTable.handleSort} className="p-4 font-medium text-center">Emas</SortableHeader>
                    <SortableHeader<StandingSortKey> sortKey="silver" currentSortKey={stdTable.sortKey} direction={stdTable.sortDirection} onSort={stdTable.handleSort} className="p-4 font-medium text-center">Perak</SortableHeader>
                    <SortableHeader<StandingSortKey> sortKey="bronze" currentSortKey={stdTable.sortKey} direction={stdTable.sortDirection} onSort={stdTable.handleSort} className="p-4 font-medium text-center">Perunggu</SortableHeader>
                    <SortableHeader<StandingSortKey> sortKey="total" currentSortKey={stdTable.sortKey} direction={stdTable.sortDirection} onSort={stdTable.handleSort} className="p-4 font-medium text-center">Total</SortableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {stdPagination.paginatedData.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {kontingenMap.get(item.kontingen_id) || item.kontingen_id}
                      </td>
                      <td className="p-4 text-center font-black text-amber-500">{item.gold}</td>
                      <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{item.silver}</td>
                      <td className="p-4 text-center font-bold text-amber-700">{item.bronze}</td>
                      <td className="p-4 text-center text-xl font-black text-indigo-600 dark:text-indigo-400">{item.gold + item.silver + item.bronze}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <TablePagination
              currentPage={stdTable.currentPage}
              totalPages={stdPagination.totalPages}
              totalItems={stdPagination.totalItems}
              startItem={stdPagination.startItem}
              endItem={stdPagination.endItem}
              onPageChange={stdTable.handleChangePage}
            />
          </>
        )}
      </section>

      <ModalForm 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Ajukan Perolehan Medali" 
        onSubmit={createSubmission} 
        submitting={submitting} 
        submitText="Kirim untuk verifikasi"
      >
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Kontingen
          <select 
            required 
            value={form.kontingen_id} 
            onChange={(event) => setForm({ ...form, kontingen_id: event.target.value })} 
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Pilih kontingen</option>
            {kontingens.map((item) => (
              <option key={item.id} value={item.id} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">{item.name}</option>
            ))}
          </select>
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {(['gold','silver','bronze'] as const).map((field) => (
            <label key={field} className="text-sm font-bold capitalize text-slate-900 dark:text-white">
              {field}
              <input 
                type="number" 
                min="0" 
                value={form[field]} 
                onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} 
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
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
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
            placeholder="https://..." 
          />
        </label>
        
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Catatan
          <textarea 
            value={form.notes} 
            onChange={(event) => setForm({ ...form, notes: event.target.value })} 
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
          />
        </label>
      </ModalForm>
    </div>
  );
}
