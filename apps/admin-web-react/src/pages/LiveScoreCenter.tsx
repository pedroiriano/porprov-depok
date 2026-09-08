import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Activity, CircleGauge, History, Loader2, Radio, RefreshCw, Send, Trophy } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { AdminAlert, AdminEmptyState, AdminLoadingState, AdminPageHeader } from '../components/cuba/AdminPrimitives';
import { API_BASE_URL, apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';
import { useAuthorization } from '../contexts/authorization';

interface ScheduleParticipant { participant_type: 'individual' | 'team' | 'contingent'; kontingen_name: string; athlete_name: string; team_name: string; slot: number; display_name: string }
interface ScheduleMatch { id: string; cabor_name: string; nomor_tanding_name: string; venue_name: string; round: string; status: string; participants?: ScheduleParticipant[] }
interface ScoreRecord { matchId: string; revisionId: string; revisionNumber: number; scoreA: number; scoreB: number; status: string; actor: string; timestamp: string; correctionReason?: string }
interface LiveEvent extends Partial<ScoreRecord> { eventId?: string; eventType?: string; sequence?: number; isCorrection?: boolean }

const scoreStatuses = [
  { value: 'Belum Mulai', label: 'Belum Mulai' },
  { value: 'Berlangsung', label: 'Berlangsung' },
  { value: 'Istirahat', label: 'Istirahat' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Official', label: 'Resmi' },
];

const scoreStatusLabel = (value: string) => scoreStatuses.find((item) => item.value === value)?.label || value;

function StatCard({ icon, label, value, tone = 'blue' }: { icon: ReactNode; label: string; value: string | number; tone?: 'blue' | 'emerald' | 'amber' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  }[tone];
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones}`}>{icon}</span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</p><p className="truncate text-xl font-black text-slate-950 dark:text-white">{value}</p></div></div></div>;
}

export default function LiveScoreCenter() {
  const auth = useAuth();
  const authorization = useAuthorization();
  const canManage = authorization.hasPermission('livescore.manage');
  const token = auth.user?.access_token;
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreRecord>>({});
  const [history, setHistory] = useState<ScoreRecord[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [matchId, setMatchId] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [status, setStatus] = useState('Berlangsung');
  const [correction, setCorrection] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const receivedEventKeys = useRef(new Set<string>());

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [matchResponse, scoreResponse] = await Promise.all([
        apiClient.get<ScheduleMatch[]>('/schedule/matches/enriched', authConfig(token)),
        apiClient.get<ScoreRecord[]>('/livescore/', authConfig(token)),
      ]);
      const matchItems = unwrapApiData<ScheduleMatch[]>(matchResponse.data) || [];
      const scoreItems = unwrapApiData<ScoreRecord[]>(scoreResponse.data) || [];
      setMatches(matchItems);
      setScores(Object.fromEntries(scoreItems.map((item) => [item.matchId, item])));
      setMatchId((current) => current || matchItems[0]?.id || '');
      setFeedback(null);
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal memuat Pusat Skor Langsung.') });
    } finally { setLoading(false); }
  }, [token]);

  const loadHistory = useCallback(async (selectedMatchId: string) => {
    if (!token || !selectedMatchId) { setHistory([]); return; }
    try {
      const response = await apiClient.get<ScoreRecord[]>(`/livescore/matches/${selectedMatchId}/history`, authConfig(token));
      setHistory(unwrapApiData<ScoreRecord[]>(response.data) || []);
    } catch { setHistory([]); }
  }, [token]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { void loadHistory(matchId); }, [loadHistory, matchId]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setConnected(false);
    const connect = async () => {
      let retry = 0;
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(`${API_BASE_URL}/stream/admin/events`, { headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' }, signal: controller.signal });
          if (!response.ok || !response.body) throw new Error('Pembaruan langsung belum tersedia.');
          setConnected(true);
          retry = 0;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';
            for (const block of blocks) {
              const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('');
              if (!data) continue;
              try {
                const liveEvent = JSON.parse(data) as LiveEvent;
                if (!liveEvent.eventType?.startsWith('LIVESCORE_')) continue;
                const eventKey = liveEvent.eventId || `${liveEvent.matchId}:${liveEvent.sequence || liveEvent.revisionNumber}:${liveEvent.eventType}`;
                if (receivedEventKeys.current.has(eventKey)) continue;
                receivedEventKeys.current.add(eventKey);
                if (receivedEventKeys.current.size > 500) receivedEventKeys.current.delete(receivedEventKeys.current.values().next().value as string);
                setEvents((current) => [liveEvent, ...current].slice(0, 30));
                if (liveEvent.matchId) {
                  setScores((current) => ({ ...current, [liveEvent.matchId as string]: { matchId: liveEvent.matchId as string, revisionId: liveEvent.revisionId || '', revisionNumber: liveEvent.sequence || liveEvent.revisionNumber || 0, scoreA: liveEvent.scoreA || 0, scoreB: liveEvent.scoreB || 0, status: liveEvent.status || 'Berlangsung', actor: liveEvent.actor || '', timestamp: liveEvent.timestamp || new Date().toISOString(), correctionReason: liveEvent.correctionReason } }));
                  if (liveEvent.matchId === matchId) void loadHistory(matchId);
                }
              } catch { /* INFO: heartbeat/ready payload tidak masuk event log. */ }
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        } finally {
          setConnected(false);
        }
        if (controller.signal.aborted) return;
        retry += 1;
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(30_000, 1_000 * (2 ** Math.min(retry, 5)))));
      }
    };
    void connect();
    return () => controller.abort();
  }, [loadHistory, matchId, token]);

  const selectedMatch = useMemo(() => matches.find((match) => match.id === matchId), [matchId, matches]);
  const selectedParticipants = useMemo(() => [...(selectedMatch?.participants || [])].sort((first, second) => first.slot - second.slot).slice(0, 2), [selectedMatch]);
  const participantsReady = selectedParticipants.length === 2 && selectedParticipants.every((participant) => participant.display_name && participant.display_name !== 'Peserta menunggu konfirmasi');

  useEffect(() => {
    const current = scores[matchId];
    if (current) { setScoreA(current.scoreA); setScoreB(current.scoreB); setStatus(current.status); }
  }, [matchId, scores]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !matchId || !canManage) return;
    if (!participantsReady) {
      setFeedback({ type: 'error', message: 'Susunan Peserta A/B belum lengkap. Lengkapi melalui Data Utama → Jadwal Pertandingan sebelum memasukkan skor.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = { matchId, scoreA, scoreB, status, correctionReason: correction ? correctionReason : undefined, expectedRevision: scores[matchId]?.revisionNumber || 0 };
      await apiClient.post(correction ? `/livescore/matches/${matchId}/correct` : '/livescore/update', payload, authConfig(token));
      setFeedback({ type: 'success', message: correction ? 'Koreksi tersimpan sebagai catatan perubahan baru.' : 'Skor tersimpan dan pembaruan sedang diteruskan.' });
      setCorrectionReason('');
      await Promise.all([loadData(), loadHistory(matchId)]);
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal menyimpan skor.') });
    } finally { setSubmitting(false); }
  };

  const matchOptions = useMemo(() => matches.map((match) => {
    const names = [...(match.participants || [])].sort((a, b) => a.slot - b.slot).map((participant) => participant.display_name).join(' melawan ');
    return { id: match.id, label: `${match.cabor_name} · ${match.nomor_tanding_name} · ${names || 'peserta belum lengkap'}` };
  }), [matches]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="Pencatatan skor resmi" title="Pusat Skor Langsung" description="Kelola skor, status pertandingan, dan koreksi yang tercatat sebagai riwayat baru. Susunan peserta tetap dikelola melalui Jadwal Pertandingan." actions={<><span className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-black ${connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'}`} role="status"><Radio className={`size-4 ${connected ? 'animate-pulse' : ''}`} aria-hidden="true" />{connected ? 'Pembaruan langsung aktif' : 'Menghubungkan pembaruan'}</span><button type="button" onClick={() => void loadData()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCw className="size-4" aria-hidden="true" />Perbarui</button></>} />
      {feedback && <AdminAlert tone={feedback.type === 'error' ? 'danger' : 'success'}>{feedback.message}</AdminAlert>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan skor langsung">
        <StatCard icon={<Trophy className="size-5" aria-hidden="true" />} label="Pertandingan" value={matches.length} />
        <StatCard icon={<CircleGauge className="size-5" aria-hidden="true" />} label="Skor tercatat" value={Object.keys(scores).length} tone="emerald" />
        <StatCard icon={<History className="size-5" aria-hidden="true" />} label="Riwayat terpilih" value={history.length} tone="amber" />
        <StatCard icon={<Activity className="size-5" aria-hidden="true" />} label="Pembaruan sesi ini" value={events.length} />
      </section>

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminLoadingState label="Memuat skor langsung..." /></div> : matches.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><AdminEmptyState icon={Trophy} title="Belum ada pertandingan" description="Susun pertandingan dan Peserta A/B pada Jadwal Pertandingan sebelum membuka input skor." action={<a href={`${import.meta.env.BASE_URL}master-data?tab=jadwal`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">Buka Jadwal Pertandingan</a>} /></div> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
          <form onSubmit={submit} className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
            {!canManage && <div className="mb-4"><AdminAlert tone="warning">Akun Anda hanya dapat melihat skor. Hubungi Pengelola Utama jika tugas Anda memerlukan izin mengubah skor.</AdminAlert></div>}
            <fieldset disabled={!canManage} className="contents">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200"><Send className="size-5" aria-hidden="true" /></span><div><h2 className="font-black text-slate-950 dark:text-white">Masukkan skor resmi</h2><p className="text-xs text-slate-500 dark:text-slate-300">Setiap penyimpanan menghasilkan catatan perubahan baru.</p></div></div>
            <div className="mt-4"><AdminAlert tone="warning"><strong>Alur resmi:</strong> halaman ini hanya mencatat skor, status, dan koreksi. Peserta tidak dapat diubah dari sini.</AdminAlert></div>
            <label htmlFor="livescore-match" className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-200">Pertandingan</label>
            <select id="livescore-match" required value={matchId} onChange={(event) => setMatchId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><option value="">Pilih pertandingan</option>{matchOptions.map((match) => <option key={match.id} value={match.id}>{match.label}</option>)}</select>
            {selectedMatch && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70"><p className="font-black text-slate-900 dark:text-white">{selectedParticipants.map((item) => item.display_name).join(' melawan ') || 'Peserta belum diatur'}</p><p className="mt-1 text-slate-500 dark:text-slate-300">{selectedMatch.venue_name} · {selectedMatch.round}</p></div>}
            {selectedMatch && !participantsReady && <div className="mt-3"><AdminAlert tone="warning">Input skor dikunci sampai Peserta A dan B dilengkapi pada Jadwal Pertandingan.</AdminAlert></div>}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              <label className="min-w-0 text-sm font-bold text-slate-700 dark:text-slate-200"><span className="block truncate">Skor A — {selectedParticipants[0]?.display_name || 'belum dipilih'}</span><input type="number" min="0" disabled={!participantsReady} value={scoreA} onChange={(event) => setScoreA(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-center text-xl font-black text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
              <label className="min-w-0 text-sm font-bold text-slate-700 dark:text-slate-200"><span className="block truncate">Skor B — {selectedParticipants[1]?.display_name || 'belum dipilih'}</span><input type="number" min="0" disabled={!participantsReady} value={scoreB} onChange={(event) => setScoreB(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-center text-xl font-black text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
            </div>
            <label htmlFor="livescore-status" className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-200">Status</label>
            <select id="livescore-status" value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">{scoreStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <label className="mt-5 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-slate-700 dark:border-slate-700 dark:text-slate-200"><input type="checkbox" checked={correction} onChange={(event) => setCorrection(event.target.checked)} className="size-4 rounded accent-blue-600 focus:ring-2 focus:ring-blue-500" /><span className="text-sm font-bold">Ini adalah koreksi skor</span></label>
            {correction && <label htmlFor="correction-reason" className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-200">Alasan koreksi<textarea id="correction-reason" required minLength={5} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" placeholder="Jelaskan sumber dan alasan koreksi" /></label>}
            <button type="submit" disabled={submitting || !matchId || !participantsReady} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-black text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900">{submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}{correction ? 'Simpan koreksi' : 'Simpan pembaruan skor'}</button>
            </fieldset>
          </form>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><History className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Riwayat perubahan</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{history.length} catatan</span></div>
              {history.length === 0 ? <AdminEmptyState icon={History} title="Belum ada riwayat" description="Skor pertama pertandingan ini belum disimpan." /> : <div className="mt-4 space-y-3">{history.map((item) => <article key={item.revisionId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-950 dark:text-white">Perubahan #{item.revisionNumber} · {item.scoreA}—{item.scoreB}</p><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">{scoreStatusLabel(item.status)}</span></div><p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-300">{new Date(item.timestamp).toLocaleString('id-ID')} · Pelaku {item.actor}</p>{item.correctionReason && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Koreksi: {item.correctionReason}</p>}</article>)}</div>}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><Activity className="size-5 text-blue-600 dark:text-blue-300" aria-hidden="true" />Pembaruan langsung</h2><span className={`size-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" /></div>
              {events.length === 0 ? <AdminEmptyState icon={Radio} title="Belum ada pembaruan baru" description="Perubahan skor pada sesi ini akan muncul secara langsung." /> : <div className="mt-4 max-h-80 space-y-2 overflow-auto rounded-xl bg-slate-950 p-3">{events.map((item, index) => <div key={`${item.eventId}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-emerald-300">Pembaruan skor pertandingan diterima · urutan {item.sequence || index + 1}</div>)}</div>}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
