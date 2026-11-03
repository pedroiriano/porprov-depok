"use client";
import {Suspense,useCallback,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {PortalLink} from '@/components/PortalProvider';
import {PublicPageHero} from '@/components/PublicPageHero';
import {MatchResultCard,type PublicScore} from '@/components/MatchResultCard';
import {MatchResultList} from '@/components/MatchResultList';
import {ScheduleDayStrip} from '@/components/ScheduleDayStrip';
import {ScheduleDialog} from '@/components/ScheduleDetails';
import {publicApiUrl,unwrapCollection} from '@/lib/public-api';
import {normalizeEnrichedMatch,type EnrichedMatch,type RawEnrichedMatch} from '@/lib/public-models';
import {canonicalMatchId} from '../../../../../packages/portal-config/schedule-results';
import {jakartaDate} from '../../../../../packages/portal-config/schedule-calendar';

type Score=PublicScore&{sequence?:number;revisionNumber?:number};
type ResultRow={match:RawEnrichedMatch;score:Score};
function ResultsContent(){
  const query=useSearchParams();const requested=query.get('match')||'';
  const invalid=query.getAll('match').length>1||(query.has('match')&&!canonicalMatchId(requested));
  const [today,setToday]=useState(()=>jakartaDate());const [date,setDate]=useState(()=>jakartaDate());const [month,setMonth]=useState(()=>jakartaDate().slice(0,7));const [followToday,setFollowToday]=useState(true);
  const [matches,setMatches]=useState<EnrichedMatch[]>([]);const [scores,setScores]=useState<Record<string,Score>>({});
  const [page,setPage]=useState(1);const [total,setTotal]=useState(0);const [search,setSearch]=useState('');const [term,setTerm]=useState('');const [details,setDetails]=useState<EnrichedMatch|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [connected,setConnected]=useState(false);const [refresh,setRefresh]=useState(0);
  const activePage=requested?1:page;
  const load=useCallback(async(signal:AbortSignal)=>{
    if(invalid){setMatches([]);setTotal(0);setLoading(false);setError('Tautan pertandingan tidak valid. Buka kembali melalui Jadwal.');return;}
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams({page:String(activePage),per_page:'20',sort:'date',direction:'desc'});
      if(requested)params.set('match_id',requested);else{params.set('month',month);if(date)params.set('date',date);if(term)params.set('q',term);}
      const response=await fetch(publicApiUrl(`/livescore/results?${params}`),{cache:'no-store',signal});if(!response.ok)throw new Error('Unavailable');
      const raw=await response.json();if(signal.aborted)return;const rows=unwrapCollection<ResultRow>(raw);
      setMatches(rows.map(row=>normalizeEnrichedMatch(row.match)));setScores(current=>Object.fromEntries(rows.map(row=>{const old=current[row.score.matchId];return [row.score.matchId,old&&(old.sequence||old.revisionNumber||0)>(row.score.sequence||row.score.revisionNumber||0)?old:row.score];})));setTotal(Number.isSafeInteger(raw.total)?raw.total:0);
    }catch{if(!signal.aborted)setError('Hasil pertandingan belum dapat dimuat. Silakan coba lagi.');}
    finally{if(!signal.aborted)setLoading(false);}
  },[activePage,requested,invalid,term,date,month]);
  useEffect(()=>{const controller=new AbortController();const timeout=setTimeout(()=>{controller.abort();setLoading(false);setError('Hasil pertandingan belum dapat dimuat. Silakan coba lagi.');},15000);const start=setTimeout(()=>void load(controller.signal).finally(()=>clearTimeout(timeout)),0);return()=>{clearTimeout(start);clearTimeout(timeout);controller.abort();};},[load,refresh]);
  useEffect(()=>{const timer=setInterval(()=>{const next=jakartaDate();setToday(next);if(followToday){setDate(next);setMonth(next.slice(0,7));}setRefresh(v=>v+1);},30000);return()=>clearInterval(timer);},[followToday]);
  useEffect(()=>{
    if(invalid)return;
    const events=new EventSource(publicApiUrl('/stream/events'));let queued:ReturnType<typeof setTimeout>|undefined;
    events.onopen=()=>{setConnected(true);setRefresh(v=>v+1);};events.onerror=()=>setConnected(false);
    events.onmessage=event=>{try{const item=JSON.parse(event.data);if(!canonicalMatchId(item.matchId||'')||!['LIVESCORE_UPDATED','LIVESCORE_CORRECTED'].includes(item.eventType)||!Number.isFinite(item.scoreA)||!Number.isFinite(item.scoreB)||item.scoreA<0||item.scoreB<0)return;
      setScores(current=>{const old=current[item.matchId];if(!old||(old.sequence||old.revisionNumber||0)>(item.sequence||item.revisionNumber||0))return current;return {...current,[item.matchId]:item};});
      // PERFORMANCE: Coalesce bursts; a newly recorded result enters the server-filtered day without fetching all scores.
      if(!queued)queued=setTimeout(()=>{queued=undefined;setRefresh(v=>v+1);},1000);
    }catch{/* SECURITY: Stream values remain text; malformed events are ignored. */}};
    return()=>{events.close();if(queued)clearTimeout(queued);};
  },[invalid]);
  const chooseDate=(value:string)=>{setDate(value);if(value)setMonth(value.slice(0,7));setFollowToday(value===today);setPage(1);};
  const chooseMonth=(value:string)=>{setMonth(value);setDate('');setFollowToday(false);setPage(1);};
  const dateLabel=date?new Date(`${date}T12:00:00Z`).toLocaleDateString('id-ID',{timeZone:'UTC',dateStyle:'full'}):new Date(`${month}-01T12:00:00Z`).toLocaleDateString('id-ID',{timeZone:'UTC',month:'long',year:'numeric'});
  const selectedScore=details?scores[details.id]:undefined;
  return <main className="bg-slate-50 dark:bg-slate-950"><PublicPageHero compact eyebrow="Skor dan hasil laga" title="Hasil Pertandingan" description="Skor terbaru dan hasil pertandingan setiap hari." icon="ri-trophy-line" breadcrumbs={[{label:'Hasil'}]}/><div className="container py-8 md:py-12">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs font-bold text-slate-600 dark:text-slate-300">{connected?'Pembaruan langsung aktif':'Pembaruan berkala aktif'}</p><PortalLink href="/jadwal#rincian-pertandingan" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 dark:text-sky-300">← Jadwal pertandingan</PortalLink></div>
    {requested?<div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="text-sm">Hasil pertandingan pilihan Anda.</p><PortalLink href="/livescore" className="inline-flex min-h-11 items-center font-bold text-blue-700 dark:text-sky-300">Hasil hari ini</PortalLink></div>:<>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{date===today?'Hasil hari ini':'Hasil pilihan'}</h2><p className="mt-1 hidden text-sm text-slate-600 sm:block dark:text-slate-300">{dateLabel} · WIB</p></div><label className="text-sm font-bold">Pilih bulan<input type="month" min="2000-01" max="2100-12" value={month} onChange={event=>{if(event.target.validity.valid&&event.target.value)chooseMonth(event.target.value);}} className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"/></label></div>
      <ScheduleDayStrip compact month={month} date={date} today={today} onMonth={chooseMonth} onDate={chooseDate} label="hasil pertandingan"/>
      <details className="my-3"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-sky-300">{term?`Pencarian: ${term}`:'Cari Cabor atau peserta'}</summary><form className="my-3 flex gap-2" onSubmit={event=>{event.preventDefault();setTerm(search.trim());setPage(1);}}><label className="min-w-0 flex-1 text-sm font-bold">Cari hasil<input type="search" maxLength={80} value={search} onChange={event=>setSearch(event.target.value)} placeholder="Cabor, peserta, atau venue" className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"/></label><button type="submit" className="mt-7 min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white focus:ring-2 focus:ring-blue-500">Cari</button></form></details>
    </>}
    {error?<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"><p>{error}</p>{!invalid&&<button type="button" className="mt-3 min-h-11 font-bold underline" onClick={()=>setRefresh(v=>v+1)}>Coba lagi</button>}</div>:loading?<p role="status" className="py-10 text-center">Memuat hasil pertandingan…</p>:matches.length?<MatchResultList matches={matches} scores={scores} onOpen={setDetails}/>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><h2 className="text-lg font-black">{requested?'Hasil belum tersedia':date===today?'Belum ada hasil hari ini':'Belum ada hasil pada periode ini'}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Hasil tampil setelah skor dicatat. Anda juga dapat memilih tanggal atau melihat Jadwal.</p></div>}
    {!requested&&!error&&total>0&&<nav aria-label="Halaman hasil pertandingan" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><p>Menampilkan {Math.min((activePage-1)*20+1,total)}–{Math.min(activePage*20,total)} dari {total} hasil</p><div className="flex gap-2"><button type="button" disabled={loading||page===1} onClick={()=>setPage(v=>v-1)} className="min-h-11 rounded-xl border border-slate-300 px-4 disabled:opacity-40 dark:border-slate-600">Sebelumnya</button><button type="button" disabled={loading||page*20>=total} onClick={()=>setPage(v=>v+1)} className="min-h-11 rounded-xl border border-slate-300 px-4 disabled:opacity-40 dark:border-slate-600">Berikutnya</button></div></nav>}
    <ScheduleDialog open={!!details} title="Rincian hasil pertandingan" onClose={()=>setDetails(null)}>{details&&<><MatchResultCard match={details} score={selectedScore} link={false}/><PortalLink href="/jadwal#rincian-pertandingan" className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700 dark:text-sky-300">Lihat jadwal pertandingan →</PortalLink></>}</ScheduleDialog>
  </div></main>;
}
export default function LiveScorePage(){return <Suspense fallback={<p role="status" className="p-10">Memuat hasil pertandingan…</p>}><ResultsContent/></Suspense>;}
