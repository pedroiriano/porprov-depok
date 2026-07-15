import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, History, Loader2, Radio, RefreshCw, Send } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { API_BASE_URL, apiClient, authConfig, getApiErrorMessage, unwrapApiData } from '../lib/api';

interface ScheduleMatch {
  id: string;
  cabor_name: string;
  nomor_tanding_name: string;
  venue_name: string;
  round: string;
  status: string;
  participants?: Array<{ display_name: string }>;
}

interface ScoreRecord {
  matchId: string;
  revisionId: string;
  revisionNumber: number;
  scoreA: number;
  scoreB: number;
  status: string;
  actor: string;
  timestamp: string;
  correctionReason?: string;
}

interface LiveEvent extends Partial<ScoreRecord> {
  eventId?: string;
  eventType?: string;
  sequence?: number;
  isCorrection?: boolean;
}

export default function LiveScoreCenter() {
  const auth = useAuth();
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
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal memuat workspace LiveScore.') });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadHistory = useCallback(async (selectedMatchId: string) => {
    if (!token || !selectedMatchId) {
      setHistory([]);
      return;
    }
    try {
      const response = await apiClient.get<ScoreRecord[]>(`/livescore/matches/${selectedMatchId}/history`, authConfig(token));
      setHistory(unwrapApiData<ScoreRecord[]>(response.data) || []);
    } catch {
      setHistory([]);
    }
  }, [token]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { void loadHistory(matchId); }, [loadHistory, matchId]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stream/admin/events`, { headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' }, signal: controller.signal });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        setConnected(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';
          for (const block of blocks) {
            const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('');
            if (!data) continue;
            try {
              const event = JSON.parse(data) as LiveEvent;
              if (!event.eventType?.startsWith('LIVESCORE_')) continue;
              setEvents((current) => [event, ...current].slice(0, 30));
              if (event.matchId) {
                setScores((current) => ({ ...current, [event.matchId as string]: { matchId: event.matchId as string, revisionId: event.revisionId || '', revisionNumber: event.sequence || event.revisionNumber || 0, scoreA: event.scoreA || 0, scoreB: event.scoreB || 0, status: event.status || 'Berlangsung', actor: event.actor || '', timestamp: event.timestamp || new Date().toISOString(), correctionReason: event.correctionReason } }));
                if (event.matchId === matchId) void loadHistory(matchId);
              }
            } catch { /* INFO: heartbeat/ready payload tidak masuk event log. */ }
          }
        }
      } catch {
        if (!controller.signal.aborted) setConnected(false);
      }
    };
    void connect();
    return () => controller.abort();
  }, [loadHistory, matchId, token]);

  const selectedMatch = useMemo(() => matches.find((match) => match.id === matchId), [matchId, matches]);

  useEffect(() => {
    const current = scores[matchId];
    if (current) {
      setScoreA(current.scoreA);
      setScoreB(current.scoreB);
      setStatus(current.status);
    }
  }, [matchId, scores]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !matchId) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = { matchId, scoreA, scoreB, status, correctionReason: correction ? correctionReason : undefined, expectedRevision: scores[matchId]?.revisionNumber || 0 };
      const endpoint = correction ? `/livescore/matches/${matchId}/correct` : '/livescore/update';
      await apiClient.post(endpoint, payload, authConfig(token));
      setFeedback({ type: 'success', message: correction ? 'Koreksi tersimpan sebagai revisi immutable.' : 'Skor tersimpan dan masuk transactional outbox.' });
      setCorrectionReason('');
      await Promise.all([loadData(), loadHistory(matchId)]);
    } catch (error) {
      setFeedback({ type: 'error', message: getApiErrorMessage(error, 'Gagal menyimpan skor.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Official Scoring Workspace</p><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">LiveScore Center</h1><p className="mt-1 text-sm text-slate-500">Persistence PostgreSQL, revision history, correction reason, audit, dan outbox delivery.</p></div>
        <div className="flex items-center gap-3"><span className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`} role="status"><Radio className={`h-4 w-4 ${connected ? 'animate-pulse' : ''}`} />{connected ? 'Private SSE aktif' : 'Menghubungkan SSE'}</span><button type="button" onClick={() => void loadData()} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-bold"><RefreshCw className="mr-2 h-4 w-4" />Perbarui</button></div>
      </header>

      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{feedback.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}<span>{feedback.message}</span></div>}

      {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="sr-only">Memuat LiveScore</span></div> : <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
        <form onSubmit={submit} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-black"><Send className="h-5 w-5 text-indigo-600" />Input skor resmi</h2>
          <label className="mt-5 block text-sm font-bold">Pertandingan<select required value={matchId} onChange={(event) => setMatchId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:bg-slate-800"><option value="">Pilih pertandingan</option>{matches.map((match) => <option key={match.id} value={match.id}>{match.cabor_name} · {match.nomor_tanding_name} · {match.round}</option>)}</select></label>
          {selectedMatch && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="font-bold">{selectedMatch.participants?.map((item) => item.display_name).join(' vs ') || 'Peserta menunggu konfirmasi'}</p><p className="mt-1 text-slate-500">{selectedMatch.venue_name}</p></div>}
          <div className="mt-5 grid grid-cols-2 gap-4"><label className="text-sm font-bold">Skor A<input type="number" min="0" value={scoreA} onChange={(event) => setScoreA(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-center text-xl font-black dark:bg-slate-800" /></label><label className="text-sm font-bold">Skor B<input type="number" min="0" value={scoreB} onChange={(event) => setScoreB(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-center text-xl font-black dark:bg-slate-800" /></label></div>
          <label className="mt-4 block text-sm font-bold">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:bg-slate-800">{['Belum Mulai','Berlangsung','Istirahat','Selesai','Official'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="mt-5 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3"><input type="checkbox" checked={correction} onChange={(event) => setCorrection(event.target.checked)} /><span className="text-sm font-bold">Ini adalah koreksi skor</span></label>
          {correction && <label className="mt-4 block text-sm font-bold">Alasan koreksi<textarea required minLength={5} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 dark:bg-slate-800" placeholder="Jelaskan sumber dan alasan koreksi" /></label>}
          <button type="submit" disabled={submitting || !matchId} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 font-black text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{correction ? 'Simpan koreksi' : 'Simpan update skor'}</button>
        </form>

        <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><History className="h-5 w-5 text-indigo-600" />Riwayat revisi</h2><span className="text-xs font-bold text-slate-500">{history.length} revisi</span></div>{history.length === 0 ? <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Belum ada skor tersimpan untuk pertandingan ini.</p> : <div className="mt-4 space-y-3">{history.map((item) => <article key={item.revisionId} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">Revisi #{item.revisionNumber} · {item.scoreA}—{item.scoreB}</p><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{item.status}</span></div><p className="mt-2 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString('id-ID')} · actor {item.actor}</p>{item.correctionReason && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Koreksi: {item.correctionReason}</p>}</article>)}</div>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-black"><Activity className="h-5 w-5 text-indigo-600" />Private event stream</h2>{events.length === 0 ? <p className="mt-6 text-sm text-slate-500">Belum ada event baru pada sesi ini.</p> : <div className="mt-4 max-h-80 space-y-2 overflow-auto">{events.map((item, index) => <div key={`${item.eventId}-${index}`} className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-300">{item.eventType} · match {item.matchId} · sequence {item.sequence}</div>)}</div>}</section></div>
      </div>}
    </div>
  );
}
