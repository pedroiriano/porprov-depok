import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Medal, Plus, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import ModalForm from '../components/common/ModalForm';
import { apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';

interface Kontingen { id: string; name: string }
interface Standing { id: string; kontingen_id: string; gold: number; silver: number; bronze: number; updated_at: string }
interface Submission {
  id: string; kontingen_id: string; gold: number; silver: number; bronze: number; evidence_url?: string; notes?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'OFFICIAL'; submitted_by: string; verified_by?: string; rejected_by?: string; published_by?: string; verification_notes?: string; submitted_at: string;
}

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Verification Workflow</p><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Perolehan Medali</h1><p className="mt-1 text-sm text-slate-500">Pengajuan tidak mengubah klasemen sampai diverifikasi dan dipublikasikan.</p></div><div className="flex gap-3"><button type="button" onClick={() => void loadData()} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-bold"><RefreshCw className="mr-2 h-4 w-4" />Perbarui</button>{canSubmit && <button type="button" onClick={() => setModalOpen(true)} className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-bold text-white"><Plus className="mr-2 h-4 w-4" />Ajukan medali</button>}</div></header>
      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{feedback.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}{feedback.message}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5 text-indigo-600" />Antrean verifikasi</h2><label className="text-sm font-bold">Status <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700"><option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Semua</option>{['PENDING','VERIFIED','REJECTED','OFFICIAL'].map((value) => <option key={value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{value}</option>)}</select></label></div>
        {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div> : submissions.length === 0 ? <p className="mt-5 rounded-xl border border-dashed p-10 text-center text-slate-500">Tidak ada pengajuan pada filter ini.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4">Kontingen</th><th className="p-4 text-center">Medali</th><th className="p-4">Pengaju</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{submissions.map((item) => <tr key={item.id}><td className="p-4"><p className="font-black">{kontingenMap.get(item.kontingen_id) || item.kontingen_id}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.submitted_at).toLocaleString('id-ID')}</p>{item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}</td><td className="p-4 text-center font-black"><span className="text-amber-500">{item.gold} E</span> · <span>{item.silver} P</span> · <span className="text-amber-700">{item.bronze} B</span></td><td className="p-4 text-sm">{item.submitted_by}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === 'OFFICIAL' ? 'bg-emerald-100 text-emerald-700' : item.status === 'REJECTED' ? 'bg-red-100 text-red-700' : item.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span></td><td className="p-4"><div className="flex justify-end gap-2">{item.status === 'PENDING' && canVerify && <><button type="button" disabled={submitting} onClick={() => void transition(item, 'verify')} className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white"><CheckCircle2 className="mr-1 h-4 w-4" />Verifikasi</button><button type="button" disabled={submitting} onClick={() => void transition(item, 'reject')} className="inline-flex min-h-10 items-center rounded-lg border border-red-300 px-3 text-sm font-bold text-red-700"><XCircle className="mr-1 h-4 w-4" />Tolak</button></>}{item.status === 'VERIFIED' && canPublish && <button type="button" disabled={submitting} onClick={() => void transition(item, 'publish')} className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white"><Send className="mr-1 h-4 w-4" />Publikasikan</button>}</div></td></tr>)}</tbody></table></div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-black"><Medal className="h-5 w-5 text-amber-500" />Klasemen resmi</h2>{standings.length === 0 ? <p className="mt-5 rounded-xl border border-dashed p-10 text-center text-slate-500">Belum ada medali yang berstatus OFFICIAL.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px]"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="p-4 text-left">Kontingen</th><th className="p-4">Emas</th><th className="p-4">Perak</th><th className="p-4">Perunggu</th><th className="p-4">Total</th></tr></thead><tbody>{standings.map((item) => <tr key={item.id} className="border-t border-slate-200 text-center"><th className="p-4 text-left">{kontingenMap.get(item.kontingen_id) || item.kontingen_id}</th><td className="p-4 font-black text-amber-500">{item.gold}</td><td className="p-4 font-bold">{item.silver}</td><td className="p-4 font-bold text-amber-700">{item.bronze}</td><td className="p-4 text-xl font-black text-indigo-600">{item.gold + item.silver + item.bronze}</td></tr>)}</tbody></table></div>}</section>

      <ModalForm isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Ajukan Perolehan Medali" onSubmit={createSubmission} submitting={submitting} submitText="Kirim untuk verifikasi"><label className="block text-sm font-bold">Kontingen<select required value={form.kontingen_id} onChange={(event) => setForm({ ...form, kontingen_id: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Pilih kontingen</option>{kontingens.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="grid grid-cols-3 gap-3">{(['gold','silver','bronze'] as const).map((field) => <label key={field} className="text-sm font-bold capitalize">{field}<input type="number" min="0" value={form[field]} onChange={(event) => setForm({ ...form, [field]: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>)}</div><label className="block text-sm font-bold">URL bukti<input type="url" value={form.evidence_url} onChange={(event) => setForm({ ...form, evidence_url: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="https://..." /></label><label className="block text-sm font-bold">Catatan<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3" /></label></ModalForm>
    </div>
  );
}
